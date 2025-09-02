import type { Quote, NewsItem, FinancialStatementsData, SecFiling, ScreenerCriteria, ScreenerResult, CryptoData, Dividend, StockMetrics } from '../types';
import * as FallbackData from './fallbackData';
import { cacheService } from './cacheService';
import { ALPHAVANTAGE_API_KEY } from '../process.env.js';

const ALPHAVANTAGE_URL = 'https://www.alphavantage.co';

const isAlphaVantageKeyValid = ALPHAVANTAGE_API_KEY && (ALPHAVANTAGE_API_KEY as string) !== 'YOUR_ALPHAVANTAGE_API_KEY_HERE';

const apiFetch = async (url: string, options?: RequestInit) => {
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error for ${url}: ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    if (data.error || data['Error Message'] || data['Information']) {
        throw new Error(`API error: ${data.error || data['Error Message'] || data['Information']}`);
    }
    return data;
};

// Add a helper for rate limiting
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchQuotes = async (tickers: string[]): Promise<Record<string, Quote>> => {
    if (!isAlphaVantageKeyValid) return FallbackData.fetchQuotes(tickers);
    
    const quotes: Record<string, Quote> = {};
    const uniqueTickers = [...new Set(tickers)];

    for (const ticker of uniqueTickers) {
        try {
            const cacheKey = `quote_av_${ticker}`;
            let quoteData = cacheService.get<Quote>(cacheKey);
            
            if (!quoteData) {
                // Alpha Vantage free tier is 5 calls/min. We'll set a delay of ~12.1s between requests to stay under the limit.
                await sleep(12100);
                const data = await apiFetch(`${ALPHAVANTAGE_URL}/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHAVANTAGE_API_KEY}`);
                const globalQuote = data['Global Quote'];
                if (!globalQuote || Object.keys(globalQuote).length === 0) {
                     // This could be due to an invalid ticker or hitting an API limit that returns an empty object.
                     throw new Error(`No quote data for ${ticker}`);
                }

                quoteData = {
                    ticker: globalQuote['01. symbol'],
                    currentPrice: parseFloat(globalQuote['05. price']),
                    dayChange: parseFloat(globalQuote['09. change']),
                    dayChangePercent: parseFloat(globalQuote['10. change percent'].replace('%', '')),
                    previousClose: parseFloat(globalQuote['08. previous close']),
                };
                cacheService.set(cacheKey, quoteData, 5 * 60 * 1000); // 5-minute cache for quotes
            }
            quotes[ticker] = quoteData;

        } catch (error) {
            console.error(`Failed to fetch quote for ${ticker}:`, error);
            quotes[ticker] = FallbackData.getFallbackQuote(ticker); // Provide fallback for individual failures
        }
    }
    return quotes;
};


export const fetchHistoricalData = async (ticker: string, startDate: string): Promise<{date: string, price: number}[]> => {
    if (!isAlphaVantageKeyValid) return FallbackData.fetchHistoricalData(ticker, startDate);
    
    try {
        const data = await apiFetch(`${ALPHAVANTAGE_URL}/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&outputsize=full&apikey=${ALPHAVANTAGE_API_KEY}`);
        const timeSeries = data['Time Series (Daily)'];
        
        const history = Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
            date: date,
            price: parseFloat(values['4. close']),
        })).filter(item => new Date(item.date) >= new Date(startDate)).reverse();

        return history;

    } catch (error) {
        console.error(`Failed to fetch historical data for ${ticker}:`, error);
        return FallbackData.fetchHistoricalData(ticker, startDate);
    }
}

export const getCompanyProfile = async (ticker: string): Promise<{ companyName: string; sector: string; }> => {
    if (!isAlphaVantageKeyValid) return FallbackData.fetchStockDetailsForPortfolio(ticker);

    const cacheKey = `profile_av_${ticker}`;
    const cached = cacheService.get<{ companyName: string; sector: string; }>(cacheKey);
    if(cached) return cached;

    try {
        const data = await apiFetch(`${ALPHAVANTAGE_URL}/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHAVANTAGE_API_KEY}`);
        const profile = { companyName: data.Name, sector: data.Sector };
        cacheService.set(cacheKey, profile, 24 * 60 * 60 * 1000); // 24 hour cache
        return profile;
    } catch (error) {
        console.error(`Failed to fetch company profile for ${ticker}:`, error);
        return FallbackData.fetchStockDetailsForPortfolio(ticker);
    }
};

export const getCompanyNews = async (ticker: string): Promise<NewsItem[]> => {
    if (!isAlphaVantageKeyValid) return FallbackData.generatePersonalizedNews([ticker], []);
    
    try {
        const data = await apiFetch(`${ALPHAVANTAGE_URL}/query?function=NEWS_SENTIMENT&tickers=${ticker}&limit=5&apikey=${ALPHAVANTAGE_API_KEY}`);
        
        if (!data.feed || !Array.isArray(data.feed)) {
            return []; // Return empty array if feed is missing or not an array
        }
        return data.feed.map((item: any): NewsItem => ({
            id: item.url,
            headline: item.title,
            url: item.url,
            source: item.source,
            summary: item.summary,
            publishedAt: new Date(item.time_published.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z')).toISOString(),
            ticker: ticker,
        }));
    } catch (error) {
        console.error(`Failed to fetch company news for ${ticker}:`, error);
        return FallbackData.generatePersonalizedNews([ticker], []);
    }
};

export const getMarketNews = async (category: 'general' | 'crypto'): Promise<NewsItem[]> => {
    if (!isAlphaVantageKeyValid) {
        return category === 'crypto' ? FallbackData.getCryptoNews() : FallbackData.getTopBusinessNews();
    }
     const topics = category === 'crypto' ? 'blockchain' : 'economy_monetary,finance';
    const url = `${ALPHAVANTAGE_URL}/query?function=NEWS_SENTIMENT&topics=${topics}&limit=20&apikey=${ALPHAVANTAGE_API_KEY}`;

    try {
        const data = await apiFetch(url);
        
        if (!data.feed || !Array.isArray(data.feed)) {
            return [];
        }
        return data.feed.map((item: any): NewsItem => ({
            id: item.url,
            headline: item.title,
            url: item.url,
            source: item.source,
            summary: item.summary,
            publishedAt: new Date(item.time_published.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z')).toISOString(),
        }));
    } catch(error) {
        console.error(`Failed to fetch market news for ${category}:`, error);
        return category === 'crypto' ? FallbackData.getCryptoNews() : FallbackData.getTopBusinessNews();
    }
};

export const getFinancials = async (ticker: string): Promise<FinancialStatementsData> => {
    if (!isAlphaVantageKeyValid) return FallbackData.generateFinancials(ticker);

    const cacheKey = `financials_av_${ticker}`;
    const cached = cacheService.get<FinancialStatementsData>(cacheKey);
    if (cached) return cached;

    try {
        const [income, balance, cashflow] = await Promise.all([
             apiFetch(`${ALPHAVANTAGE_URL}/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${ALPHAVANTAGE_API_KEY}`),
             apiFetch(`${ALPHAVANTAGE_URL}/query?function=BALANCE_SHEET&symbol=${ticker}&apikey=${ALPHAVANTAGE_API_KEY}`),
             apiFetch(`${ALPHAVANTAGE_URL}/query?function=CASH_FLOW&symbol=${ticker}&apikey=${ALPHAVANTAGE_API_KEY}`),
        ]);
        
        const result: FinancialStatementsData = {
            incomeStatement: [], balanceSheet: [], cashFlow: [],
            incomeStatementKeys: ['revenue', 'netIncome'],
            balanceSheetKeys: ['totalAssets', 'totalLiabilities', 'totalEquity'],
            cashFlowKeys: ['operatingCashFlow', 'investingCashFlow', 'financingCashFlow'],
        };

        income.annualReports.slice(0, 10).forEach((report: any) => {
             result.incomeStatement.push({ year: new Date(report.fiscalDateEnding).getFullYear(), revenue: parseFloat(report.totalRevenue), netIncome: parseFloat(report.netIncome) });
        });
        balance.annualReports.slice(0, 10).forEach((report: any) => {
             result.balanceSheet.push({ year: new Date(report.fiscalDateEnding).getFullYear(), totalAssets: parseFloat(report.totalAssets), totalLiabilities: parseFloat(report.totalLiabilities), totalEquity: parseFloat(report.totalShareholderEquity) });
        });
        cashflow.annualReports.slice(0, 10).forEach((report: any) => {
             result.cashFlow.push({ year: new Date(report.fiscalDateEnding).getFullYear(), operatingCashFlow: parseFloat(report.operatingCashflow), investingCashFlow: parseFloat(report.cashflowFromInvestment), financingCashFlow: parseFloat(report.cashflowFromFinancing) });
        });

        cacheService.set(cacheKey, result, 24 * 60 * 60 * 1000); // 24 hour cache
        return result;

    } catch (error) {
        console.error(`Failed to fetch financials for ${ticker}:`, error);
        return FallbackData.generateFinancials(ticker);
    }
};

export const getStockMetrics = async (ticker: string): Promise<StockMetrics> => {
     if (!isAlphaVantageKeyValid) return FallbackData.getStockMetrics(ticker);

    const cacheKey = `metrics_av_${ticker}`;
    const cached = cacheService.get<StockMetrics>(cacheKey);
    if(cached) return cached;

    try {
        const data = await apiFetch(`${ALPHAVANTAGE_URL}/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHAVANTAGE_API_KEY}`);
        
        const result: StockMetrics = {
            ticker: data.Symbol,
            companyName: data.Name,
            marketCap: parseFloat(data.MarketCapitalization),
            peRatio: parseFloat(data.PERatio),
            dividendYield: parseFloat(data.DividendYield) * 100,
            beta: parseFloat(data.Beta),
            week52High: parseFloat(data['52WeekHigh']),
            week52Low: parseFloat(data['52WeekLow']),
        };
        cacheService.set(cacheKey, result);
        return result;
    } catch (error) {
         console.error(`Failed to fetch stock metrics for ${ticker}:`, error);
         return FallbackData.getStockMetrics(ticker);
    }
};

export const getFilings = async (ticker: string): Promise<SecFiling[]> => {
    if (!isAlphaVantageKeyValid) return FallbackData.getFilings(ticker);

    const cacheKey = `filings_sec_av_${ticker}`;
    const cached = cacheService.get<SecFiling[]>(cacheKey);
    if (cached) return cached;

    try {
        // Step 1: Get CIK from Alpha Vantage
        const overviewData = await apiFetch(`${ALPHAVANTAGE_URL}/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHAVANTAGE_API_KEY}`);
        const cik = overviewData.CIK;
        if (!cik) throw new Error("CIK not found for ticker.");

        const formattedCik = cik.toString().padStart(10, '0');

        // Step 2: Get filings from SEC EDGAR API
        const secData = await apiFetch(`https://data.sec.gov/submissions/CIK${formattedCik}.json`, {
            headers: { 'User-Agent': 'Robo Advisor Super App demo@example.com' }
        });
        
        const recentFilings = secData.filings.recent;
        const filings: SecFiling[] = [];
        
        const formsToGet = ['10-K', '10-Q'];
        for (let i = 0; i < recentFilings.accessionNumber.length && filings.length < 10; i++) {
             if (formsToGet.includes(recentFilings.form[i])) {
                const accessionNumber = recentFilings.accessionNumber[i];
                const primaryDocument = recentFilings.primaryDocument[i];
                 filings.push({
                    accessionNumber: accessionNumber,
                    filingDate: recentFilings.filingDate[i],
                    reportDate: recentFilings.reportDate[i],
                    form: recentFilings.form[i],
                    url: `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNumber.replace(/-/g, '')}/${primaryDocument}`,
                    primaryDocument: primaryDocument,
                    primaryDocDescription: recentFilings.primaryDocDescription[i] || `${recentFilings.form[i]} filing`
                 });
             }
        }
        
        cacheService.set(cacheKey, filings, 6 * 60 * 60 * 1000);
        return filings;
    } catch (error) {
        console.error(`Failed to fetch filings for ${ticker}:`, error);
        return FallbackData.getFilings(ticker);
    }
};


export const screenStocks = async (criteria: ScreenerCriteria): Promise<ScreenerResult[]> => {
    console.warn("Live stock screener functionality has been replaced by a TradingView widget. Using fallback data for direct calls.");
    return FallbackData.screenStocks(criteria);
};

export const getDividends = async (ticker: string): Promise<Omit<Dividend, 'companyName'|'totalAmount'>[]> => {
    if (!isAlphaVantageKeyValid) return [];

    const cacheKey = `dividends_av_overview_${ticker}`;
    const cached = cacheService.get<Omit<Dividend, 'companyName'|'totalAmount'>[]>(cacheKey);
    if (cached) return cached;

    try {
        const data = await apiFetch(`${ALPHAVANTAGE_URL}/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHAVANTAGE_API_KEY}`);
        
        if (data.ExDividendDate && data.ExDividendDate !== 'N/A' && data.DividendPerShare && data.DividendPerShare !== 'N/A') {
            const exDate = new Date(data.ExDividendDate);
            const payDateFromApi = data.PaymentDate ? new Date(data.PaymentDate) : null;
            
            // Only return if the ex-dividend date is in the future
            if (exDate > new Date()) {
                // Payment date is often a few weeks after ex-dividend date.
                const payDate = payDateFromApi && payDateFromApi > exDate 
                    ? payDateFromApi 
                    : new Date(exDate.getTime() + (14 * 24 * 60 * 60 * 1000));

                const dividend = [{
                    ticker: data.Symbol,
                    amountPerShare: parseFloat(data.DividendPerShare),
                    payDate: payDate.toISOString().split('T')[0],
                    exDividendDate: data.ExDividendDate,
                }];
                cacheService.set(cacheKey, dividend, 24 * 60 * 60 * 1000);
                return dividend;
            }
        }
        
        cacheService.set(cacheKey, [], 24 * 60 * 60 * 1000);
        return [];
    } catch (error) {
        console.error(`Failed to get dividends for ${ticker}:`, error);
        return [];
    }
};

export const getTopCryptos = async(): Promise<CryptoData[]> => {
     console.warn("Live crypto data table has been replaced by a TradingView widget. Using fallback data for direct calls.");
    return FallbackData.getTopCryptos();
}