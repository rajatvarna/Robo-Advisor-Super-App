

export type View = 'dashboard' | 'portfolio' | 'research' | 'advisor' | 'education' | 'chatbot' | 'screener' | 'analytics' | 'support' | 'news' | 'crypto' | 'integrations' | 'alerts';
export type ApiMode = 'gemini' | 'opensource';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string | null; // Base64 data URL
  recommendedQuestions?: string[];
  isTyping?: boolean;
}

export interface User {
  name: string;
  email: string;
  memberSince: string;
}

export interface AddHoldingData {
  ticker: string;
  shares: number;
  purchasePrice: number;
  purchaseDate: string;
}

// Represents real-time price data from the market
export interface Quote {
  ticker: string;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  previousClose: number;
  isUpdating?: boolean; // For real-time price flash effect
}

export interface Holding extends Quote {
  companyName: string;
  shares: number;
  totalValue: number;
  sector?: string; 
  costBasis: number; // Total cost of acquiring the shares
  unrealizedGain: number;
  unrealizedGainPercent: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'Buy' | 'Sell';
  ticker: string;
  companyName:string;
  shares: number;
  price: number;
  totalValue: number;
  sector?: string;
}

export interface EducationalContent {
  id: string;
  type: 'Article' | 'Video' | 'Podcast';
  title: string;
  summary: string;
  url: string;
  sourceName: string;
}

export interface NewsItem {
    headline: string;
    url: string | null;
    source: string;
    summary?: string; // AI generated summary
    publishedAt: string | null; // ISO 8601 format
    sentiment?: 'Positive' | 'Negative' | 'Neutral';
    ticker?: string; // Ticker it relates to
    sourceIndex?: number;
}

export interface Alert {
    id: string;
    timestamp: string; // ISO 8601 format
    type: 'Price' | 'News' | 'Portfolio' | 'Goal';
    severity: 'Info' | 'Warning' | 'Critical';
    title: string;
    description: string;
    ticker?: string;
    read: boolean;
}


export interface Achievement {
    id: string;
    title: string;
    description: string;
    unlocked: boolean;
    unlockedAt?: string;
}

export interface PortfolioScore {
    score: number; // 1-100
    summary: string;
}

export interface InvestmentGoal {
    name: 'Retirement' | 'Wealth Building' | 'New Home' | 'Education' | 'Other';
    targetAmount: number;
    targetDate: string;
}

export interface UserWatchlist {
    id: string;
    name: string;
    tickers: string[];
}

export interface BrokerageIntegration {
    connected: boolean;
    lastSync?: string;
}

export interface BaseDashboardData {
    user: User;
    holdings: Holding[];
    transactions: Transaction[];
    watchlists: UserWatchlist[];
}

export interface DashboardData extends BaseDashboardData {
    netWorth: number;
    portfolioPerformance: { date: string; price: number }[];
    allocation: { name: string; value: number }[];
    personalizedNews?: NewsItem[];
    dashboardInsights?: string[];
    portfolioScore: PortfolioScore;
    achievements: Achievement[];
    alerts: Alert[];
    goal?: InvestmentGoal;
    integrations: {
        interactiveBrokers: BrokerageIntegration;
    };
}

export type ChartTimeframe = '1Y' | '5Y' | '10Y';
export type ChartType = 'line' | 'area' | 'candlestick';

export interface PortfolioAllocation {
  stocks: number;
  bonds: number;
  cash: number;
  commodities: number;
  realEstate: number;
}

export interface PortfolioSuggestion {
  allocation: PortfolioAllocation;
  explanation: string;
  riskProfile: string;
}

export interface QuestionnaireAnswers {
  age: string;
  horizon: string;
  goal: string;
  riskTolerance: string;
  liquidity: string;
}

export interface SecFiling {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  form: string;
  primaryDocument: string;
  primaryDocDescription: string;
  url: string;
}

export interface StockChartDataPoint {
    date: string;
    close: number;
}

export interface GroundingSource {
    uri: string;
    title: string;
    index: number;
}

export interface TranscriptsData {
    transcripts: {
        quarter: string;
        year?: number;
        date: string;
        summary: string;
        transcript: string;
    }[];
}

export interface StockAnalysisData {
    businessSummary: string;
    bullCase: string;
    bearCase: string;
    financialHealth: {
        score: number;
        summary: string;
    };
    recentNews: NewsItem[];
    sources?: GroundingSource[];
}

export interface ScreenerCriteria {
  marketCapMin: number;
  marketCapMax: number;
  peRatioMin: number;
  peRatioMax: number;
  dividendYieldMin: number;
  dividendYieldMax: number;
  sectors: string[];
  analystRating: string;
}

export interface ScreenerResult {
  ticker: string;
  companyName: string;
  marketCap: number;
  peRatio: number | null;
  dividendYield: number | null;
  sector: string;
  analystRating: string;
}

export interface FinancialStatementItem {
    year: number;
    [key: string]: number;
}

export interface FinancialStatementsData {
    incomeStatement: FinancialStatementItem[];
    balanceSheet: FinancialStatementItem[];
    cashFlow: FinancialStatementItem[];
    incomeStatementKeys: string[];
    balanceSheetKeys: string[];
    cashFlowKeys: string[];
}

// --- ANALYTICS PAGE ---
export interface Dividend {
    ticker: string;
    companyName: string;
    amountPerShare: number;
    totalAmount: number;
    payDate: string;
    exDividendDate: string;
}

export interface TaxLossOpportunity {
    ticker: string;
    companyName: string;
    sharesToSell: number;
    estimatedLoss: number;
    costBasis: number;
    currentValue: number;
    explanation: string;
}

export interface PortfolioHistoryPoint {
    date: string;
    portfolioValue: number;
    benchmarkValue: number;
}

// --- RESEARCH PAGE ---
export interface StockComparisonItem {
    ticker: string;
    companyName: string;
    marketCap: number;
    peRatio: number | null;
    dividendYield: number | null;
    analystRating: string;
    bullCase: string;
    bearCase: string;
    financialHealthSummary: string;
}

export type StockComparisonData = StockComparisonItem[];

// --- CRYPTO PAGE ---
export interface CryptoData {
    name: string;
    symbol: string;
    price: number;
    change24h: number | null; // As a percentage
    marketCap: number;
}