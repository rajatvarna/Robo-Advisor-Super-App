


export type View = 'dashboard' | 'portfolio' | 'research' | 'screener' | 'analytics' | 'support' | 'news' | 'crypto' | 'integrations' | 'subscription';

// FIX: Added ApiMode type for API switching.
export type ApiMode = 'gemini' | 'opensource';

export interface User {
  uid: string;
  name: string;
  email: string;
  memberSince: string;
  // FIX: Added optional subscription property.
  subscription?: string;
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

export interface NewsItem {
    headline: string;
    url: string | null;
    source: string;
    summary?: string;
    publishedAt: string | null; // ISO 8601 format
    ticker?: string; // Ticker it relates to
    id: string; // Unique ID for dismissal
    // FIX: Added optional sentiment property.
    sentiment?: string;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    unlocked: boolean;
    unlockedAt?: string;
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

// FIX: Added new types for various features.
export interface QuestionnaireAnswers {
  age: string;
  horizon: string;
  goal: string;
  riskTolerance: string;
  liquidity: string;
}

export interface PortfolioAllocation {
    stocks: number;
    bonds: number;
    cash: number;
    commodities: number;
    realEstate: number;
}

export interface PortfolioSuggestion {
  riskProfile: string;
  allocation: PortfolioAllocation;
  explanation: string;
}

export interface TranscriptsData {
    transcripts: EarningsTranscript[];
}

export interface GroundingSource {
  uri: string;
  title: string;
  index?: number;
}

export interface EducationalContent {
    id: string;
    type: 'Article' | 'Video' | 'Podcast';
    title: string;
    summary: string;
    url: string;
    sourceName: string;
}

export interface StockAnalysisData {
    businessSummary: string;
    bullCase: string;
    bearCase: string;
    financialHealth: { score: number; summary: string };
    recentNews: NewsItem[];
    sources: GroundingSource[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string | null;
  isTyping?: boolean;
  recommendedQuestions?: string[];
}

export interface PortfolioScore {
    score: number;
    summary: string;
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

export interface Alert {
    id: string;
    timestamp: string;
    type: 'Price' | 'News' | 'Portfolio' | 'Goal';
    severity: 'Info' | 'Warning' | 'Critical';
    title: string;
    description: string;
    ticker?: string;
    read: boolean;
}

export type ChartTimeframe = '6M' | '1Y' | '5Y';


export interface DashboardData extends BaseDashboardData {
    netWorth: number;
    portfolioPerformance: { date: string; price: number }[];
    allocation: { name: string; value: number }[];
    achievements: Achievement[];
    goal?: InvestmentGoal;
    integrations: {
        interactiveBrokers: BrokerageIntegration;
    };
    dismissedNewsIds?: string[];
    notes?: Record<string, string>; // ticker -> note content
    // FIX: Added optional properties for new features.
    portfolioScore?: PortfolioScore;
    alerts?: Alert[];
}

export interface SecFiling {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  form: string;
  url: string;
  primaryDocument: string;
  primaryDocDescription: string;
}

export interface StockChartDataPoint {
    date: string;
    close: number;
}

export interface EarningsTranscript {
    quarter: number;
    year: number;
    date: string;
    url: string;
}

export interface StockMetrics {
    ticker: string;
    companyName: string;
    marketCap: number | null;
    peRatio: number | null;
    dividendYield: number | null;
    beta: number | null;
    week52High: number | null;
    week52Low: number | null;
    analystRating?: string;
}

export interface ScreenerCriteria {
  marketCapMin: number;
  marketCapMax: number;
  peRatioMin: number;
  peRatioMax: number;
  dividendYieldMin: number;
  dividendYieldMax: number;
  sectors: string[];
  // FIX: Added optional analystRating property.
  analystRating?: string;
}

export interface ScreenerResult {
  ticker: string;
  companyName: string;
  marketCap: number;
  peRatio: number | null;
  dividendYield: number | null;
  sector: string;
  // FIX: Added optional analystRating property.
  analystRating?: string;
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

export interface PortfolioHistoryPoint {
    date: string;
    portfolioValue: number;
    benchmarkValue: number;
}

// --- RESEARCH PAGE ---
// FIX: Defined a more specific type for stock comparison data.
export type StockComparisonItem = StockMetrics & {
    bullCase: string;
    bearCase: string;
    financialHealthSummary: string;
};
export type StockComparisonData = StockComparisonItem[];

// --- CRYPTO PAGE ---
export interface CryptoData {
    name: string;
    symbol: string;
    price: number;
    change24h: number | null; // As a percentage
    marketCap: number;
}