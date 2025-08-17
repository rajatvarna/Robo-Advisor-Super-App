

import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import type { ApiMode, QuestionnaireAnswers, PortfolioSuggestion, FinancialStatementsData, StockChartDataPoint, ChartTimeframe, TranscriptsData, GroundingSource, DashboardData, EducationalContent, StockAnalysisData, ChatMessage, ScreenerCriteria, ScreenerResult, Holding, NewsItem, PortfolioScore, Achievement, Dividend, TaxLossOpportunity, BaseDashboardData, StockComparisonData, UserWatchlist, CryptoData } from '../types';
import * as FallbackData from './fallbackData';
import { cacheService } from './cacheService';
import * as financialDataService from './financialDataService';


const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set. The application cannot start.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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
    let cleanedText = text.trim().replace(/^```json\s*|```\s*$/g, '');
    try {
        return JSON.parse(cleanedText);
    } catch (e1) {
        const match = cleanedText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
        if (match && match[0]) {
            try {
                return JSON.parse(match[0]);
            } catch (e2) {
                console.error(`Failed to parse extracted JSON for ${context}. Raw text:`, text);
                throw new Error(`The AI returned invalid JSON for ${context}.`);
            }
        }
        console.error(`Failed to parse any JSON for ${context}. Raw text:`, text);
        throw new Error(`The AI returned a non-JSON response for ${context}.`);
    }
};

export const fetchStockDetailsForPortfolio = async (ticker: string, apiMode: ApiMode): Promise<Pick<Holding, 'companyName' | 'sector'>> => {
    if (apiMode === 'opensource') return FallbackData.fetchStockDetailsForPortfolio(ticker);
    const prompt = `Act as a financial data API. For the ticker "${ticker.toUpperCase()}", provide the official company name and its GICS sector. Respond with a single, valid JSON object with keys "companyName" and "sector". Nothing else.`;
     try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: {type: Type.OBJECT, properties: {companyName: {type: Type.STRING}, sector: {type: Type.STRING}}}} });
        const data = JSON.parse(response.text.trim());
        return data;
    } catch (error) { throw handleApiError(error, `details for ticker ${ticker}`); }
}

export const generatePersonalizedNews = async (holdings: Holding[], watchlistTickers: string[], apiMode: ApiMode): Promise<NewsItem[]> => {
    if (apiMode === 'opensource') return FallbackData.generatePersonalizedNews(holdings.map(h => h.ticker), watchlistTickers);
    if (holdings.length === 0 && watchlistTickers.length === 0) return [];

    // Limit tickers to avoid overly complex prompts that can cause internal errors
    const topHoldingTickers = holdings
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10)
        .map(h => h.ticker);
    
    const topWatchlistTickers = watchlistTickers.slice(0, 10);

    const tickers = [...new Set([...topHoldingTickers, ...topWatchlistTickers])].join(', ');

    if (!tickers) return [];

    const prompt = `Act as a financial news curator. Use Google Search to find 4 recent, relevant news articles for these stocks: ${tickers}. For each, provide its headline, a concise one-sentence summary, the source name, its direct and verifiable URL, and the publication date in ISO 8601 format. Respond with ONLY a valid JSON array of objects with keys "headline", "summary", "source", "url", and "publishedAt". Ensure URLs lead directly to the article. Do not include markdown formatting or any other text outside the JSON array.`;
    
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{ googleSearch: {} }] }});
        return parseJsonFromText(response.text, "personalized news");
    } catch (error) { throw handleApiError(error, "personalized news"); }
}

export const getTopBusinessNews = async (apiMode: ApiMode): Promise<NewsItem[]> => {
    const cacheKey = 'top_business_news';
    const cached = cacheService.get<NewsItem[]>(cacheKey);
    if (cached) return cached;
    
    if (apiMode === 'opensource') return FallbackData.getTopBusinessNews();
    const prompt = `Act as a financial news aggregator. Use Google Search to find 15 significant, recent business and financial news stories from reputable sources. For each story, provide the headline, a concise one-sentence summary, the source name, the direct and verifiable URL to the article, and the publication date in ISO 8601 format. Respond with ONLY a valid JSON array of objects, where each object has the keys "headline", "summary", "source", "url", and "publishedAt". Ensure URLs lead directly to the articles. Do not include any text outside the JSON array.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{ googleSearch: {} }] }});
        const news = parseJsonFromText(response.text, "top business news");
        cacheService.set(cacheKey, news, 15 * 60 * 1000); // Cache for 15 minutes
        return news;
    } catch (error) {
        throw handleApiError(error, "top business news");
    }
};

export const getCryptoNews = async (apiMode: ApiMode): Promise<NewsItem[]> => {
    const cacheKey = 'crypto_news';
    const cached = cacheService.get<NewsItem[]>(cacheKey);
    if (cached) return cached;
    
    if (apiMode === 'opensource') return FallbackData.getCryptoNews();
    const prompt = `Act as a crypto news aggregator. Use Google Search to find 10 significant, recent news stories about cryptocurrency from reputable sources like Coindesk, Cointelegraph, and The Block. For each story, provide the headline, a concise one-sentence summary, the source name, the direct and verifiable URL to the article, and the publication date in ISO 8601 format. Respond with ONLY a valid JSON array of objects, where each object has the keys "headline", "summary", "source", "url", and "publishedAt". Ensure URLs lead directly to the articles. Do not include any text outside the JSON array.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{ googleSearch: {} }] }});
        const news = parseJsonFromText(response.text, "crypto news");
        cacheService.set(cacheKey, news, 15 * 60 * 1000); // Cache for 15 minutes
        return news;
    } catch (error) {
        throw handleApiError(error, "crypto news");
    }
};

export const getTopCryptos = async (apiMode: ApiMode): Promise<CryptoData[]> => {
    const cacheKey = 'top_cryptos';
    const cached = cacheService.get<CryptoData[]>(cacheKey);
    if (cached) return cached;

    if (apiMode === 'opensource') return FallbackData.getTopCryptos();
    const prompt = `Act as a cryptocurrency data API. Use Google Search to find the top 25 cryptocurrencies by market capitalization from sites like Coinbase or CoinMarketCap. For each, provide its name, symbol (ticker), current price in USD, 24-hour percentage change, and market cap in USD. Respond with ONLY a valid JSON array of objects with keys "name", "symbol", "price", "change24h", and "marketCap". Market cap must be a number, not a string.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{ googleSearch: {} }] }});
        const cryptos = parseJsonFromText(response.text, "top cryptos");
        cacheService.set(cacheKey, cryptos, 15 * 60 * 1000); // Cache for 15 minutes
        return cryptos;
    } catch (error) {
        throw handleApiError(error, "top cryptos");
    }
};


export const calculatePortfolioScore = async (holdings: Holding[], apiMode: ApiMode): Promise<PortfolioScore> => {
    if (apiMode === 'opensource') return FallbackData.calculatePortfolioScore(holdings);
    if(holdings.length === 0) return { score: 0, summary: "Add holdings to get a score."};
    const holdingsSummary = holdings.map(h => ({ ticker: h.ticker, value: h.totalValue, sector: h.sector }));
    const prompt = `Analyze this portfolio for diversification, concentration risk across sectors and individual stocks, and overall quality of holdings based on general market stability. Provide a score from 1-100 and a concise one-sentence summary explaining the score. Holdings: ${JSON.stringify(holdingsSummary)}`;
    const schema = { type: Type.OBJECT, properties: { score: {type: Type.NUMBER}, summary: {type: Type.STRING}}, required: ["score", "summary"] };
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema }});
        return JSON.parse(response.text.trim());
    } catch (error) { throw handleApiError(error, "portfolio score"); }
}

export const checkForAchievements = async (action: string, data: any, unlockedIds: string[], apiMode: ApiMode): Promise<Pick<Achievement, 'id' | 'title'>[]> => {
    if (apiMode === 'opensource') return FallbackData.checkForAchievements(action, data, unlockedIds);
    const prompt = `Given an action ("${action}"), data (${JSON.stringify(data)}), and unlocked achievements ([${unlockedIds.join(', ')}]), determine new achievements. Conditions: 'first_login' (first login), 'first_holding' (holdingsCount>=1), 'five_holdings' (>=5), 'ten_holdings' (>=10), 'first_screener' (run_screener action), 'diversified_portfolio_5' (>=5 sectors), 'diversified_portfolio_8' (>=8 sectors), 'high_score_85' (score>=85), 'high_score_95' (score>=95). Return JSON array of new achievements with "id" and "title".`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: {type: Type.STRING}, title: {type: Type.STRING}}, required: ["id", "title"] } };
     try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema }});
        return JSON.parse(response.text.trim());
    } catch (error) { throw handleApiError(error, "achievement check"); }
}

export const generateDividendData = async (holdings: Holding[], apiMode: ApiMode): Promise<Dividend[]> => {
    if (apiMode === 'opensource') return FallbackData.generateDividendData(holdings);
    if(holdings.length === 0) return [];
    const prompt = `Act as a financial data API. Use Google Search to find the upcoming dividend information for the next 3 months for these holdings: ${JSON.stringify(holdings.map(h => ({ ticker: h.ticker, shares: h.shares })))}. For each stock that pays a dividend, provide its ticker, companyName, amountPerShare, totalAmount (calculated as shares * amountPerShare), payDate, and exDividendDate. Omit any non-dividend paying stocks. Respond with a single, valid JSON array of objects and nothing else.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{googleSearch: {}}] }});
        return parseJsonFromText(response.text, 'dividend data');
    } catch (error) { throw handleApiError(error, 'dividend data'); }
}

export const generateTaxLossOpportunities = async (holdings: Holding[], apiMode: ApiMode): Promise<TaxLossOpportunity[]> => {
    if (apiMode === 'opensource') return FallbackData.generateTaxLossOpportunities(holdings);
    if(holdings.length === 0) return [];
    const prompt = `Analyze for tax-loss harvesting. For each holding, the cost basis is provided. Identify up to 3 holdings with unrealized losses (current value < cost basis). For each, provide: ticker, companyName, sharesToSell (all shares), estimatedLoss, costBasis, currentValue, and a brief explanation. Holdings: ${JSON.stringify(holdings.map(h => ({ ticker: h.ticker, shares: h.shares, currentValue: h.totalValue, costBasis: h.costBasis })))}`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { ticker: {type: Type.STRING}, companyName: {type: Type.STRING}, sharesToSell: {type: Type.NUMBER}, estimatedLoss: {type: Type.NUMBER}, costBasis: {type: Type.NUMBER}, currentValue: {type: Type.NUMBER}, explanation: {type: Type.STRING} }, required: ["ticker", "companyName", "sharesToSell", "estimatedLoss", "costBasis", "currentValue", "explanation"]}};
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema }});
        return JSON.parse(response.text.trim());
    } catch (error) { throw handleApiError(error, 'tax-loss opportunities'); }
}

export const generateEducationalContent = async (category: string, apiMode: ApiMode): Promise<EducationalContent[]> => {
    if (apiMode === 'opensource') return FallbackData.generateEducationalContent(category);
    const prompt = `Act as a financial content curator. Use search to find 9 high-quality educational resources for "${category}". Cite sources by index. Respond with ONLY a JSON object: {"content": [...]}, where each item has id, type, title, summary, sourceName, sourceIndex. Do not invent URLs.`;
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{googleSearch: {}}] } });
        const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any, index: number) => ({ uri: chunk.web?.uri, title: chunk.web?.title, index: index + 1 })).filter(source => source.uri && source.title) ?? [];
        if (groundingSources.length === 0) return [];
        
        const processJson = (parsedJson: any) => {
            const generatedContent = parsedJson.content;
            if (!Array.isArray(generatedContent)) return [];
            return generatedContent.map((item: any) => {
                const source = groundingSources.find(s => s.index === item.sourceIndex);
                if (source) {
                    return { ...item, url: source.uri };
                }
                return null;
            }).filter((item): item is EducationalContent => item !== null);
        };

        const jsonText = response.text.trim();
        return processJson(parseJsonFromText(jsonText, `educational content for ${category}`));

    } catch (error) { throw handleApiError(error, `educational content for ${category}`); }
};

export const screenStocks = async (criteria: ScreenerCriteria, apiMode: ApiMode): Promise<ScreenerResult[]> => {
    if (apiMode === 'opensource') return FallbackData.screenStocks(criteria);
    const prompt = `Act as a US stock screener API. Use Google Search to find a list of up to 100 real US companies that match these criteria: Market Cap ($${criteria.marketCapMin}B - ${criteria.marketCapMax === Infinity ? 'any' : `$${criteria.marketCapMax}B`}), P/E Ratio (${criteria.peRatioMin} - ${criteria.peRatioMax === Infinity ? 'any' : criteria.peRatioMax}), Dividend Yield (${criteria.dividendYieldMin}% - ${criteria.dividendYieldMax === Infinity ? 'any' : `${criteria.dividendYieldMax}%`}), Sectors ([${criteria.sectors.join(', ') || 'Any'}]), Minimum Analyst Rating (${criteria.analystRating}). For market cap, use billions (e.g., 2100 for $2.1T). Respond with ONLY a valid JSON array of objects and nothing else.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{googleSearch: {}}] }, });
        return parseJsonFromText(response.text, 'stock screener results') as ScreenerResult[];
    } catch (error) { throw handleApiError(error, 'stock screener results'); }
};

export const createChat = (apiMode: ApiMode): Chat => {
    const systemInstruction = `You are a friendly financial assistant for the "Robo Advisor Super App". Provide helpful, clear answers about finance, markets, and app features. You can analyze images of portfolios, charts, or documents. Do not give personalized financial advice. Frame answers as educational. Refuse to discuss harmful, unethical, or illegal topics by politely stating you are a financial assistant.`;
    if (apiMode === 'opensource') return FallbackData.createChat();
    return ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction: systemInstruction, }, });
};

export const generateFollowUpQuestions = async (chatHistory: ChatMessage[], apiMode: ApiMode): Promise<string[]> => {
    if (apiMode === 'opensource') return FallbackData.generateFollowUpQuestions(chatHistory);
    const historyText = chatHistory.map(m => `${m.role}: ${m.text}`).join('\n');
    const prompt = `Based on this conversation, generate 3 concise, relevant follow-up questions the user might ask next:\n\n${historyText}\n\nProvide the response as a JSON object with a "questions" array.`;
    const schema = { type: Type.OBJECT, properties: { questions: { type: Type.ARRAY, description: "An array of 3 short, relevant follow-up questions.", items: { type: Type.STRING } } }, required: ["questions"] };
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema, }, });
        return JSON.parse(response.text.trim()).questions || [];
    } catch (error) {
        if (!checkIsQuotaError(error)) console.error("Error generating follow-up questions:", error);
        throw handleApiError(error, "follow-up questions");
    }
};

export const generateVideoBriefing = async (prompt: string, apiMode: ApiMode): Promise<any> => {
    if (apiMode === 'opensource') {
        // Return a mock 'done' operation with a sample video URL for fallback mode.
        return {
            done: true,
            response: {
                generatedVideos: [{
                    video: {
                        uri: 'https://storage.googleapis.com/generative-ai-vision/veo-demo-videos/prompt-with-video/a_cinematic_shot_of_a_woman_walking_through_a_paddy_field_in_the_paddy_field.mp4'
                    }
                }]
            }
        };
    }
    try {
        const operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt,
            config: {
                numberOfVideos: 1,
            }
        });
        return operation;
    } catch (error) {
        throw handleApiError(error, 'video briefing generation');
    }
};

export const getVideoOperationStatus = async (operation: any, apiMode: ApiMode): Promise<any> => {
    if (apiMode === 'opensource') {
        // Fallback mode operations are returned as 'done' immediately, so polling is not expected.
        return operation;
    }
    try {
        const updatedOperation = await ai.operations.getVideosOperation({ operation });
        return updatedOperation;
    } catch (error) {
        throw handleApiError(error, 'video operation status check');
    }
};

export const generatePortfolio = async (answers: QuestionnaireAnswers, apiMode: ApiMode): Promise<PortfolioSuggestion> => {
    if (apiMode === 'opensource') return FallbackData.generatePortfolio(answers);
    const prompt = `Based on these answers, act as a robo-advisor. Generate a portfolio suggestion. Total allocation must sum to 100.\n\nAnswers:\n- Age: ${answers.age}\n- Horizon: ${answers.horizon}\n- Goal: ${answers.goal}\n- Risk: ${answers.riskTolerance}\n- Liquidity: ${answers.liquidity}\n\nProvide JSON with risk profile, allocation percentages, and a clear explanation.`;
    const schema = { type: Type.OBJECT, properties: { riskProfile: { type: Type.STRING }, allocation: { type: Type.OBJECT, properties: { stocks: { type: Type.NUMBER }, bonds: { type: Type.NUMBER }, cash: { type: Type.NUMBER }, commodities: { type: Type.NUMBER }, realEstate: { type: Type.NUMBER }, }, required: ['stocks', 'bonds', 'cash', 'commodities', 'realEstate'] }, explanation: { type: Type.STRING }, }, required: ['riskProfile', 'allocation', 'explanation'] };
    try {
      const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema, }, });
      return JSON.parse(response.text.trim()) as PortfolioSuggestion;
    } catch (error) { throw handleApiError(error, 'portfolio suggestion'); }
};

export const generateFinancials = async (ticker: string, apiMode: ApiMode): Promise<FinancialStatementsData> => {
    const cacheKey = `financials_${ticker}`;
    const cachedData = cacheService.get<FinancialStatementsData>(cacheKey);
    if (cachedData) return cachedData;

    if (apiMode === 'opensource') {
        const data = FallbackData.generateFinancials(ticker);
        cacheService.set(cacheKey, data);
        return data;
    }
    const prompt = `Act as a financial data API. Use Google Search to find financial statement data for "${ticker}" for the last 10 fiscal years from sources like Morningstar or Yahoo Finance. Provide ONLY a valid JSON object with 'incomeStatement', 'balanceSheet', and 'cashFlow' arrays and nothing else.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{googleSearch: {}}] }, });
        const data = parseJsonFromText(response.text, `financials for ${ticker}`) as FinancialStatementsData;
        cacheService.set(cacheKey, data);
        return data;
    } catch (error) { throw handleApiError(error, `financials for ${ticker}`); }
};

export const generateTranscripts = async (ticker: string, apiMode: ApiMode): Promise<TranscriptsData> => {
    const cacheKey = `transcripts_${ticker}`;
    const cachedData = cacheService.get<TranscriptsData>(cacheKey);
    if (cachedData) return cachedData;
    
    if (apiMode === 'opensource') {
        const data = FallbackData.generateTranscripts(ticker);
        cacheService.set(cacheKey, data);
        return data;
    }
    const prompt = `Use Google Search to find earnings call transcripts for "${ticker.toUpperCase()}". Find the 4 most recent ones. For each, provide the quarter, date, a concise summary, and a key quote. CITE YOUR SOURCES by index number. Respond with ONLY a valid JSON object of the format: {"transcripts": [{"quarter": "...", "date": "...", "summary": "...", "transcript": "...", "sourceIndex": 1}, ...]}. Do not invent URLs or sources.`;
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{googleSearch: {}}], }, });
        
        const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any, index: number) => ({ uri: chunk.web?.uri, title: chunk.web?.title, index: index + 1 })).filter(source => source.uri && source.title) ?? [];

        if (groundingSources.length === 0) return { transcripts: [], sources: [] };

        const processJson = (parsedJson: any) => {
            const transcripts = parsedJson.transcripts || [];
            transcripts.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return { transcripts, sources: groundingSources };
        };

        const text = response.text.trim();
        const parsedJson = parseJsonFromText(text, `transcripts for ${ticker}`);
        const result = processJson(parsedJson);
        cacheService.set(cacheKey, result);
        return result;

    } catch (error) { throw handleApiError(error, `earnings transcripts for ${ticker}`); }
};

export const generateStockAnalysis = async (ticker: string, apiMode: ApiMode): Promise<StockAnalysisData> => {
    const cacheKey = `analysis_${ticker}`;
    const cachedData = cacheService.get<StockAnalysisData>(cacheKey);
    if (cachedData) return cachedData;

    if (apiMode === 'opensource') {
        const data = FallbackData.generateStockAnalysis(ticker);
        cacheService.set(cacheKey, data);
        return data;
    }
    const prompt = `Act as a senior analyst for "${ticker.toUpperCase()}". Use search to gather info. Provide analysis including: businessSummary, bullCase, bearCase, financialHealth (score 1-10 & summary), and 3 recentNews items (headline, summary, sentiment). CITE YOUR SOURCES by index number. Respond with ONLY a valid JSON object of the format: {"businessSummary": "...", "recentNews": [{"headline": "...", "summary": "...", "sentiment": "...", "sourceIndex": 1}], ...}. Do not invent URLs or sources.`;
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{googleSearch: {}}], }, });

        const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any, index: number) => ({ uri: chunk.web?.uri, title: chunk.web?.title, index: index + 1 })).filter(source => source.uri && source.title) ?? [];

        const processJson = (parsedJson: any) => {
            return { ...parsedJson, sources: groundingSources };
        };

        const text = response.text.trim();
        const parsedJson = parseJsonFromText(text, `stock analysis for ${ticker}`);
        
        const result = processJson(parsedJson);
        cacheService.set(cacheKey, result);
        return result;
    } catch (error) { throw handleApiError(error, `stock analysis for ${ticker}`); }
}

export const generateStockComparison = async (tickers: string[], apiMode: ApiMode): Promise<StockComparisonData> => {
    const cacheKey = `comparison_${tickers.sort().join('_')}`;
    const cachedData = cacheService.get<StockComparisonData>(cacheKey);
    if (cachedData) return cachedData;
    
    if (apiMode === 'opensource') {
        const data = FallbackData.generateStockComparison(tickers);
        cacheService.set(cacheKey, data);
        return data;
    }
    const prompt = `Act as a senior stock analyst API. Use Google Search to provide a detailed, side-by-side comparison for the stock tickers: ${tickers.join(', ')}. For each ticker, provide its company name, market cap (as a number in billions, e.g., 2100 for $2.1T), P/E ratio (as a number), dividend yield (as a number in percent, e.g., 1.5 for 1.5%), consensus analyst rating, a brief bull case, a brief bear case, and a one-sentence financial health summary. Provide the response as a single, valid JSON array and nothing else. If a value like P/E or dividend yield isn't applicable, use null.`;

    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{googleSearch: {}}] }, });
        const data = parseJsonFromText(response.text, `stock comparison for ${tickers.join(', ')}`) as StockComparisonData;
        cacheService.set(cacheKey, data);
        return data;
    } catch (error) {
        throw handleApiError(error, `stock comparison for ${tickers.join(', ')}`);
    }
};