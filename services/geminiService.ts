


import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import type { ApiMode, QuestionnaireAnswers, PortfolioSuggestion, FinancialStatementsData, StockChartDataPoint, ChartTimeframe, TranscriptsData, GroundingSource, DashboardData, EducationalContent, StockAnalysisData, ChatMessage, ScreenerCriteria, ScreenerResult, Holding, NewsItem, PortfolioScore, Achievement, Dividend, TaxLossOpportunity, BaseDashboardData, StockComparisonData } from '../types';
import * as FallbackData from './fallbackData';
import { cacheService } from './cacheService';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set. The application cannot start.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const checkIsQuotaError = (error: any): boolean => {
    const message = JSON.stringify(error).toLowerCase();
    return message.includes('429') || message.includes('resource_exhausted') || message.includes('quota');
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

// --- CORE FUNCTIONS WITH FALLBACK ---

const holdingDetailsSchema = { type: Type.OBJECT, properties: { ticker: { type: Type.STRING }, companyName: { type: Type.STRING }, currentPrice: { type: Type.NUMBER }, dayChange: { type: Type.NUMBER }, dayChangePercent: { type: Type.NUMBER }, sector: { type: Type.STRING, description: "The GICS sector of the company." } }, required: ["ticker", "companyName", "currentPrice", "dayChange", "dayChangePercent", "sector"] };
export const fetchStockDetailsForPortfolio = async (ticker: string, apiMode: ApiMode): Promise<Omit<Holding, 'shares' | 'totalValue'>> => {
    if (apiMode === 'opensource') return FallbackData.fetchStockDetailsForPortfolio(ticker);
    const prompt = `Act as a stock data provider. For the stock ticker "${ticker.toUpperCase()}", get its official company name, its GICS sector, and a realistic current stock price, day's price change (in USD), and day's percentage change as of today. Provide the response in the specified JSON format.`;
     try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: holdingDetailsSchema } });
        const data = JSON.parse(response.text.trim());
        data.ticker = ticker.toUpperCase();
        return data;
    } catch (error) { throw handleApiError(error, `details for ticker ${ticker}`); }
}

export const generateDashboardData = async (apiMode: ApiMode): Promise<BaseDashboardData> => {
    if (apiMode === 'opensource') return FallbackData.generateDashboardData();
    const prompt = `
      Act as a financial data simulator. Generate a realistic set of base data for a user of a robo-advisor app.
      Please provide the following:
      1.  A 'user' object with name, email, and memberSince date.
      2.  A 'holdings' array with 8-12 well-known stocks, including all necessary details like ticker, shares, and price.
      3.  A 'transactions' array with about 10 recent "Buy" or "Sell" transactions.
      4.  A 'watchlist' array with 4 different well-known stocks.
      Provide the response in the specified JSON format.
    `;
    const schema = FallbackData.baseDashboardDataSchema;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema, }, });
        return JSON.parse(response.text.trim()) as BaseDashboardData;
    } catch (error) { throw handleApiError(error, `dashboard data`); }
};

export const fetchUpdatedPrices = async (holdings: {ticker: string, currentPrice: number}[], apiMode: ApiMode): Promise<{ticker: string, currentPrice: number}[]> => {
    if (apiMode === 'opensource') return FallbackData.fetchUpdatedPrices(holdings);
    const prompt = `Simulate minor price fluctuations for the following stocks. For each stock, adjust its current price slightly up or down (by about 0.05% to 0.5%) to mimic real-time market movement. Return a JSON array of objects with "ticker" and "currentPrice".\n\n${JSON.stringify(holdings)}`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { ticker: {type: Type.STRING}, currentPrice: {type: Type.NUMBER}}, required: ["ticker", "currentPrice"]}};
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema }});
        return JSON.parse(response.text.trim());
    } catch (error) { throw handleApiError(error, "price updates"); }
}

export const generatePersonalizedNews = async (holdings: Holding[], watchlist: Holding[], apiMode: ApiMode): Promise<NewsItem[]> => {
    if (apiMode === 'opensource') return FallbackData.generatePersonalizedNews(holdings, watchlist);
    if (holdings.length === 0 && (!watchlist || watchlist.length === 0)) return [];
    const tickers = [...new Set([...holdings.map(h => h.ticker), ...(watchlist || []).map(w => w.ticker)])].join(', ');
    if (!tickers) return [];
    const prompt = `Act as a financial news curator. Use Google Search to find 4 recent, relevant news articles for these stocks: ${tickers}. For each, provide its headline, a concise one-sentence summary, the source name, its URL, and a sentiment analysis ('Positive', 'Negative', 'Neutral'). Respond with ONLY a valid JSON array of objects with keys "headline", "summary", "source", "url", and "sentiment". Do not include markdown formatting or any other text outside the JSON array.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{ googleSearch: {} }] }});
        
        let text = response.text.trim();
        // Find the JSON array within the response text, as grounding can add conversational text.
        const match = text.match(/(\[[\s\S]*\])/);
        if (match && match[0]) {
            try {
                return JSON.parse(match[0]);
            } catch(e) {
                 console.error("Failed to parse extracted JSON from personalized news:", match[0]);
                 // Fall through to try parsing the whole string if extraction fails
            }
        }
        // Fallback for cases where the regex fails but the response is clean JSON.
        return JSON.parse(text);

    } catch (error) { throw handleApiError(error, "personalized news"); }
}

export const calculatePortfolioScore = async (holdings: Holding[], apiMode: ApiMode): Promise<PortfolioScore> => {
    if (apiMode === 'opensource') return FallbackData.calculatePortfolioScore(holdings);
    const holdingsSummary = holdings.map(h => ({ ticker: h.ticker, value: h.totalValue, sector: h.sector }));
    const prompt = `Analyze portfolio for diversification & concentration. Provide score (1-100) and a one-sentence summary. Holdings: ${JSON.stringify(holdingsSummary)}`;
    const schema = { type: Type.OBJECT, properties: { score: {type: Type.NUMBER}, summary: {type: Type.STRING}}, required: ["score", "summary"] };
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema }});
        return JSON.parse(response.text.trim());
    } catch (error) { throw handleApiError(error, "portfolio score"); }
}

export const checkForAchievements = async (action: string, data: any, unlockedIds: string[], apiMode: ApiMode): Promise<Pick<Achievement, 'id' | 'title'>[]> => {
    if (apiMode === 'opensource') return FallbackData.checkForAchievements(action, data, unlockedIds);
    const prompt = `Given an action ("${action}"), data (${JSON.stringify(data)}), and unlocked achievements ([${unlockedIds.join(', ')}]), determine new achievements. Conditions: 'first_login' (first login), 'first_holding' (holdingsCount>=1), 'five_holdings' (>=5), 'ten_holdings' (>=10), 'first_screener' (run_screener action), 'diversified_portfolio_5' (>=5 sectors), 'diversified_portfolio_8' (>=8 sectors), 'high_score_85' (score>=85), 'high_score_95' (score>=95). Return JSON array of new achievements with "id" and "title".`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: {type: Type.STRING}, title: {type: Type.STRING}}, required: ["id", "title"] }};
     try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema }});
        return JSON.parse(response.text.trim());
    } catch (error) { throw handleApiError(error, "achievement check"); }
}

export const generateDividendData = async (holdings: Holding[], apiMode: ApiMode): Promise<Dividend[]> => {
    if (apiMode === 'opensource') return FallbackData.generateDividendData(holdings);
    const prompt = `For these holdings, generate upcoming dividends for next 3 months: ${JSON.stringify(holdings.map(h => ({ ticker: h.ticker, shares: h.shares })))}. Include ticker, companyName, amountPerShare, totalAmount, payDate, exDividendDate. Omit non-dividend stocks.`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { ticker: {type: Type.STRING}, companyName: {type: Type.STRING}, amountPerShare: {type: Type.NUMBER}, totalAmount: {type: Type.NUMBER}, payDate: {type: Type.STRING}, exDividendDate: {type: Type.STRING} }, required: ["ticker", "companyName", "amountPerShare", "totalAmount", "payDate", "exDividendDate"]}};
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema }});
        return JSON.parse(response.text.trim());
    } catch (error) { throw handleApiError(error, 'dividend data'); }
}

export const generateTaxLossOpportunities = async (holdings: Holding[], apiMode: ApiMode): Promise<TaxLossOpportunity[]> => {
    if (apiMode === 'opensource') return FallbackData.generateTaxLossOpportunities(holdings);
    const prompt = `Analyze for tax-loss harvesting. Identify up to 3 holdings with unrealized losses. Provide ticker, companyName, sharesToSell, estimatedLoss, costBasis, currentValue, and explanation. Holdings: ${JSON.stringify(holdings.map(h => ({ ticker: h.ticker, shares: h.shares, currentPrice: h.currentPrice })))}`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { ticker: {type: Type.STRING}, companyName: {type: Type.STRING}, sharesToSell: {type: Type.NUMBER}, estimatedLoss: {type: Type.NUMBER}, costBasis: {type: Type.NUMBER}, currentValue: {type: Type.NUMBER}, explanation: {type: Type.STRING} }, required: ["ticker", "companyName", "sharesToSell", "estimatedLoss", "costBasis", "currentValue", "explanation"]}};
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema }});
        return JSON.parse(response.text.trim());
    } catch (error) { throw handleApiError(error, 'tax-loss opportunities'); }
}

export const generateVideoBriefing = async (prompt: string, apiMode: ApiMode): Promise<any> => {
    if (apiMode === 'opensource') return FallbackData.generateVideoBriefing(prompt);
    try {
        const operation = await ai.models.generateVideos({ model: 'veo-2.0-generate-001', prompt: prompt, config: { numberOfVideos: 1 } });
        return operation;
    } catch (error) { throw handleApiError(error, 'video briefing'); }
}

export const getVideoOperationStatus = async (operation: any, apiMode: ApiMode): Promise<any> => {
    if (apiMode === 'opensource') return FallbackData.getVideoOperationStatus(operation);
    try {
        const updatedOperation = await ai.operations.getVideosOperation({ operation });
        return updatedOperation;
    } catch (error) { throw handleApiError(error, 'video operation status'); }
}

export const generateEducationalContent = async (category: string, apiMode: ApiMode): Promise<EducationalContent[]> => {
    if (apiMode === 'opensource') return FallbackData.generateEducationalContent(category);
    const prompt = `Act as a financial content curator. Use search to find 9 high-quality educational resources for "${category}". Cite sources by index. Respond with ONLY a JSON object: {"content": [...]}, where each item has id, type, title, summary, sourceName, sourceIndex. Do not invent URLs.`;
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{googleSearch: {}}] } });
        const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any, index: number) => ({ uri: chunk.web?.uri, title: chunk.web?.title, index: index + 1 })).filter(source => source.uri && source.title) ?? [];
        if (groundingSources.length === 0) return [];
        const jsonText = response.text.trim().replace(/^```json\s*|`{3,}\s*$|^\s*json\s*/, '');
        const parsedJson = JSON.parse(jsonText);
        const generatedContent = parsedJson.content;
        if (!Array.isArray(generatedContent)) return [];
        return generatedContent.map((item: any) => {
            const source = groundingSources.find(s => s.index === item.sourceIndex);
            if (source) {
                return { ...item, url: source.uri };
            }
            return null;
        }).filter((item): item is EducationalContent => item !== null);
    } catch (error) { throw handleApiError(error, `educational content for ${category}`); }
};

export const screenStocks = async (criteria: ScreenerCriteria, apiMode: ApiMode): Promise<ScreenerResult[]> => {
    if (apiMode === 'opensource') return FallbackData.screenStocks(criteria);
    const prompt = `Act as a US stock screener. Generate a list of up to 100 real US companies matching these criteria: Market Cap ($${criteria.marketCapMin}B - ${criteria.marketCapMax === Infinity ? 'any' : `$${criteria.marketCapMax}B`}), P/E (${criteria.peRatioMin} - ${criteria.peRatioMax === Infinity ? 'any' : criteria.peRatioMax}), Dividend Yield (${criteria.dividendYieldMin}% - ${criteria.dividendYieldMax === Infinity ? 'any' : `${criteria.dividendYieldMax}%`}), Sectors ([${criteria.sectors.join(', ') || 'Any'}]), Min Analyst Rating (${criteria.analystRating}). Provide response as JSON array.`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { ticker: { type: Type.STRING }, companyName: { type: Type.STRING }, marketCap: { type: Type.NUMBER, }, peRatio: { type: Type.NUMBER }, dividendYield: { type: Type.NUMBER }, sector: { type: Type.STRING }, analystRating: { type: Type.STRING } }, required: ["ticker", "companyName", "marketCap", "peRatio", "dividendYield", "sector", "analystRating"] } };
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema, }, });
        return JSON.parse(response.text.trim()) as ScreenerResult[];
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
    const prompt = `Generate plausible financial statement data for "${ticker}" for the last 10 fiscal years. Provide JSON with 'incomeStatement', 'balanceSheet', and 'cashFlow' arrays.`;
    const schema = FallbackData.financialsSchema;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema, }, });
        const data = JSON.parse(response.text.trim()) as FinancialStatementsData;
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

        const jsonText = response.text.trim().replace(/^```json\s*|`{3,}\s*$|^\s*json\s*/, '');
        const parsedJson = JSON.parse(jsonText);
        const transcripts = parsedJson.transcripts || [];

        transcripts.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const result = { transcripts, sources: groundingSources };
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

        const jsonText = response.text.trim().replace(/^```json\s*|`{3,}\s*$|^\s*json\s*/, '');
        const parsedJson = JSON.parse(jsonText);
        
        const result = { ...parsedJson, sources: groundingSources };
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
    const prompt = `Act as a senior stock analyst. Provide a detailed, side-by-side comparison for the following stock tickers: ${tickers.join(', ')}. For each ticker, provide its company name, market cap in billions, P/E ratio, dividend yield, consensus analyst rating, a brief bull case, a brief bear case, and a one-sentence financial health summary. Provide the response in the specified JSON format. If a value like P/E or dividend yield isn't applicable, use null.`;

    const schema = {
        type: Type.ARRAY,
        items: FallbackData.stockComparisonItemSchema,
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const data = JSON.parse(response.text.trim()) as StockComparisonData;
        cacheService.set(cacheKey, data);
        return data;
    } catch (error) {
        throw handleApiError(error, `stock comparison for ${tickers.join(', ')}`);
    }
};