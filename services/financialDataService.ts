import type { ApiMode, Quote, NewsItem, FinancialStatementsData, SecFiling } from '../types';
import * as FallbackData from './fallbackData';
import { cacheService } from './cacheService';
import { FINNHUB_API_KEY } from '../process.env.js';

const BASE_URL = 'https://finnhub.io/api/v1';

const isKeyValid = FINNHUB_API_KEY && FINNHUB_API_KEY !== 'YOUR_FINNHUB_API_KEY_HERE';

const finnhubFetch = async (endpoint: string) => {
    if (!isKeyValid) {
        throw new Error("Finnhub API key not valid or not provided. Using fallback data.");
    }
    const url = `${BASE_URL}${endpoint}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Finnhub API error for ${endpoint}: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.error) {
         throw new Error(`Finnhub API error: ${data.error}`);
    }
    if (Object.keys(data).length === 0 || (data.c === 0 && data.pc === 0)) { // Finnhub returns empty object for invalid tickers
        throw new Error(`No data returned from Finnhub for endpoint: ${endpoint}. Ticker might be invalid.`);
    }
    return data;
};

export const fetchQuotes = async (tickers: string[], apiMode: ApiMode): Promise<Record<string, Quote>> => {
    if (apiMode === 'opensource' || !isKeyValid) {
        return FallbackData.fetchQuotes(tickers);
    }

    const quotes: Record<string, Quote> = {};
    const uniqueTickers = [...new Set(tickers)];

    await Promise.all(uniqueTickers.map(async (ticker) => {
        try {
            const data = await finnhubFetch(`/quote?symbol=${ticker}`);
            quotes[ticker] = {
                ticker,
                currentPrice: data.c,
                dayChange: data.d,
                dayChangePercent: data.dp,
                previousClose: data.pc,
            };
        } catch (error) {
            console.error(`Failed to fetch quote for ${ticker}:`, error);
            quotes[ticker] = FallbackData.getFallbackQuote(ticker);
        }
    }));

    return quotes;
};


export const fetchHistoricalData = async (ticker: string, startDate: string, apiMode: ApiMode): Promise<{date: string, price: number}[]> => {
    if (apiMode === 'opensource' || !isKeyValid) {
        return FallbackData.fetchHistoricalData(ticker, startDate);
    }
    
    try {
        const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
        const endTimestamp = Math.floor(Date.now() / 1000);
        
        const data = await finnhubFetch(`/stock/candle?symbol=${ticker}&resolution=D&from=${startTimestamp}&to=${endTimestamp}`);

        if (data.s !== 'ok') {
            return FallbackData.fetchHistoricalData(ticker, startDate);
        }
        
        const history = data.t.map((timestamp: number, index: number) => ({
            date: new Date(timestamp * 1000).toISOString().split('T')[0],
            price: data.c[index],
        }));

        return history;

    } catch (error) {
        console.error(`Failed to fetch historical data for ${ticker}:`, error);
        return FallbackData.fetchHistoricalData(ticker, startDate);
    }
}

export const getCompanyProfile = async (ticker: string, apiMode: ApiMode): Promise<{ companyName: string; sector: string; }> => {
    if (apiMode === 'opensource' || !isKeyValid) {
        return FallbackData.fetchStockDetailsForPortfolio(ticker);
    }
    const cacheKey = `profile_fh_${ticker}`;
    const cached = cacheService.get<{ companyName: string; sector: string; }>(cacheKey);
    if(cached) return cached;

    try {
        const data = await finnhubFetch(`/stock/profile2?symbol=${ticker}`);
        const profile = { companyName: data.name, sector: data.finnhubIndustry };
        cacheService.set(cacheKey, profile, 24 * 60 * 60 * 1000); // 24 hour cache
        return profile;
    } catch (error) {
        console.error(`Failed to fetch company profile for ${ticker}:`, error);
        return FallbackData.fetchStockDetailsForPortfolio(ticker);
    }
};

export const getCompanyNews = async (ticker: string, apiMode: ApiMode): Promise<NewsItem[]> => {
    if (apiMode === 'opensource' || !isKeyValid) {
        return FallbackData.generatePersonalizedNews([ticker], []);
    }
    
    try {
        const to = new Date().toISOString().split('T')[0];
        const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
        const data = await finnhubFetch(`/company-news?symbol=${ticker}&from=${from}&to=${to}`);
        
        return data.slice(0, 5).map((item: any): NewsItem => ({
            id: item.id.toString(),
            headline: item.headline,
            url: item.url,
            source: item.source,
            summary: item.summary,
            publishedAt: new Date(item.datetime * 1000).toISOString(),
            ticker: ticker,
        }));
    } catch (error) {
        console.error(`Failed to fetch company news for ${ticker}:`, error);
        return FallbackData.generatePersonalizedNews([ticker], []);
    }
};

export const getMarketNews = async (category: 'general' | 'crypto', apiMode: ApiMode): Promise<NewsItem[]> => {
    if (apiMode === 'opensource' || !isKeyValid) {
        return category === 'crypto' ? FallbackData.getCryptoNews() : FallbackData.getTopBusinessNews();
    }
    try {
        const data = await finnhubFetch(`/news?category=${category}`);
        
        return data.slice(0, 20).map((item: any): NewsItem => ({
            id: item.id.toString(),
            headline: item.headline,
            url: item.url,
            source: item.source,
            summary: item.summary,
            publishedAt: new Date(item.datetime * 1000).toISOString(),
        }));
    } catch(error) {
        console.error(`Failed to fetch market news for ${category}:`, error);
        return category === 'crypto' ? FallbackData.getCryptoNews() : FallbackData.getTopBusinessNews();
    }
};

export const getFinancials = async (ticker: string, apiMode: ApiMode): Promise<FinancialStatementsData> => {
    if (apiMode === 'opensource' || !isKeyValid) {
        return FallbackData.generateFinancials(ticker);
    }
    const cacheKey = `financials_fh_${ticker}`;
    const cached = cacheService.get<FinancialStatementsData>(cacheKey);
    if (cached) return cached;

    try {
        const data = await finnhubFetch(`/stock/financials-reported?symbol=${ticker}&freq=annual`);
        
        const reports = data.data;
        const result: FinancialStatementsData = {
            incomeStatement: [], balanceSheet: [], cashFlow: [],
            incomeStatementKeys: ['revenue', 'netIncome'],
            balanceSheetKeys: ['totalAssets', 'totalLiabilities', 'totalEquity'],
            cashFlowKeys: ['operatingCashFlow', 'investingCashFlow', 'financingCashFlow'],
        };
        
        reports.slice(0, 10).forEach((report: any) => {
            const year = report.year;
            // Income Statement
            const revenue = report.ic.find((i: any) => i.concept === 'us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax')?.value;
            const netIncome = report.ic.find((i: any) => i.concept === 'us-gaap_NetIncomeLoss')?.value;
            if (revenue && netIncome) result.incomeStatement.push({ year, revenue, netIncome });

            // Balance Sheet
            const totalAssets = report.bs.find((i: any) => i.concept === 'us-gaap_Assets')?.value;
            const totalLiabilities = report.bs.find((i: any) => i.concept === 'us-gaap_Liabilities')?.value;
            const totalEquity = report.bs.find((i: any) => i.concept === 'us-gaap_StockholdersEquity')?.value;
            if (totalAssets && totalLiabilities && totalEquity) result.balanceSheet.push({ year, totalAssets, totalLiabilities, totalEquity });
            
            // Cash Flow
            const operatingCashFlow = report.cf.find((i: any) => i.concept === 'us-gaap_NetCashProvidedByUsedInOperatingActivities')?.value;
            const investingCashFlow = report.cf.find((i: any) => i.concept === 'us-gaap_NetCashProvidedByUsedInInvestingActivities')?.value;
            const financingCashFlow = report.cf.find((i: any) => i.concept === 'us-gaap_NetCashProvidedByUsedInFinancingActivities')?.value;
            if (operatingCashFlow && investingCashFlow && financingCashFlow) result.cashFlow.push({ year, operatingCashFlow, investingCashFlow, financingCashFlow });
        });

        cacheService.set(cacheKey, result, 24 * 60 * 60 * 1000); // 24 hour cache
        return result;

    } catch (error) {
        console.error(`Failed to fetch financials for ${ticker}:`, error);
        return FallbackData.generateFinancials(ticker);
    }
};

export const getStockMetrics = async (ticker: string, apiMode: ApiMode): Promise<any> => {
     if (apiMode === 'opensource' || !isKeyValid) {
        return { marketCap: 2000e9, peRatio: 25, dividendYield: 1.5, analystRating: 'Buy' };
    }
    try {
        const [profileData, metricsData, ratingData] = await Promise.all([
            finnhubFetch(`/stock/profile2?symbol=${ticker}`),
            finnhubFetch(`/stock/metric?symbol=${ticker}&metric=all`),
            finnhubFetch(`/stock/recommendation?symbol=${ticker}`)
        ]);

        const metrics = metricsData.metric;
        const rating = ratingData[0]; // Finnhub returns an array
        let analystRating = 'Hold';
        if (rating && (rating.strongBuy > rating.strongSell || rating.buy > rating.sell)) {
            analystRating = rating.strongBuy > rating.buy ? 'Strong Buy' : 'Buy';
        }

        return {
            companyName: profileData.name,
            marketCap: metrics.marketCapitalization * 1e6, // Convert millions to absolute
            peRatio: metrics.peNormalizedAnnual,
            dividendYield: metrics.dividendYieldIndicatedAnnual,
            analystRating: analystRating
        };
    } catch (error) {
         console.error(`Failed to fetch stock metrics for ${ticker}:`, error);
         return { marketCap: null, peRatio: null, dividendYield: null, analystRating: 'N/A' };
    }
};

export const getFilings = async (ticker: string, apiMode: ApiMode): Promise<SecFiling[]> => {
    if (apiMode === 'opensource' || !isKeyValid) {
        return FallbackData.getFilings(ticker);
    }
    const cacheKey = `filings_fh_${ticker}`;
    const cached = cacheService.get<SecFiling[]>(cacheKey);
    if (cached) return cached;

    try {
        const data = await finnhubFetch(`/stock/filings?symbol=${ticker}`);
        
        const filings: SecFiling[] = data.slice(0, 10).map((item: any): SecFiling => ({
            accessionNumber: item.accessionNumber,
            filingDate: item.filedDate,
            reportDate: item.acceptedDate, // Finnhub uses acceptedDate
            form: item.form,
            url: item.reportUrl,
            primaryDocument: item.reportUrl,
            primaryDocDescription: `${item.form} filing on ${item.filedDate}`
        }));
        
        cacheService.set(cacheKey, filings, 6 * 60 * 60 * 1000); // Cache for 6 hours
        return filings;
    } catch (error) {
        console.error(`Failed to fetch filings for ${ticker}:`, error);
        return FallbackData.getFilings(ticker);
    }
};