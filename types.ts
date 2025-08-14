

export type View = 'dashboard' | 'portfolio' | 'research' | 'advisor' | 'education' | 'chatbot' | 'screener' | 'briefings' | 'analytics' | 'support';
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

export interface UserHolding {
  ticker: string;
  shares: number;
}

export interface Holding {
  ticker: string;
  companyName: string;
  shares: number;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  totalValue: number;
  sector?: string; // Add sector for better allocation
  isUpdating?: boolean; // For real-time price flash effect
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
    url: string;
    source: string;
    summary: string; // AI generated summary
    sentiment: 'Positive' | 'Negative' | 'Neutral';
    ticker?: string; // Ticker it relates to
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

export interface BaseDashboardData {
    user: User;
    holdings: Holding[];
    transactions: Transaction[];
    watchlist: Holding[];
}

export interface DashboardData extends BaseDashboardData {
    netWorth: number;
    portfolioPerformance: { date: string; price: number }[];
    allocation: { name: string; value: number }[];
    // New personalized features
    personalizedNews?: NewsItem[];
    portfolioScore: PortfolioScore;
    achievements: Achievement[];
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
        date: string;
        summary: string;
        transcript: string;
        sourceIndex: number;
    }[];
    sources: GroundingSource[];
}

export interface StockAnalysisData {
    businessSummary: string;
    bullCase: string;
    bearCase: string;
    financialHealth: {
        score: number;
        summary: string;
    };
    recentNews: {
        headline: string;
        summary: string;
        sentiment: 'Positive' | 'Negative' | 'Neutral';
        sourceIndex: number;
    }[];
    sources: GroundingSource[];
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
  peRatio: number;
  dividendYield: number;
  sector: string;
  analystRating: string;
}

export interface FinancialStatementsData {
    incomeStatement: {
        year: number;
        revenue: number;
        netIncome: number;
    }[];
    balanceSheet: {
        year: number;
        totalAssets: number;
        totalLiabilities: number;
        totalEquity: number;
    }[];
    cashFlow: {
        year: number;
        operatingCashFlow: number;
        investingCashFlow: number;
        financingCashFlow: number;
    }[];
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