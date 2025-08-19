


import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import type { ApiMode, QuestionnaireAnswers, PortfolioSuggestion, FinancialStatementsData, StockChartDataPoint, ChartTimeframe, TranscriptsData, GroundingSource, DashboardData, EducationalContent, StockAnalysisData, ChatMessage, ScreenerCriteria, ScreenerResult, Holding, NewsItem, PortfolioScore, Achievement, Dividend, TaxLossOpportunity, BaseDashboardData, StockComparisonData, UserWatchlist, CryptoData, Alert } from '../types';
import * as FallbackData from './fallbackData';
import { ALL_ACHIEVEMENTS } from './fallbackData';
import { cacheService } from './cacheService';
import * as financialDataService from './financialDataService';


let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        const API_KEY = (window as any).process?.env?.API_KEY;
        if (!API_KEY || API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
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

        // Remove duplicates by URL
        const uniqueNews = Array.from(new Map(allNews.map(item => [item.url, item])).values());
        
        const finalNews = uniqueNews.slice(0, 10);
        cacheService.set(cacheKey, finalNews, 60 * 60 * 1000); // Cache for 1 hour
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
        const news = parseJsonFromText(response.text, "top business news");
        if (!Array.isArray(news)) {
            throw new Error("AI response was not a JSON array.");
        }
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
        cacheService.set(cacheKey, cryptos, 6 * 60 * 60 * 1000); // Cache for 6 hours
        return cryptos;
    } catch (error) {
        throw handleApiError(error, "top cryptos");
    }
};


export const calculatePortfolioScore = async (holdings: Holding[], apiMode: ApiMode): Promise<PortfolioScore> => {
    const holdingsKey = holdings.map(h => `${h.ticker}:${h.shares.toFixed(2)}`).sort().join(',');
    const cacheKey = `portfolio_score_${holdingsKey}`;
    const cached = cacheService.get<PortfolioScore>(cacheKey);
    if(cached) return cached;

    if (apiMode === 'opensource') return FallbackData.calculatePortfolioScore(holdings);
    if(holdings.length === 0) return { score: 0, summary: "Add holdings to get a score."};
    const holdingsSummary = holdings.map(h => ({ ticker: h.ticker, value: h.totalValue, sector: h.sector }));
    const prompt = `Analyze this portfolio for diversification, concentration risk across sectors and individual stocks, and overall quality of holdings based on general market stability. Provide a score from 1-100 and a concise one-sentence summary explaining the score. Holdings: ${JSON.stringify(holdingsSummary)}`;
    const schema = { type: Type.OBJECT, properties: { score: {type: Type.NUMBER}, summary: {type: Type.STRING}}, required: ["score", "summary"] };
    try {
        const response = await getAiClient().models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema }});
        const result = JSON.parse(response.text.trim());
        cacheService.set(cacheKey, result, 8 * 60 * 60 * 1000); // Cache for 8 hours
        return result;
    } catch (error) { throw handleApiError(error, "portfolio score"); }
}

export const checkForAchievements = (action: string, data: any, unlockedIds: string[]): Pick<Achievement, 'id' | 'title'>[] => {
    const newAchievements: Pick<Achievement, 'id' | 'title'>[] = [];

    const check = (id: string, condition: boolean) => {
        if (condition && !unlockedIds.includes(id)) {
            const achievement = ALL_ACHIEVEMENTS.find(a => a.id === id);
            if (achievement) {
                newAchievements.push({ id: achievement.id, title: achievement.title });
            }
        }
    };

    switch (action) {
        case 'add_holding':
            check('first_holding', data.holdingsCount >= 1);
            check('five_holdings', data.holdingsCount >= 5);
            check('ten_holdings', data.holdingsCount >= 10);
            check('diversified_portfolio_5', data.sectorCount >= 5);
            check('diversified_portfolio_8', data.sectorCount >= 8);
            break;
        case 'run_screener':
            check('first_screener', true);
            break;
        case 'portfolio_score':
            check('high_score_85', data.score >= 85);
            check('high_score_95', data.score >= 95);
            break;
    }

    return newAchievements;
}

export const generateDashboardInsights = async (dashboardData: DashboardData, apiMode: ApiMode): Promise<string[]> => {
    const keyParts = {
        nw: dashboardData.netWorth.toFixed(0),
        goal: dashboardData.goal?.name,
        th: dashboardData.holdings.slice(0, 5).map(h => h.ticker).sort().join(','),
        alloc: dashboardData.allocation.map(a => `${a.name}:${a.value.toFixed(0)}`).sort().join(',')
    };
    const cacheKey = `dashboard_insights_${JSON.stringify(keyParts)}`;
    const cached = cacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    if (apiMode === 'opensource') return FallbackData.generateDashboardInsights();
    
    const context = {
        netWorth: dashboardData.netWorth,
        goal: dashboardData.goal,
        topHoldings: dashboardData.holdings.slice(0, 5).map(h => ({ ticker: h.ticker, value: h.totalValue, sector: h.sector })),
        allocation: dashboardData.allocation,
    };
    
    const prompt = `Act as a financial analyst. Based on the following portfolio snapshot, provide 3-4 concise, actionable, and insightful bullet points for a "Daily Briefing" for the user. Focus on concentration, performance, or progress towards goals. Be encouraging but realistic. Do not give direct buy/sell advice. Context: ${JSON.stringify(context)}`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            insights: {
                type: Type.ARRAY,
                description: "An array of 3-4 string bullet points for the user's daily briefing.",
                items: { type: Type.STRING }
            }
        },
        required: ["insights"]
    };

    try {
        const response = await getAiClient().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        const result = JSON.parse(response.text.trim());
        const insights = result.insights || [];
        cacheService.set(cacheKey, insights, 8 * 60 * 60 * 1000); // Cache for 8 hours
        return insights;
    } catch (error) {
        throw handleApiError(error, "dashboard insights");
    }
};

export const generatePortfolioAlerts = async (dashboardData: DashboardData, apiMode: ApiMode): Promise<Alert[]> => {
    const keyParts = {
        h: dashboardData.holdings.map(h => `${h.ticker}:${h.dayChangePercent.toFixed(1)}`).sort().join(','),
        alloc: dashboardData.allocation.map(a => `${a.name}:${a.value.toFixed(0)}`).sort().join(',')
    };
    const cacheKey = `portfolio_alerts_${JSON.stringify(keyParts)}`;
    const cached = cacheService.get<Alert[]>(cacheKey);
    if (cached) return cached;

    if (apiMode === 'opensource') return FallbackData.generatePortfolioAlerts(dashboardData);
    if (dashboardData.holdings.length === 0) return [];

    const context = {
        holdings: dashboardData.holdings.map(h => ({
            ticker: h.ticker,
            totalValue: h.totalValue,
            dayChangePercent: h.dayChangePercent
        })),
        allocation: dashboardData.allocation,
        goal: dashboardData.goal,
        netWorth: dashboardData.netWorth
    };

    const prompt = `Act as a portfolio monitoring AI. Analyze this portfolio for significant events that occurred today: ${JSON.stringify(context)}.
    Identify up to 3 important alerts for the user. Focus on:
    1.  **Price:** Any holding with a daily change > 5% or < -5%.
    2.  **Portfolio:** Sector concentration exceeding 40%.
    3.  **News (Use Search):** Search for a major breaking news story (earnings, M&A) for one of the top 3 holdings.
    4.  **Goal:** A significant milestone reached (e.g., crossing a 25%, 50%, or 75% threshold of their goal).
    
    For each alert, provide a unique ID, type, severity, title, and a concise description.
    Respond with ONLY a valid JSON array of objects.`;

    try {
        const response = await getAiClient().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
         if (!response.text) {
            throw new Error("The AI returned an empty response for portfolio alerts.");
        }
        const alertsResult = parseJsonFromText(response.text, "portfolio alerts");
        
        if (!Array.isArray(alertsResult)) {
            console.warn("Parsed JSON is not an array for portfolio alerts, returning empty.", alertsResult);
            return [];
        }

        const alerts: Omit<Alert, 'timestamp' | 'read'>[] = alertsResult;
        const finalAlerts = alerts.map(alert => ({
            ...alert,
            timestamp: new Date().toISOString(),
            read: false
        }));
        cacheService.set(cacheKey, finalAlerts, 8 * 60 * 60 * 1000); // Cache for 8 hours
        return finalAlerts