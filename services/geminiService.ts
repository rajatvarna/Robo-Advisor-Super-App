

import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import type { ApiMode, QuestionnaireAnswers, PortfolioSuggestion, FinancialStatementsData, StockChartDataPoint, ChartTimeframe, TranscriptsData, GroundingSource, DashboardData, EducationalContent, StockAnalysisData, ChatMessage, ScreenerCriteria, ScreenerResult, Holding, NewsItem, PortfolioScore, Achievement, Dividend, TaxLossOpportunity, BaseDashboardData, StockComparisonData, UserWatchlist, CryptoData, Alert } from '../types';
import * as FallbackData from './fallbackData';
import { ALL_ACHIEVEMENTS } from './fallbackData';
import { cacheService } from './cacheService';
import * as financialDataService from './financialDataService';
import { API_KEY } from '../process.env.js';


let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        if (!API_KEY || API_KEY === 'YOUR_GEMINI_API_KEY_HERE' || API_KEY === 'DEMO_API_KEY') {
            throw new Error("API_KEY environment variable not set or is a placeholder. The application cannot start.");
        }
        ai = new GoogleGenAI({ apiKey: API_KEY });
    }
    return ai;
};


const checkIsQuotaError = (error: any): boolean => {
    const messageToSearch = (error?.message || JSON.stringify(error)).toLowerCase();
    if (messageToSearch.includes('"status":"resource_exhausted"')) return true;
    return messageToSearch.includes('429') || messageToSearch.includes('quota');
};

const handleApiError = (error: any, context: string): Error => {
    console.error(`Error in ${context}:`, error);
    if (checkIsQuotaError(error)) {
        return new Error("QUOTA_EXCEEDED");
    }
    if (error instanceof Error) {
        if (error.message.includes('API key') || error.message.includes('400') || error.message.includes('403')) {
            return new Error(`The AI call failed for ${context}. Please verify that the API_KEY is configured correctly.`);
        }
        return new Error(`The AI failed to generate ${context}. Reason: ${error.message}`);
    }
    return new Error(`An unknown error occurred while generating ${context}.`);
};

const parseJsonFromText = (text: string, context: string): any => {
    if (!text || text.trim() === '') {
        console.error(`Received empty text from AI for ${context}.`);
        throw new Error(`The AI returned an empty response for ${context}.`);
    }

    // Find text within ```json ... ``` block
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    let jsonString = match ? match[1] : text;

    // If no JSON block found, try to extract from the raw text by finding the first and last brace/bracket
    if (!match) {
        const firstBracket = jsonString.indexOf('{');
        const firstSquare = jsonString.indexOf('[');

        if (firstBracket === -1 && firstSquare === -1) {
            console.error(`No JSON object or array found in text for ${context}. Raw text:`, text);
            throw new Error(`The AI returned a non-JSON response for ${context}.`);
        }

        let start = -1;
        if (firstBracket === -1) start = firstSquare;
        else if (firstSquare === -1) start = firstBracket;
        else start = Math.min(firstBracket, firstSquare);

        const lastBracket = jsonString.lastIndexOf('}');
        const lastSquare = jsonString.lastIndexOf(']');
        const end = Math.max(lastBracket, lastSquare);

        if (end > start) {
            jsonString = jsonString.substring(start, end + 1);
        }
    }

    try {
        // Sanitize common JSON errors like trailing commas
        const sanitizedString = jsonString.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(sanitizedString);
    } catch (e) {
        console.error(`Failed to parse JSON for ${context}. Raw text:`, text, "Error:", e);
        throw new Error(`The AI returned invalid JSON for ${context}.`);
    }
};

export const fetchStockDetailsForPortfolio = async (ticker: string, apiMode: ApiMode): Promise<Pick<Holding, 'companyName' | 'sector'>> => {
    return financialDataService.getCompanyProfile(ticker, apiMode);
}

export const generatePersonalizedNews = async (holdings: Holding[], watchlistTickers: string[], apiMode: ApiMode): Promise<NewsItem[]> => {
    const holdingTickersKey = holdings.map(h => h.ticker).sort().join(',');
    const watchlistTickersKey = [...new Set(watchlistTickers)].sort().join(',');
    const cacheKey = `personalized_news_finnhub_${holdingTickersKey}_${watchlistTickersKey}`;
    const cached = cacheService.get<NewsItem[]>(cacheKey);
    if (cached) return cached;

    if (apiMode === 'opensource') return FallbackData.generatePersonalizedNews(holdings.map(h => h.ticker), watchlistTickers);
    if (holdings.length === 0 && watchlistTickers.length === 0) return [];
    
    try {
        const topHoldingTickers = holdings.sort((a, b) => b.totalValue - a.totalValue).slice(0, 5).map(h => h.ticker);
        const tickers = [...new Set([...topHoldingTickers, ...watchlistTickers])];
        if (tickers.length === 0) return [];

        const newsPromises = tickers.map(ticker => financialDataService.getCompanyNews(ticker, apiMode));
        const newsResults = await Promise.all(newsPromises);
        
        const allNews = newsResults.flat().sort((a, b) => {
            if (!a.publishedAt || !b.publishedAt) return 0;
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        });

        // Remove duplicates by URL and add a unique ID
        const uniqueNews = Array.from(new Map(allNews.map(item => [item.url, { ...item, id: item.url || `news-${Date.now()}-${Math.random()}` }])).values());
        
        const finalNews = uniqueNews.slice(0, 10);
        cacheService.set(cacheKey, finalNews, 6 * 60 * 60 * 1000); // Cache for 6 hours
        return finalNews;
    } catch (error) {
         console.error("Error fetching personalized news from Finnhub", error);
         return FallbackData.generatePersonalizedNews(holdings.map(h=>h.ticker), watchlistTickers);
    }
}

export const getTopBusinessNews = async (apiMode: ApiMode): Promise<NewsItem[]> => {
    const cacheKey = 'top_business_news_gemini_agent';
    const cached = cacheService.get<NewsItem[]>(cacheKey);
    if (cached) return cached;
    
    if (apiMode === 'opensource') return FallbackData.getTopBusinessNews();
    
    const prompt = `Act as a top financial news aggregation agent. Use Google Search to find the 5 most important global business and financial news headlines from today from ONLY the following sources: Bloomberg, The Wall Street Journal, Financial Times, and Reuters.
    For each article, provide the headline, the source name, the URL, a concise one-sentence summary, and the publication date/time in ISO 8601 format.
    Respond with ONLY a valid JSON array of objects with keys "headline", "url", "source", "summary", and "publishedAt". Ensure the URL is valid and directly links to the article.`;
    
    try {
        const response = await getAiClient().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        const newsData = parseJsonFromText(response.text, "top business news");
        if (!Array.isArray(newsData)) {
            throw new Error("AI response was not a JSON array.");
        }
        const news = newsData.map((item: any) => ({...item, id: item.url || `news-${Date.now()}-${Math.random()}` }));
        cacheService.set(cacheKey, news, 60 * 60 * 1000); // Cache for 1 hour
        return news;
    } catch(error) {
        throw handleApiError(error, "top business news");
    }
};

export const getCryptoNews = async (apiMode: ApiMode): Promise<NewsItem[]> => {
    const cacheKey = 'crypto_news_finnhub';
    const cached = cacheService.get<NewsItem[]>(cacheKey);
    if (cached) return cached;
    
    if (apiMode === 'opensource') return FallbackData.getCryptoNews();
     try {
        const news = await financialDataService.getMarketNews('crypto', apiMode);
        cacheService.set(cacheKey, news, 60 * 60 * 1000); // Cache for 1 hour
        return news;
    } catch(error) {
        throw handleApiError(error, "crypto news");
    }
};

export const getTopCryptos = async (apiMode: ApiMode): Promise<CryptoData[]> => {
    const cacheKey = 'top_cryptos';
    const cached = cacheService.get<CryptoData[]>(cacheKey);
    if (cached) return cached;

    if (apiMode === 'opensource') return FallbackData.getTopCryptos();
    const prompt = `Act as a cryptocurrency data API. Use Google Search to find the top 25 cryptocurrencies by market capitalization from sites like Coinbase or CoinMarketCap. For each, provide its name, symbol (ticker), current price in USD, 24-hour percentage change, and market cap in USD. Respond with ONLY a valid JSON array of objects with keys "name", "symbol", "price", "change24h", and "marketCap". Market cap must be a number, not a string. For stablecoins, if 24h change is not applicable, return null for "change24h".`;
    try {
        const response = await getAiClient().models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{ googleSearch: {} }] }});
        const cryptos = parseJsonFromText(response.text, "top cryptos");
        cacheService.set(cacheKey, cryptos, 12 * 60 * 60 * 1000); // Cache for 12 hours
        return cryptos;
    } catch(error) {
        throw handleApiError(error, "top cryptos");
    }
};


export const calculatePortfolioScore = async (holdings: Holding[], apiMode: ApiMode): Promise<PortfolioScore> => {
    const holdingsKey = holdings.map(h => `${h.ticker}:${h.shares}`).sort().join(',');
    const cacheKey = `portfolio_score_${holdingsKey}`;
    const cached = cacheService.get<PortfolioScore>(cacheKey);
    if (cached) return cached;

    if (apiMode === 'opensource') return FallbackData.calculatePortfolioScore(holdings);
    
    const prompt = `Analyze the following portfolio holdings based on diversification (sector, company), quality of assets, and risk. Provide a score from 1-100 and a concise one-sentence summary of your findings.
    Portfolio: ${JSON.stringify(holdings.map(({ticker, totalValue, sector}) => ({ticker, totalValue, sector})))}
    Respond with ONLY a valid JSON object with keys "score" (number) and "summary" (string).`;

    try {
        const response = await getAiClient().models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, summary: { type: Type.STRING } } } } });
        const score = parseJsonFromText(response.text, "portfolio score");
        cacheService.set(cacheKey, score, 8 * 60 * 60 * 1000); // Cache for 8 hours
        return score;
    } catch(error) {
        throw handleApiError(error, "portfolio score");
    }
};

export const checkForAchievements = (action: string, data: any, unlockedIds: string[]): Pick<Achievement, 'id'|'title'>[] => {
    // This function is now client-side, no API call needed.
    const unlockedAchievements: Pick<Achievement, 'id'|'title'>[] = [];
    const availableAchievements = ALL_ACHIEVEMENTS.filter(a => !unlockedIds.includes(a.id));

    for (const achievement of availableAchievements) {
        let unlock = false;
        switch (achievement.id) {
            case 'first_holding': if (action === 'add_holding' && data.holdingsCount === 1) unlock = true; break;
            case 'five_holdings': if (action === 'add_holding' && data.holdingsCount >= 5) unlock = true; break;
            case 'ten_holdings': if (action === 'add_holding' && data.holdingsCount >= 10) unlock = true; break;
            case 'first_screener': if (action === 'run_screener') unlock = true; break;
            case 'diversified_portfolio_5': if (action === 'add_holding' && data.sectorCount >= 5) unlock = true; break;
            case 'diversified_portfolio_8': if (action === 'add_holding' && data.sectorCount >= 8) unlock = true; break;
            case 'high_score_85': if (action === 'portfolio_score' && data.score >= 85) unlock = true; break;
            case 'high_score_95': if (action === 'portfolio_score' && data.score >= 95) unlock = true; break;
        }
        if (unlock) {
            unlockedAchievements.push({ id: achievement.id, title: achievement.title });
        }
    }
    return unlockedAchievements;
};

export const generateDashboardInsights = async (dashboardData: DashboardData, apiMode: ApiMode): Promise<string[]> => {
    const holdingsKey = dashboardData.holdings.map(h => `${h.ticker}:${h.shares}`).sort().join(',');
    const cacheKey = `dashboard_insights_${holdingsKey}`;
    const cached = cacheService.get<string[]>(cacheKey);
    if(cached) return cached;
    
    if (apiMode === 'opensource') return FallbackData.generateDashboardInsights();

    const prompt = `Act as a financial analyst. Based on the following portfolio data, provide 3-4 concise, actionable insights. Focus on sector concentration, recent performance of top holdings, or progress towards the user's goal.
    Data: ${JSON.stringify({
        holdings: dashboardData.holdings.map(({ticker, totalValue, sector, dayChangePercent}) => ({ticker, totalValue, sector, dayChangePercent})),
        netWorth: dashboardData.netWorth,
        goal: dashboardData.goal,
    })}
    Respond with ONLY a valid JSON array of strings.`;

    try {
        const response = await getAiClient().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        });
        const insights = parseJsonFromText(response.text, "dashboard insights");
        cacheService.set(cacheKey, insights, 8 * 60 * 60 * 1000); // Cache for 8 hours
        return insights;
    } catch(error) {
        throw handleApiError(error, "dashboard insights");
    }
};

export const generatePortfolioAlerts = async (dashboardData: DashboardData, apiMode: ApiMode): Promise<Alert[]> => {
    const holdingsKey = dashboardData.holdings.map(h => h.ticker).sort().join(',');
    const cacheKey = `portfolio_alerts_${holdingsKey}`;
    const cached = cacheService.get<Alert[]>(cacheKey);
    if(cached) return cached;
    
    if (apiMode === 'opensource') return FallbackData.generatePortfolioAlerts(dashboardData);
    if (dashboardData.holdings.length === 0) return [];
    
    const prompt = `Act as an automated portfolio monitoring system. Analyze the provided portfolio holdings. Use Google Search to check for any critical news, or significant (>5% in a day) price movements for these tickers today. Also, check for portfolio-level issues like high sector concentration (>40%). If any such events are found, generate an alert.
    Portfolio: ${JSON.stringify(dashboardData.holdings.map(h => ({ticker: h.ticker, sector: h.sector})))}
    Respond with ONLY a valid JSON array of alert objects. Each object should have keys: "id" (a unique string like 'alert-ticker-timestamp'), "timestamp", "type" ('Price', 'News', or 'Portfolio'), "severity" ('Warning' or 'Critical'), "title", "description", and optional "ticker". If no significant events are found, return an empty array.`;

     try {
        const response = await getAiClient().models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{googleSearch: {}}] } });
        const alerts: Alert[] = parseJsonFromText(response.text, "portfolio alerts").map((a: any) => ({...a, read: false}));
        cacheService.set(cacheKey, alerts, 8 * 60 * 60 * 1000); // Cache for 8 hours
        return alerts;
    } catch(error) {
        throw handleApiError(error, "portfolio alerts");
    }
};

export const generateDividendData = async (holdings: Holding[], apiMode: ApiMode): Promise<Dividend[]> => {
    const holdingsKey = holdings.map(h => h.ticker).sort().join(',');
    const cacheKey = `dividend_data_finnhub_${holdingsKey}`;
    const cached = cacheService.get<Dividend[]>(cacheKey);
    if (cached) return cached;
    
    if (apiMode === 'opensource') return FallbackData.generateDividendData(holdings);

    try {
        const dividendPromises = holdings.map(async h => {
            const dividends = await financialDataService.getDividendData(h.ticker, apiMode);
            return dividends.map(d => ({
                ...d,
                companyName: h.companyName,
                totalAmount: d.amountPerShare * h.shares
            }));
        });

        const allDividends = (await Promise.all(dividendPromises)).flat();
        const sortedDividends = allDividends.sort((a,b) => new Date(a.payDate).getTime() - new Date(b.payDate).getTime());
        
        cacheService.set(cacheKey, sortedDividends, 24 * 60 * 60 * 1000); // 24 hour cache
        return sortedDividends;

    } catch(error) {
        throw handleApiError(error, "dividend data");
    }
};

export const generateTaxLossOpportunities = async (holdings: Holding[], apiMode: ApiMode): Promise<TaxLossOpportunity[]> => {
    const holdingsKey = holdings.map(h => `${h.ticker}:${h.unrealizedGain}`).sort().join(',');
    const cacheKey = `tax_loss_opps_${holdingsKey}`;
    const cached = cacheService.get<TaxLossOpportunity[]>(cacheKey);
    if(cached) return cached;

    if (apiMode === 'opensource') return FallbackData.generateTaxLossOpportunities(holdings);

    const losingPositions = holdings.filter(h => h.unrealizedGain < 0);
    if (losingPositions.length === 0) return [];

    const prompt = `Act as a tax-loss harvesting advisor. Analyze the following losing stock positions. For each, determine if it represents a good tax-loss harvesting opportunity. Provide a brief explanation.
    Positions: ${JSON.stringify(losingPositions.map(h => ({ ticker: h.ticker, companyName: h.companyName, unrealizedLoss: h.unrealizedGain, costBasis: h.costBasis, currentValue: h.totalValue })))}
    Respond with ONLY a valid JSON array of objects. Each object should have keys: "ticker", "companyName", "sharesToSell", "estimatedLoss", "costBasis", "currentValue", and "explanation". Return an empty array if no good opportunities are found.`;

    try {
        const response = await getAiClient().models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        const opportunities = parseJsonFromText(response.text, "tax loss opportunities");
        cacheService.set(cacheKey, opportunities, 24 * 60 * 60 * 1000); // 24 hour cache
        return opportunities;
    } catch(error) {
        throw handleApiError(error, "tax loss opportunities");
    }
};

export const generateEducationalContent = async (category: string, apiMode: ApiMode): Promise<EducationalContent[]> => {
    const cacheKey = `edu_content_${category.replace(/\s+/g, '_')}`;
    const cached = cacheService.get<EducationalContent[]>(cacheKey);
    if (cached) return cached;
    
    if (apiMode === 'opensource') return FallbackData.generateEducationalContent(category);
    
    const prompt = `Find 3 high-quality, recent educational resources (articles, videos, or podcasts) related to the financial topic: "${category}". For each resource, provide a title, a brief one-sentence summary, the URL, the source/publication name, and the type ('Article', 'Video', or 'Podcast').
    Respond with ONLY a valid JSON array of objects, where each object has keys: "id" (a unique string like 'res-1'), "type", "title", "summary", "url", and "sourceName".`;

    try {
        const response = await getAiClient().models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{ googleSearch: {} }] } });
        const content = parseJsonFromText(response.text, `educational content for ${category}`);
        cacheService.set(cacheKey, content, 24 * 60 * 60 * 1000); // 24 hour cache
        return content;
    } catch(error) {
        throw handleApiError(error, `educational content for ${category}`);
    }
};

export const screenStocks = async (criteria: ScreenerCriteria, apiMode: ApiMode): Promise<ScreenerResult[]> => {
    const cacheKey = `screener_${JSON.stringify(criteria)}`;
    const cached = cacheService.get<ScreenerResult[]>(cacheKey);
    if(cached) return cached;

    if (apiMode === 'opensource') return FallbackData.screenStocks(criteria);
    
    const prompt = `Act as a stock screener. Use Google Search to find up to 20 stocks listed on US exchanges that match the following criteria:
    - Market Cap: Between ${criteria.marketCapMin}B and ${criteria.marketCapMax === Infinity ? 'any' : `${criteria.marketCapMax}B`} USD.
    - P/E Ratio: Between ${criteria.peRatioMin} and ${criteria.peRatioMax === Infinity ? 'any' : criteria.peRatioMax}.
    - Dividend Yield: Between ${criteria.dividendYieldMin}% and ${criteria.dividendYieldMax === Infinity ? 'any' : `${criteria.dividendYieldMax}%`}.
    - Sectors: ${criteria.sectors.length > 0 ? criteria.sectors.join(', ') : 'Any'}.
    - Minimum Analyst Rating: ${criteria.analystRating}.
    For each stock found, provide its ticker, company name, market cap in billions, P/E ratio, dividend yield, sector, and analyst rating.
    Respond with ONLY a valid JSON array of objects. Each object should have keys: "ticker", "companyName", "marketCap", "peRatio", "dividendYield", "sector", and "analystRating". Return null for peRatio or dividendYield if not applicable.`;

    try {
        const response = await getAiClient().models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{ googleSearch: {} }] } });
        const results = parseJsonFromText(response.text, "stock screener results");
        cacheService.set(cacheKey, results, 60 * 60 * 1000); // 1 hour cache
        return results;
    } catch(error) {
        throw handleApiError(error, "stock screener results");
    }
};

let chat: Chat | null = null;
export const createChat = (apiMode: ApiMode): Chat => {
    if (apiMode === 'opensource') return FallbackData.createChat();
    const systemInstruction = "You are a helpful and friendly financial assistant chatbot. Your goal is to provide accurate, informative, and easy-to-understand answers about finance, investing, and market analysis. You can analyze images of stock charts or portfolios. Do not provide financial advice, but you can explain financial concepts and data. Keep your responses concise and clear.";
    chat = getAiClient().chats.create({ model: "gemini-2.5-flash", config: { systemInstruction } });
    return chat;
};

export const generateFollowUpQuestions = async (chatHistory: ChatMessage[], apiMode: ApiMode): Promise<string[]> => {
    if (apiMode === 'opensource' || chatHistory.length < 2) return FallbackData.generateFollowUpQuestions(chatHistory);

    const lastMessage = chatHistory[chatHistory.length - 1].text;
    const prompt = `Based on this last response: "${lastMessage}", generate 3 concise, relevant follow-up questions a user might ask.
    Respond with ONLY a valid JSON array of strings.`;
    
    try {
        const response = await getAiClient().models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } } });
        return parseJsonFromText(response.text, "follow-up questions");
    } catch(error) {
        console.error("Failed to generate follow-up questions:", error);
        return []; // Return empty array on failure instead of throwing
    }
};

export const generatePortfolio = async (answers: QuestionnaireAnswers, apiMode: ApiMode): Promise<PortfolioSuggestion> => {
    if (apiMode === 'opensource') return FallbackData.generatePortfolio(answers);
    
    const prompt = `Act as a robo-advisor. Based on the following questionnaire answers, determine a risk profile and suggest a suitable portfolio asset allocation (stocks, bonds, cash, commodities, real estate). Provide a concise explanation for your suggestion.
    Answers: ${JSON.stringify(answers)}
    Respond with ONLY a valid JSON object with keys: "riskProfile" (string), "allocation" (object with asset classes as keys and percentages as values), and "explanation" (string). The allocation percentages must sum to 100.`;

    try {
        const response = await getAiClient().models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return parseJsonFromText(response.text, "portfolio suggestion");
    } catch(error) {
        throw handleApiError(error, "portfolio suggestion");
    }
};

export const generateFinancials = async (ticker: string, apiMode: ApiMode): Promise<FinancialStatementsData> => {
    const cacheKey = `financials_finnhub_${ticker}`;
    const cached = cacheService.get<FinancialStatementsData>(cacheKey);
    if (cached) return cached;
    
    if (apiMode === 'opensource') return FallbackData.generateFinancials(ticker);
    
    try {
        const data = await financialDataService.getFinancials(ticker, apiMode);
        cacheService.set(cacheKey, data, 24 * 60 * 60 * 1000); // 24 hour cache
        return data;
    } catch(error) {
        throw handleApiError(error, "financial statements");
    }
};

export const generateTranscripts = async (ticker: string, apiMode: ApiMode): Promise<TranscriptsData> => {
    const cacheKey = `transcripts_hybrid_${ticker}`;
    const cached = cacheService.get<TranscriptsData>(cacheKey);
    if (cached) return cached;

    if (apiMode === 'opensource') return FallbackData.generateTranscripts(ticker);

    try {
        const rawTranscripts = await financialDataService.getTranscripts(ticker, apiMode);
        if (rawTranscripts.length === 0) return { transcripts: [] };

        const transcriptsForPrompt = rawTranscripts.map(t => ({
            quarter: t.quarter,
            year: t.year,
            date: t.time, // Use 'time' field which contains the date
            // Combine speaker and speech into a single string for the AI to process
            transcript: (t.transcript || [])
                .map((line: { name: string, speech: string[] }) => `${line.name}:\n${(line.speech || []).join('\n')}`)
                .join('\n\n')
                .slice(0, 15000) // Truncate for performance
        }));

        const prompt = `You are a financial analyst specializing in summarizing earnings calls. For each of the following earnings call transcripts, provide a concise one-paragraph summary and extract one single key quote that best represents the tone of the call.
        Transcripts: ${JSON.stringify(transcriptsForPrompt)}
        Respond with ONLY a valid JSON object with a single key "transcripts". The value should be an array of objects, each with keys: "quarter", "year", "date", "summary", and "transcript" (this should contain the key quote).`;
        
        const response = await getAiClient().models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        const result = parseJsonFromText(response.text, "transcript summaries");

        cacheService.set(cacheKey, result, 24 * 60 * 60 * 1000); // 24 hour cache
        return result;

    } catch (error) {
        throw handleApiError(error, "earnings transcripts");
    }
};

export const generateStockAnalysis = async (ticker: string, apiMode: ApiMode): Promise<StockAnalysisData> => {
    const cacheKey = `stock_analysis_${ticker}`;
    const cached = cacheService.get<StockAnalysisData>(cacheKey);
    if(cached) return cached;

    if (apiMode === 'opensource') return FallbackData.generateStockAnalysis(ticker);

    const prompt = `Provide a comprehensive analysis for the stock ticker ${ticker}. Use Google Search to find the latest information.
    1.  **Business Summary**: A concise paragraph explaining what the company does.
    2.  **Bull Case**: A paragraph outlining the primary reasons to be optimistic about the stock.
    3.  **Bear Case**: A paragraph outlining the primary risks and reasons for concern.
    4.  **Financial Health**: A score from 1-10 (10 being best) and a one-sentence summary of its financial stability.
    5.  **Recent News**: Find 2-3 recent, significant news headlines. For each, provide the headline and classify its sentiment as 'Positive', 'Negative', or 'Neutral'.
    Respond with ONLY a valid JSON object. Do not include markdown. The structure should be: { businessSummary: string, bullCase: string, bearCase: string, financialHealth: { score: number, summary: string }, recentNews: [{ headline: string, sentiment: string, sourceIndex: number, url: string, source: string, publishedAt: string }] }. Ensure url is a direct link and publishedAt is an ISO 8601 string.`;
    
    try {
        const response = await getAiClient().models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{ googleSearch: {} }] } });
        const analysis = parseJsonFromText(response.text, "stock analysis");
        
        analysis.recentNews = analysis.recentNews.map((item: any) => ({...item, id: item.url || `news-${Date.now()}-${Math.random()}` }));

        const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources: GroundingSource[] = groundingSources
            ?.map((s: any, i: number) => ({ uri: s.web?.uri, title: s.web?.title, index: i + 1 }))
            .filter((s: GroundingSource) => s.uri && s.title);
        
        analysis.sources = sources;
        cacheService.set(cacheKey, analysis, 24 * 60 * 60 * 1000); // 24 hour cache
        return analysis;
    } catch(error) {
        throw handleApiError(error, "stock analysis");
    }
};


export const generateStockComparison = async (tickers: string[], apiMode: ApiMode): Promise<StockComparisonData> => {
    const tickersKey = tickers.sort().join(',');
    const cacheKey = `stock_comparison_hybrid_${tickersKey}`;
    const cached = cacheService.get<StockComparisonData>(cacheKey);
    if(cached) return cached;

    if (apiMode === 'opensource') return FallbackData.generateStockComparison(tickers);

    try {
        const metricsPromises = tickers.map(t => financialDataService.getStockMetrics(t, apiMode));
        const metricsData = await Promise.all(metricsPromises);

        const prompt = `You are a stock analyst. For the following stocks, I have provided key quantitative metrics. Your job is to provide the qualitative analysis. For each stock, write a concise one-sentence summary of its financial health, a brief bull case, and a brief bear case.
        Stock Data: ${JSON.stringify(tickers.map((t, i) => ({ ticker: t, ...metricsData[i] })))}
        Respond with ONLY a valid JSON array of objects. Each object must have keys: "ticker", "financialHealthSummary", "bullCase", and "bearCase".`;

        const response = await getAiClient().models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        const qualitativeAnalysis = parseJsonFromText(response.text, "stock comparison");

        const combinedData = tickers.map((ticker, index) => {
            const quant = metricsData[index];
            const qual = qualitativeAnalysis.find((q: any) => q.ticker === ticker);
            return {
                ticker,
                companyName: `${ticker} Inc.`, // We might need another call for this, or just use ticker
                marketCap: quant.marketCap / 1e9, // Convert to Billions
                peRatio: quant.peRatio,
                dividendYield: quant.dividendYield,
                analystRating: quant.analystRating,
                bullCase: qual?.bullCase || 'N/A',
                bearCase: qual?.bearCase || 'N/A',
                financialHealthSummary: qual?.financialHealthSummary || 'N/A',
            };
        });
        
        cacheService.set(cacheKey, combinedData, 24 * 60 * 60 * 1000); // 24 hour cache
        return combinedData;

    } catch (error) {
        throw handleApiError(error, "stock comparison");
    }
};