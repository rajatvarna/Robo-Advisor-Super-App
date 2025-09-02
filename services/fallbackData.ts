





import { Type } from "@google/genai";
import type { Chat } from '@google/genai';
// FIX: Added all missing type imports.
import type { Holding, ScreenerResult, ScreenerCriteria, PortfolioSuggestion, QuestionnaireAnswers, StockChartDataPoint, ChartTimeframe, FinancialStatementsData, StockAnalysisData, EducationalContent, DashboardData, NewsItem, PortfolioScore, Achievement, Dividend, TaxLossOpportunity, SecFiling, ChatMessage, BaseDashboardData, GroundingSource, StockComparisonData, Quote, UserWatchlist, CryptoData, Alert, StockMetrics, EarningsTranscript, StockComparisonItem, TranscriptsData } from '../types';

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
                    sector: { type: Type.STRING },
                },
                required: ["id", "date", "type", "ticker", "companyName", "shares", "price", "totalValue"]
            }
        },
        watchlists: { 
            type: Type.ARRAY, 
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    tickers: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                 required: ["id", "name", "tickers"]
            }
        },
    },
    required: ["user", "holdings", "transactions", "watchlists"]
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
        peRatio: { type: Type.NUMBER, nullable: true, description: "Price-to-Earnings ratio. Can be null if not applicable." },
        dividendYield: { type: Type.NUMBER, nullable: true, description: "Dividend yield in percent. Can be null if not applicable." },
        analystRating: { type: Type.STRING, description: "Consensus analyst rating, e.g., 'Buy', 'Hold', 'Strong Buy'." },
        bullCase: { type: Type.STRING, description: "A brief summary of the bull case for the stock." },
        bearCase: { type: Type.STRING, description: "A brief summary of the bear case for the stock." },
        financialHealthSummary: { type: Type.STRING, description: "A one-sentence summary of the company's financial health." },
    },
    required: ["ticker", "companyName", "marketCap", "peRatio", "dividendYield", "analystRating", "bullCase", "bearCase", "financialHealthSummary"],
};


// --- Fallback Data for Services ---

export const getFallbackQuote = (ticker: string): Quote => {
    const previousClose = 150 + Math.random() * 20 - 10;
    const currentPrice = previousClose + Math.random() * 4 - 2;
    const dayChange = currentPrice - previousClose;
    const dayChangePercent = (dayChange / previousClose) * 100;
    return {
        ticker: ticker.toUpperCase(),
        currentPrice,
        dayChange,
        dayChangePercent,
        previousClose,
    };
};

export const fetchQuotes = (tickers: string[]): Record<string, Quote> => {
    const quotes: Record<string, Quote> = {};
    tickers.forEach(ticker => {
        quotes[ticker] = getFallbackQuote(ticker);
    });
    return quotes;
};

export const fetchHistoricalData = (ticker: string, startDate: string): {date: string, price: number}[] => {
    const data: {date: string, price: number}[] = [];
    let currentDate = new Date(startDate);
    const endDate = new Date();
    let price = 150 + Math.random() * 50;

    while(currentDate <= endDate) {
        price += (Math.random() - 0.5) * 5;
        if (price < 10) price = 10;
        data.push({
            date: currentDate.toISOString().split('T')[0],
            price: price,
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return data;
};


export const fetchStockDetailsForPortfolio = (ticker: string): { companyName: string, sector: string } => ({
    companyName: `${ticker.toUpperCase()} Inc.`,
    sector: "Technology",
});

const DEMO_STOCKS = [
    { ticker: 'AAPL', companyName: 'Apple Inc.', sector: 'Technology', price: 190.5, shares: 50 },
    { ticker: 'MSFT', companyName: 'Microsoft Corp.', sector: 'Technology', price: 420.7, shares: 30 },
    { ticker: 'JPM', companyName: 'JPMorgan Chase & Co.', sector: 'Financial Services', price: 198.2, shares: 100 },
    { ticker: 'JNJ', companyName: 'Johnson & Johnson', sector: 'Healthcare', price: 165.4, shares: 60 },
    { ticker: 'V', companyName: 'Visa Inc.', sector: 'Financial Services', price: 275.1, shares: 40 },
];


export const generateDashboardData = async (): Promise<DashboardData> => {
    const transactions = DEMO_STOCKS.map((stock, i) => {
        const price = stock.price * (0.9 + Math.random() * 0.1);
        return {
            id: `txn-${i}`,
            date: new Date(Date.now() - (30+i*15) * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // transactions in the past
            type: 'Buy' as 'Buy' | 'Sell',
            ticker: stock.ticker,
            companyName: stock.companyName,
            shares: stock.shares,
            price: price,
            totalValue: stock.shares * price,
            sector: stock.sector
        };
    });
    
    // This holdings data is just for getting tickers, it will be immediately recalculated in App.tsx
    const holdings: Holding[] = DEMO_STOCKS.map(stock => ({
        ticker: stock.ticker,
        companyName: stock.companyName,
        sector: stock.sector,
        shares: stock.shares,
        currentPrice: stock.price,
        dayChange: 0,
        dayChangePercent: 0,
        previousClose: stock.price,
        totalValue: stock.price * stock.shares,
        costBasis: 0, 
        unrealizedGain: 0,
        unrealizedGainPercent: 0,
    }));

    const watchlists: UserWatchlist[] = [{ 
        id: 'wl-1',
        name: 'Tech Giants',
        tickers: ['NVDA', 'GOOGL']
    }];
    
    const baseData: BaseDashboardData = {
        // FIX: Added subscription property to match updated User type.
        user: { uid: 'demo-user-uid', name: 'Demo User', email: 'demo@example.com', memberSince: '2023-01-01', subscription: 'free' },
        holdings,
        transactions,
        watchlists,
    };

    // This is a placeholder; the actual full data is constructed in App.tsx
    return {
        ...baseData,
        netWorth: 0,
        portfolioPerformance: [],
        allocation: [],
        // FIX: Added missing properties to align with updated DashboardData type.
        portfolioScore: { score: 85, summary: "A well-diversified portfolio with solid holdings." },
        achievements: [],
        alerts: [],
        integrations: {
            interactiveBrokers: { connected: false }
        }
    };
};

export const getInteractiveBrokersPortfolio = (): BaseDashboardData => {
    const ibkrStocks = [
        { ticker: 'NVDA', companyName: 'NVIDIA Corporation', sector: 'Technology', shares: 25, price: 950.0 },
        { ticker: 'TSLA', companyName: 'Tesla, Inc.', sector: 'Consumer Cyclical', shares: 50, price: 175.0 },
        { ticker: 'SNOW', companyName: 'Snowflake Inc.', sector: 'Technology', shares: 40, price: 160.0 },
        { ticker: 'UBER', companyName: 'Uber Technologies, Inc.', sector: 'Technology', shares: 100, price: 65.0 },
    ];

    const transactions = ibkrStocks.map((stock, i) => {
        const price = stock.price * (0.95 + Math.random() * 0.05); // Purchase price is slightly less than current
        return {
            id: `ibkr-txn-${i}`,
            date: new Date(Date.now() - (60 + i * 20) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            type: 'Buy' as 'Buy',
            ticker: stock.ticker,
            companyName: stock.companyName,
            sector: stock.sector,
            shares: stock.shares,
            price: price,
            totalValue: stock.shares * price
        };
    });

     // This holdings data is just for getting tickers, it will be immediately recalculated in App.tsx
    const holdings: Holding[] = ibkrStocks.map(stock => ({
        ticker: stock.ticker,
        companyName: stock.companyName,
        sector: stock.sector,
        shares: stock.shares,
        currentPrice: stock.price,
        dayChange: 0, dayChangePercent: 0, previousClose: stock.price, totalValue: stock.price * stock.shares,
        costBasis: 0, unrealizedGain: 0, unrealizedGainPercent: 0,
    }));

    return {
        // FIX: Added subscription property to match updated User type.
        user: { uid: 'demo-user-uid', name: 'Demo User', email: 'demo@example.com', memberSince: '2023-01-01', subscription: 'free' },
        holdings,
        transactions,
        watchlists: [], // Synced portfolios usually don't bring watchlists
    };
}


export const generatePersonalizedNews = (holdingTickers: string[], watchlistTickers: string[]): NewsItem[] => ([
    // FIX: Removed invalid 'sentiment' property to match NewsItem type.
    { id: 'news-1', headline: 'Tech Stocks Rally on AI Optimism', url: '#', source: 'Simulated News', summary: 'Major tech companies saw gains as investors remain optimistic about artificial intelligence developments.', ticker: 'AAPL', publishedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString() },
    { id: 'news-2', headline: 'Fed Hints at Steady Interest Rates', url: '#', source: 'Simulated News', summary: 'The Federal Reserve has indicated that interest rates are likely to hold steady for the near future, calming market jitters.', ticker: 'JPM', publishedAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString() },
]);

export const getTopBusinessNews = (): NewsItem[] => ([
    { id: 'top-news-1', headline: 'Global Markets Show Mixed Results Amid Inflation Fears', url: '#', source: 'Reuters', summary: 'Investors are cautiously watching economic indicators as inflation concerns linger, leading to a mixed performance across global stock markets.', publishedAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString() },
    { id: 'top-news-2', headline: 'Tech Sector Faces New Regulatory Scrutiny', url: '#', source: 'WSJ', summary: 'Governments worldwide are increasing their focus on regulating major technology firms, potentially impacting future growth.', publishedAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString() },
    { id: 'top-news-3', headline: 'Oil Prices Surge on Supply Chain Worries', url: '#', source: 'Bloomberg', summary: 'Disruptions in the global supply chain have caused a significant increase in crude oil prices, affecting energy markets.', publishedAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString() },
]);

export const getCryptoNews = (): NewsItem[] => ([
    { id: 'crypto-news-1', headline: 'Bitcoin Surges Past Fictional Milestone', url: '#', source: 'CoinDesk', summary: 'Bitcoin reached a new simulated all-time high as institutional interest continues to grow.', publishedAt: new Date(Date.now() - 60000 * 30).toISOString() },
    { id: 'crypto-news-2', headline: 'Ethereum "Merge" Upgrade Successful in Testnet', url: '#', source: 'The Block', summary: 'A key test for Ethereum\'s transition to Proof-of-Stake has completed successfully, developers report.', publishedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString() },
    { id: 'crypto-news-3', headline: 'DeFi Sector Sees Record Inflows', url: '#', source: 'Cointelegraph', summary: 'Decentralized Finance protocols have attracted a record amount of capital in the last month, data shows.', publishedAt: new Date(Date.now() - 3600 * 1000 * 10).toISOString() },
]);

export const getTopCryptos = (): CryptoData[] => ([
    { name: 'Bitcoin', symbol: 'BTC', price: 68050.55, change24h: 2.1, marketCap: 1340000000000 },
    { name: 'Ethereum', symbol: 'ETH', price: 3550.78, change24h: 1.5, marketCap: 426000000000 },
    { name: 'Tether', symbol: 'USDT', price: 1.00, change24h: 0.0, marketCap: 110000000000 },
    { name: 'BNB', symbol: 'BNB', price: 601.10, change24h: -0.5, marketCap: 90000000000 },
    { name: 'Solana', symbol: 'SOL', price: 150.25, change24h: 5.3, marketCap: 67000000000 },
    { name: 'XRP', symbol: 'XRP', price: 0.52, change24h: -1.2, marketCap: 28000000000 },
    { name: 'Cardano', symbol: 'ADA', price: 0.45, change24h: 3.0, marketCap: 16000000000 },
]);


export const calculatePortfolioScore = (holdings: Holding[]): PortfolioScore => ({
    score: 78, summary: 'A well-diversified portfolio with solid holdings.'
});

export const checkForAchievements = (action: string, data: any, unlockedIds: string[]): Pick<Achievement, 'id'|'title'>[] => {
    return []; // Don't unlock new achievements in fallback mode to keep it simple
};

export const generateDashboardInsights = (): string[] => ([
    "Your portfolio is heavily weighted in the Technology sector (45%), consider diversifying.",
    "AAPL has shown strong performance this week, up 5.2%.",
    "You are 25% of the way to your 'New Home' investment goal. Keep it up!",
]);

export const generatePortfolioAlerts = (dashboardData: DashboardData): Alert[] => ([
    {
        id: `alert-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'Price',
        severity: 'Critical',
        title: 'Significant Price Movement in AAPL',
        description: 'AAPL is down 5.8% today on higher than average volume. This may be related to news about new tariffs.',
        ticker: 'AAPL',
        read: false
    },
    {
        id: `alert-${Date.now() - 100000}`,
        timestamp: new Date(Date.now() - 100000).toISOString(),
        type: 'Portfolio',
        severity: 'Warning',
        title: 'High Sector Concentration',
        description: 'Your portfolio concentration in the Technology sector has reached 48%, which is above the recommended threshold of 40%.',
        read: true
    }
]);

export const generateDividendData = (holdings: Holding[]): Dividend[] => ([
    { ticker: 'AAPL', companyName: 'Apple Inc.', amountPerShare: 0.25, totalAmount: 12.5, payDate: '2024-08-15', exDividendDate: '2024-08-08' },
    { ticker: 'MSFT', companyName: 'Microsoft Corp.', amountPerShare: 0.75, totalAmount: 22.5, payDate: '2024-09-12', exDividendDate: '2024-08-21' },
]);

export const generateTaxLossOpportunities = (holdings: Holding[]): TaxLossOpportunity[] => ([
    { ticker: 'INTC', companyName: 'Intel Corp.', sharesToSell: 50, estimatedLoss: -500, costBasis: 4000, currentValue: 3500, explanation: 'This stock has underperformed, providing an opportunity to offset gains elsewhere.'}
]);

export const generateEducationalContent = (category: string): EducationalContent[] => ([
    { id: 'fb1', type: 'Article', title: `Intro to ${category}`, summary: `An introductory article about ${category}.`, url: '#', sourceName: 'Invest Institute' },
    { id: 'fb2', type: 'Video', title: `Video on ${category}`, summary: `A helpful video explaining the basics of ${category}.`, url: '#', sourceName: 'FinTube' },
    { id: 'fb3', type: 'Podcast', title: `Podcast for ${category}`, summary: `A podcast episode discussing advanced strategies in ${category}.`, url: '#', sourceName: 'Market Movers FM' },
]);

export const screenStocks = (criteria: ScreenerCriteria): ScreenerResult[] => ([
    // FIX: Added analystRating to align with updated ScreenerResult type.
    { ticker: 'DEMO', companyName: 'Demo Corp.', marketCap: 150000000000, peRatio: 25, dividendYield: 1.5, sector: 'Technology', analystRating: 'Buy' },
    { ticker: 'SMPL', companyName: 'Sample Industries', marketCap: 50000000000, peRatio: 15, dividendYield: 2.5, sector: 'Industrials', analystRating: 'Hold' },
]);

export const createChat = (): Chat => {
    return {
        // Mock the sendMessageStream method
        sendMessageStream: async function*(params: { message: any }) {
            const responseText = "I am operating in a simulated environment. For example, diversification is a strategy to manage risk.";
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
    riskProfile: 'Moderate (Simulated)',
    allocation: { stocks: 60, bonds: 25, cash: 5, commodities: 5, realEstate: 5 },
    explanation: 'This is a balanced portfolio suggestion generated in a simulated environment. It focuses on growth while maintaining a cushion against volatility.'
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
    incomeStatementKeys: ['revenue', 'netIncome'],
    balanceSheetKeys: ['totalAssets', 'totalLiabilities', 'totalEquity'],
    cashFlowKeys: ['operatingCashFlow', 'investingCashFlow', 'financingCashFlow'],
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
        return { date: date.toISOString().split('T')[0], close };
    });
};

export const generateStockAnalysis = (ticker: string): StockAnalysisData => ({
    businessSummary: `This is a simulated analysis of ${ticker}. This company is a leader in its respective industry, focusing on innovative products and services.`,
    bullCase: 'The company might perform well due to strong brand recognition and expansion into new markets.',
    bearCase: 'The company might face challenges from increased competition and shifting consumer preferences.',
    financialHealth: { score: 7, summary: 'Financial health is stable, with consistent revenue streams.' },
    // FIX: Removed invalid 'sentiment' and 'sourceIndex' properties.
    recentNews: [{ id: 'analysis-news-1', headline: 'Company Announces New Product Line', url: '#', source: 'Simulated News', summary: "The company has revealed a new line of products expected to launch next quarter.", publishedAt: new Date().toISOString() }],
    sources: [{ uri: '#', title: 'Simulated Analysis Corp.' }]
});

// FIX: Added missing fallback function.
export const getStockMetrics = (ticker: string): StockMetrics => ({
    ticker,
    companyName: `${ticker} Inc.`,
    marketCap: 2.5e12,
    peRatio: 30.5,
    dividendYield: 0.6,
    beta: 1.2,
    week52High: 200,
    week52Low: 150,
    analystRating: 'Strong Buy',
});

export const getFilings = (ticker: string): SecFiling[] => ([
    { accessionNumber: '000-000000-00-10Q', filingDate: '2024-05-01', reportDate: '2024-03-31', form: '10-Q', primaryDocument: 'doc.html', primaryDocDescription: 'Quarterly Report', url: '#' },
    { accessionNumber: '000-000000-00-08K', filingDate: '2024-04-15', reportDate: '2024-04-15', form: '8-K', primaryDocument: 'doc.html', primaryDocDescription: 'Current Event', url: '#' }
]);

export const generateStockComparison = (tickers: string[]): StockComparisonData => {
    // FIX: Added missing properties to align with StockComparisonItem type.
    return tickers.map(ticker => ({
        ticker,
        companyName: `${ticker} Inc. (Demo)`,
        marketCap: (Math.floor(Math.random() * 2000) + 100) * 1e9,
        peRatio: Math.random() * 30 + 10,
        dividendYield: Math.random() * 5,
        analystRating: "Buy",
        beta: Math.random() + 0.5,
        week52High: Math.random() * 100 + 150,
        week52Low: Math.random() * 50 + 80,
        bullCase: `Strong growth potential in the current market for ${ticker}.`,
        bearCase: `Facing stiff competition from other providers for ${ticker}.`,
        financialHealthSummary: `Solid balance sheet with consistent revenue.`,
    }));
};

// FIX: Added missing fallback function for earnings transcripts.
export const generateTranscripts = (ticker: string): TranscriptsData => ({
    transcripts: [
        { quarter: 2, year: 2024, date: '2024-07-28', url: '#' },
        { quarter: 1, year: 2024, date: '2024-04-26', url: '#' },
        { quarter: 4, year: 2023, date: '2024-01-25', url: '#' },
        { quarter: 3, year: 2023, date: '2023-10-27', url: '#' },
    ]
});
