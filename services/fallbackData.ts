import { Type } from "@google/genai";
import type { Chat } from '@google/genai';
import type { Holding, ScreenerResult, ScreenerCriteria, PortfolioSuggestion, QuestionnaireAnswers, StockChartDataPoint, ChartTimeframe, FinancialStatementsData, TranscriptsData, StockAnalysisData, EducationalContent, DashboardData, NewsItem, PortfolioScore, Achievement, Dividend, TaxLossOpportunity, SecFiling, ChatMessage, BaseDashboardData, GroundingSource, StockComparisonData } from '../types';

// --- Achievements ---
export const ALL_ACHIEVEMENTS: Achievement[] = [
    { id: 'first_login', title: "Welcome Aboard", description: "Log in for the first time.", unlocked: false },
    { id: 'first_holding', title: "First Investment", description: "Add your first holding.", unlocked: false },
    { id: 'five_holdings', title: "Budding Investor", description: "Own at least 5 different stocks.", unlocked: false },
    { id: 'ten_holdings', title: "Portfolio Pro", description: "Own at least 10 different stocks.", unlocked: false },
    { id: 'first_screener', title: "Market Explorer", description: "Run the stock screener for the first time.", unlocked: false },
    { id: 'diversified_portfolio_5', title: "Well-Rounded", description: "Hold stocks in at least 5 different sectors.", unlocked: false },
    { id: 'diversified_portfolio_8', title: "Master Diversifier", description: "Hold stocks in at least 8 different sectors.", unlocked: false },
    { id: 'high_score_85', title: "Top Performer", description: "Achieve a portfolio score of 85 or higher.", unlocked: false },
    { id: 'high_score_95', title: "Elite Investor", description: "Achieve a portfolio score of 95 or higher.", unlocked: false },
];

// --- Schemas for AI Service ---
const holdingSchema = {
  type: Type.OBJECT,
  properties: {
    ticker: { type: Type.STRING },
    companyName: { type: Type.STRING },
    shares: { type: Type.NUMBER },
    currentPrice: { type: Type.NUMBER },
    dayChange: { type: Type.NUMBER },
    dayChangePercent: { type: Type.NUMBER },
    totalValue: { type: Type.NUMBER },
    sector: { type: Type.STRING },
  },
  required: ["ticker", "companyName", "shares", "currentPrice", "dayChange", "dayChangePercent", "totalValue", "sector"]
};

export const baseDashboardDataSchema = {
    type: Type.OBJECT,
    properties: {
        user: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                memberSince: { type: Type.STRING },
            },
            required: ["name", "email", "memberSince"]
        },
        holdings: { type: Type.ARRAY, items: holdingSchema },
        transactions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    date: { type: Type.STRING },
                    type: { type: Type.STRING },
                    ticker: { type: Type.STRING },
                    companyName: { type: Type.STRING },
                    shares: { type: Type.NUMBER },
                    price: { type: Type.NUMBER },
                    totalValue: { type: Type.NUMBER },
                },
                required: ["id", "date", "type", "ticker", "companyName", "shares", "price", "totalValue"]
            }
        },
        watchlist: { type: Type.ARRAY, items: holdingSchema },
    },
    required: ["user", "holdings", "transactions", "watchlist"]
};


export const filingsSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      accessionNumber: { type: Type.STRING },
      filingDate: { type: Type.STRING },
      reportDate: { type: Type.STRING },
      form: { type: Type.STRING },
      primaryDocument: { type: Type.STRING },
      primaryDocDescription: { type: Type.STRING },
    },
    required: ["accessionNumber", "filingDate", "reportDate", "form", "primaryDocument", "primaryDocDescription"],
  },
};

export const financialsSchema = {
    type: Type.OBJECT,
    properties: {
        incomeStatement: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { year: { type: Type.NUMBER }, revenue: { type: Type.NUMBER }, netIncome: { type: Type.NUMBER } },
                required: ["year", "revenue", "netIncome"],
            },
        },
        balanceSheet: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { year: { type: Type.NUMBER }, totalAssets: { type: Type.NUMBER }, totalLiabilities: { type: Type.NUMBER }, totalEquity: { type: Type.NUMBER } },
                required: ["year", "totalAssets", "totalLiabilities", "totalEquity"],
            },
        },
        cashFlow: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { year: { type: Type.NUMBER }, operatingCashFlow: { type: Type.NUMBER }, investingCashFlow: { type: Type.NUMBER }, financingCashFlow: { type: Type.NUMBER } },
                required: ["year", "operatingCashFlow", "investingCashFlow", "financingCashFlow"],
            },
        },
    },
    required: ["incomeStatement", "balanceSheet", "cashFlow"],
};

export const stockComparisonItemSchema = {
    type: Type.OBJECT,
    properties: {
        ticker: { type: Type.STRING },
        companyName: { type: Type.STRING },
        marketCap: { type: Type.NUMBER, description: "Market capitalization in billions of USD." },
        peRatio: { type: Type.NUMBER, description: "Price-to-Earnings ratio. Can be null if not applicable." },
        dividendYield: { type: Type.NUMBER, description: "Dividend yield in percent. Can be null if not applicable." },
        analystRating: { type: Type.STRING, description: "Consensus analyst rating, e.g., 'Buy', 'Hold', 'Strong Buy'." },
        bullCase: { type: Type.STRING, description: "A brief summary of the bull case for the stock." },
        bearCase: { type: Type.STRING, description: "A brief summary of the bear case for the stock." },
        financialHealthSummary: { type: Type.STRING, description: "A one-sentence summary of the company's financial health." },
    },
    required: ["ticker", "companyName", "marketCap", "peRatio", "dividendYield", "analystRating", "bullCase", "bearCase", "financialHealthSummary"],
};


// --- Fallback Data for Services ---

export const fetchStockDetailsForPortfolio = (ticker: string): Omit<Holding, 'shares' | 'totalValue'> => ({
    ticker: ticker.toUpperCase(),
    companyName: `${ticker.toUpperCase()} Inc. (Offline)`,
    currentPrice: 150 + Math.random() * 20 - 10,
    dayChange: Math.random() * 4 - 2,
    dayChangePercent: Math.random() * 2 - 1,
    sector: "Technology",
});


export const generateDashboardData = (): BaseDashboardData => {
    return {
    user: { name: 'Demo User', email: 'demo@example.com', memberSince: '2023-01-01' },
    holdings: [
        { ticker: 'AAPL', companyName: 'Apple Inc. (Offline)', shares: 50, currentPrice: 190.5, dayChange: 2.3, dayChangePercent: 1.22, totalValue: 9525, sector: 'Technology' },
        { ticker: 'MSFT', companyName: 'Microsoft Corp. (Offline)', shares: 30, currentPrice: 420.7, dayChange: -1.5, dayChangePercent: -0.36, totalValue: 12621, sector: 'Technology' },
        { ticker: 'JPM', companyName: 'JPMorgan Chase & Co. (Offline)', shares: 100, currentPrice: 198.2, dayChange: 0.8, dayChangePercent: 0.41, totalValue: 19820, sector: 'Financial Services' },
    ],
    transactions: [{ id: 't1', date: '2024-05-10', type: 'Buy', ticker: 'JPM', companyName: 'JPMorgan Chase & Co. (Offline)', shares: 10, price: 195.0, totalValue: 1950 }],
    watchlist: [{ ticker: 'NVDA', companyName: 'NVIDIA Corp. (Offline)', shares: 0, currentPrice: 1200.0, dayChange: 10.5, dayChangePercent: 0.88, totalValue: 0, sector: 'Technology' }],
}};

export const fetchUpdatedPrices = (holdings: {ticker: string, currentPrice: number}[]): {ticker: string, currentPrice: number}[] => {
    return holdings.map(h => ({
        ticker: h.ticker,
        currentPrice: h.currentPrice + Math.random() * 2 - 1,
    }));
};

export const generatePersonalizedNews = (holdings: Holding[], watchlist: Holding[]): NewsItem[] => ([
    { headline: 'Tech Stocks Rally on AI Optimism (Offline)', url: '#', source: 'Fallback News', summary: 'Major tech companies saw gains as investors remain optimistic about artificial intelligence developments.', sentiment: 'Positive', ticker: 'AAPL' },
    { headline: 'Fed Hints at Steady Interest Rates (Offline)', url: '#', source: 'Fallback News', summary: 'The Federal Reserve has indicated that interest rates are likely to hold steady for the near future, calming market jitters.', sentiment: 'Neutral', ticker: 'JPM' },
]);

export const calculatePortfolioScore = (holdings: Holding[]): PortfolioScore => ({
    score: 75, summary: 'This is a sample portfolio analysis from offline mode.'
});

export const checkForAchievements = (action: string, data: any, unlockedIds: string[]): Pick<Achievement, 'id'|'title'>[] => {
    return []; // Don't unlock new achievements in fallback mode to keep it simple
};

export const generateDividendData = (holdings: Holding[]): Dividend[] => ([
    { ticker: 'AAPL', companyName: 'Apple Inc. (Offline)', amountPerShare: 0.25, totalAmount: 12.5, payDate: '2024-08-15', exDividendDate: '2024-08-08' },
    { ticker: 'MSFT', companyName: 'Microsoft Corp. (Offline)', amountPerShare: 0.75, totalAmount: 22.5, payDate: '2024-09-12', exDividendDate: '2024-08-21' },
]);

export const generateTaxLossOpportunities = (holdings: Holding[]): TaxLossOpportunity[] => ([
    { ticker: 'INTC', companyName: 'Intel Corp. (Offline)', sharesToSell: 50, estimatedLoss: -500, costBasis: 4000, currentValue: 3500, explanation: 'This stock has underperformed, providing an opportunity to offset gains elsewhere. (Offline)'}
]);

export const generateVideoBriefing = async (prompt: string): Promise<any> => {
    return Promise.resolve({ done: false, prompt: prompt });
};

export const getVideoOperationStatus = async (operation: any): Promise<any> => {
    // Simulate a successful completion after a short delay
    return Promise.resolve({
        done: true,
        response: {
            generatedVideos: [{
                video: { uri: 'https://storage.googleapis.com/generative-ai-vision/veo-demo-videos/prompt-with-video/a_cinematic_shot_of_a_woman_walking_through_a_paddy_field_in_the_paddy_field.mp4' }
            }]
        }
    });
};

export const generateEducationalContent = (category: string): EducationalContent[] => ([
    { id: 'fb1', type: 'Article', title: `Intro to ${category} (Offline)`, summary: `A fallback article about ${category}.`, url: '#', sourceName: 'Fallback Institute' },
    { id: 'fb2', type: 'Video', title: `Video on ${category} (Offline)`, summary: `A fallback video about ${category}.`, url: '#', sourceName: 'Fallback Tube' },
    { id: 'fb3', type: 'Podcast', title: `Podcast for ${category} (Offline)`, summary: `A fallback podcast about ${category}.`, url: '#', sourceName: 'Fallback FM' },
]);

export const screenStocks = (criteria: ScreenerCriteria): ScreenerResult[] => ([
    { ticker: 'FBAK', companyName: 'Fallback Inc.', marketCap: 150, peRatio: 25, dividendYield: 1.5, sector: 'Technology', analystRating: 'Buy' },
    { ticker: 'OFFL', companyName: 'Offline Solutions', marketCap: 50, peRatio: 15, dividendYield: 2.5, sector: 'Industrials', analystRating: 'Hold' },
]);

export const createChat = (): Chat => {
    return {
        // Mock the sendMessageStream method
        sendMessageStream: async function*(params: { message: any }) {
            const responseText = "I am in offline fallback mode. My capabilities are limited.";
            for (const char of responseText.split('')) {
                await new Promise(r => setTimeout(r, 10)); // Simulate streaming
                yield { text: char };
            }
        },
    } as unknown as Chat; // Cast to Chat to satisfy type checker
};

export const generateFollowUpQuestions = (chatHistory: ChatMessage[]): string[] => ([
    'What is a stock?', 'What is a bond?', 'What is diversification?'
]);

export const generatePortfolio = (answers: QuestionnaireAnswers): PortfolioSuggestion => ({
    riskProfile: 'Moderate (Offline)',
    allocation: { stocks: 60, bonds: 25, cash: 5, commodities: 5, realEstate: 5 },
    explanation: 'This is a balanced portfolio suggestion generated in offline mode. It focuses on growth while maintaining a cushion against volatility.'
});

export const generateFinancials = (ticker: string): FinancialStatementsData => ({
    incomeStatement: [
        { year: 2023, revenue: 100e9, netIncome: 20e9 }, { year: 2022, revenue: 90e9, netIncome: 18e9 },
        { year: 2021, revenue: 85e9, netIncome: 17e9 }, { year: 2020, revenue: 75e9, netIncome: 15e9 },
    ],
    balanceSheet: [
        { year: 2023, totalAssets: 200e9, totalLiabilities: 80e9, totalEquity: 120e9 },
        { year: 2022, totalAssets: 180e9, totalLiabilities: 70e9, totalEquity: 110e9 },
    ],
    cashFlow: [
        { year: 2023, operatingCashFlow: 30e9, investingCashFlow: -10e9, financingCashFlow: -15e9 },
        { year: 2022, operatingCashFlow: 28e9, investingCashFlow: -8e9, financingCashFlow: -12e9 },
    ],
});

export const generateChartData = (ticker: string, timeframe: ChartTimeframe): StockChartDataPoint[] => {
    const points = timeframe === '1Y' ? 250 : (timeframe === '5Y' ? 260 : 120);
    let price = 150;
    return Array.from({ length: points }, (_, i) => {
        const date = new Date();
        if (timeframe === '1Y') date.setDate(date.getDate() - (points - i));
        else if (timeframe === '5Y') date.setDate(date.getDate() - (points - i) * 7);
        else date.setMonth(date.getMonth() - (points - i));

        const open = price;
        const change = Math.random() * 4 - 2;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * 2;
        const low = Math.min(open, close) - Math.random() * 2;
        price = close;
        return { date: date.toISOString().split('T')[0], open, high, low, close, adjustedClose: close };
    });
};

export const generateTranscripts = (ticker: string): TranscriptsData => ({
    transcripts: [
        { quarter: 'Q2 2024 (Offline)', date: '2024-07-25', summary: 'Summary of offline earnings call.', transcript: 'We had a good offline quarter. We are optimistic about the future of offline operations.', sourceIndex: 1 },
        { quarter: 'Q1 2024 (Offline)', date: '2024-04-25', summary: 'Summary of Q1 offline earnings call.', transcript: 'Q1 was solid for our offline segment.', sourceIndex: 1 }
    ],
    sources: [{ uri: '#', title: 'Offline Source Inc.', index: 1 }]
});

export const generateStockAnalysis = (ticker: string): StockAnalysisData => ({
    businessSummary: `An analysis of ${ticker} generated in offline mode. This company is a leader in its respective offline industry, focusing on tangible goods and services.`,
    bullCase: 'The company might do well if offline mode is popular, as it has strong brand recognition in non-digital spaces.',
    bearCase: 'The company might do poorly if users prefer online mode, as it has less of a digital footprint.',
    financialHealth: { score: 7, summary: 'Health is good in offline mode, with steady revenue streams.' },
    recentNews: [{ headline: 'Offline Mode Activated', summary: "The system is currently running in a simulated offline mode.", sentiment: 'Neutral', sourceIndex: 1 }],
    sources: [{ uri: '#', title: 'Offline Analysis Corp.', index: 1 }]
});

export const getFilings = (ticker: string): SecFiling[] => ([
    { accessionNumber: '000-OFFLINE-10Q', filingDate: '2024-05-01', reportDate: '2024-03-31', form: '10-Q (Offline)', primaryDocument: 'doc.html', primaryDocDescription: 'Quarterly Report', url: '#' },
    { accessionNumber: '000-OFFLINE-8K', filingDate: '2024-04-15', reportDate: '2024-04-15', form: '8-K (Offline)', primaryDocument: 'doc.html', primaryDocDescription: 'Current Event', url: '#' }
]);

export const generateStockComparison = (tickers: string[]): StockComparisonData => {
    return tickers.map(ticker => ({
        ticker,
        companyName: `${ticker} Inc. (Offline)`,
        marketCap: Math.floor(Math.random() * 2000) + 100, // in billions
        peRatio: Math.random() * 30 + 10,
        dividendYield: Math.random() * 5,
        analystRating: "Buy",
        bullCase: `Strong growth potential in the offline market for ${ticker}.`,
        bearCase: `Facing stiff competition from other offline providers for ${ticker}.`,
        financialHealthSummary: `Solid balance sheet with consistent offline revenue.`,
    }));
};