

import type { Quote, NewsItem, FinancialStatementsData, SecFiling, ScreenerCriteria, ScreenerResult, CryptoData, Dividend, EarningsTranscript, StockMetrics } from '../types';
import * as FallbackData from './fallbackData';
import { cacheService } from './cacheService';
import { FINNHUB_API_KEY, POLYGON_API_KEY } from '../process.env.js';

const FINNHUB_URL = 'https://finnhub.io/api/v1';
const POLYGON_URL = 'https://api.polygon.io';

// FIX: Cast API keys to string to avoid linter warning.
const isFinnhubKeyValid = FINNHUB_API_KEY && (FINNHUB_API_KEY as string) !== 'YOUR_FINNHUB_API_KEY_HERE';
const isPolygonKeyValid = POLYGON_API_KEY && (POLYGON_API_KEY as string) !== 'YOUR_POLYGON_API_KEY_HERE';

const apiFetch = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`API error for ${url}: ${errorData.message || response.statusText}`);
    }
    const data = await response.json();
    if (data.error) {
         throw new Error(`API error: ${data.error}`);
    }
    return data;
};

export const fetchQuotes = async (tickers: string[]): Promise<Record<string, Quote>> => {
    if (!isFinnhubKeyValid) return FallbackData.fetchQuotes(tickers);

    const quotes: Record<string, Quote> = {};
    const uniqueTickers = [...new Set(tickers)];

    await Promise.all(uniqueTickers.map(async (ticker) => {
        try {
            const data = await apiFetch(`${FINNHUB_URL}/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
             if (Object.keys(data).length === 0 || (data.c === 0 && data.pc === 0)) {
                throw new Error('No data returned');
            }
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


export const fetchHistoricalData = async (ticker: string, startDate: string): Promise<{date: string, price: number}[]> => {
    if (!isFinnhubKeyValid) return FallbackData.fetchHistoricalData(ticker, startDate);
    
    try {
        const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
        const endTimestamp = Math.floor(Date.now() / 1000);
        
        const data = await apiFetch(`${FINNHUB_URL}/stock/candle?symbol=${ticker}&resolution=D&from=${startTimestamp}&to=${endTimestamp}&token=${FINNHUB_API_KEY}`);

        if (data.s !== 'ok') return FallbackData.fetchHistoricalData(ticker, startDate);
        
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

export const getCompanyProfile = async (ticker: string): Promise<{ companyName: string; sector: string; }> => {
    if (!isFinnhubKeyValid) return FallbackData.fetchStockDetailsForPortfolio(ticker);

    const cacheKey = `profile_fh_${ticker}`;
    const cached = cacheService.get<{ companyName: string; sector: string; }>(cacheKey);
    if(cached) return cached;

    try {
        const data = await apiFetch(`${FINNHUB_URL}/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
        const profile = { companyName: data.name, sector: data.finnhubIndustry };
        cacheService.set(cacheKey, profile, 24 * 60 * 60 * 1000); // 24 hour cache
        return profile;
    } catch (error) {
        console.error(`Failed to fetch company profile for ${ticker}:`, error);
        return FallbackData.fetchStockDetailsForPortfolio(ticker);
    }
};

export const getCompanyNews = async (ticker: string): Promise<NewsItem[]> => {
    if (!isFinnhubKeyValid) return FallbackData.generatePersonalizedNews([ticker], []);
    
    try {
        const to = new Date().toISOString().split('T')[0];
        const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
        const data = await apiFetch(`${FINNHUB_URL}/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`);
        
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

export const getMarketNews = async (category: 'general' | 'crypto'): Promise<NewsItem[]> => {
    if (!isFinnhubKeyValid) {
        return category === 'crypto' ? FallbackData.getCryptoNews() : FallbackData.getTopBusinessNews();
    }
    try {
        const data = await apiFetch(`${FINNHUB_URL}/news?category=${category}&token=${FINNHUB_API_KEY}`);
        
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

export const getFinancials = async (ticker: string): Promise<FinancialStatementsData> => {
    if (!isFinnhubKeyValid) return FallbackData.generateFinancials(ticker);

    const cacheKey = `financials_fh_${ticker}`;
    const cached = cacheService.get<FinancialStatementsData>(cacheKey);
    if (cached) return cached;

    try {
        const data = await apiFetch(`${FINNHUB_URL}/stock/financials-reported?symbol=${ticker}&freq=annual&token=${FINNHUB_API_KEY}`);
        
        const reports = data.data;
        const result: FinancialStatementsData = {
            incomeStatement: [], balanceSheet: [], cashFlow: [],
            incomeStatementKeys: ['revenue', 'netIncome'],
            balanceSheetKeys: ['totalAssets', 'totalLiabilities', 'totalEquity'],
            cashFlowKeys: ['operatingCashFlow', 'investingCashFlow', 'financingCashFlow'],
        };
        
        reports.slice(0, 10).forEach((report: any) => {
            const year = report.year;
            const revenue = report.ic.find((i: any) => i.concept === 'us-gaap_Revenues' || i.concept === 'us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax')?.value;
            const netIncome = report.ic.find((i: any) => i.concept === 'us-gaap_NetIncomeLoss')?.value;
            if (revenue && netIncome) result.incomeStatement.push({ year, revenue, netIncome });

            const totalAssets = report.bs.find((i: any) => i.concept === 'us-gaap_Assets')?.value;
            const totalLiabilities = report.bs.find((i: any) => i.concept === 'us-gaap_Liabilities')?.value;
            const totalEquity = report.bs.find((i: any) => i.concept === 'us-gaap_StockholdersEquity')?.value;
            if (totalAssets && totalLiabilities && totalEquity) result.balanceSheet.push({ year, totalAssets, totalLiabilities, totalEquity });
            
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

export const getStockMetrics = async (ticker: string): Promise<StockMetrics> => {
     if (!isFinnhubKeyValid) return FallbackData.getStockMetrics(ticker);

    const cacheKey = `metrics_fh_${ticker}`;
    const cached = cacheService.get<StockMetrics>(cacheKey);
    if(cached) return cached;

    try {
        const [profileData, metricsData] = await Promise.all([
            apiFetch(`${FINNHUB_URL}/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`),
            apiFetch(`${FINNHUB_URL}/stock/metric?symbol=${ticker}&metric=all&token=${FINNHUB_API_KEY}`)
        ]);

        const metrics = metricsData.metric;
        const result = {
            ticker: profileData.ticker,
            companyName: profileData.name,
            marketCap: metrics.marketCapitalization * 1e6, // Convert millions to absolute
            peRatio: metrics.peNormalizedAnnual,
            dividendYield: metrics.dividendYieldIndicatedAnnual,
            beta: metrics.beta,
            week52High: metrics['52WeekHigh'],
            week52Low: metrics['52WeekLow'],
        };
        cacheService.set(cacheKey, result);
        return result;
    } catch (error) {
         console.error(`Failed to fetch stock metrics for ${ticker}:`, error);
         // FIX: Use fallback function for stock metrics on error.
         return FallbackData.getStockMetrics(ticker);
    }
};

export const getFilings = async (ticker: string): Promise<SecFiling[]> => {
    if (!isFinnhubKeyValid) return FallbackData.getFilings(ticker);

    const cacheKey = `filings_fh_${ticker}`;
    const cached = cacheService.get<SecFiling[]>(cacheKey);
    if (cached) return cached;

    try {
        const data = await apiFetch(`${FINNHUB_URL}/stock/filings?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
        
        const filings: SecFiling[] = data.slice(0, 10).map((item: any): SecFiling => ({
            accessionNumber: item.accessionNumber,
            filingDate: item.filedDate,
            reportDate: item.acceptedDate,
            form: item.form,
            url: item.reportUrl,
            primaryDocument: item.reportUrl,
            primaryDocDescription: `${item.form} filing on ${item.filedDate}`
        }));
        
        cacheService.set(cacheKey, filings, 6 * 60 * 60 * 1000);
        return filings;
    } catch (error) {
        console.error(`Failed to fetch filings for ${ticker}:`, error);
        return FallbackData.getFilings(ticker);
    }
};

export const getEarningsTranscripts = async (ticker: string): Promise<EarningsTranscript[]> => {
    if (!isFinnhubKeyValid) return FallbackData.getEarningsTranscripts(ticker);
    
    const cacheKey = `transcripts_fh_${ticker}`;
    const cached = cacheService.get<EarningsTranscript[]>(cacheKey);
    if(cached) return cached;
    
    try {
        const data = await apiFetch(`${FINNHUB_URL}/stock/earnings-call-transcripts?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
        const transcripts: EarningsTranscript[] = data.transcripts.slice(0, 4).map((item: any) => ({
            quarter: item.quarter,
            year: item.year,
            date: item.time.split(' ')[0],
            url: item.url,
        }));
        cacheService.set(cacheKey, transcripts, 24 * 60 * 60 * 1000);
        return transcripts;
    } catch(err) {
        console.error(`Failed to get transcripts for ${ticker}:`, err);
        // FIX: Use fallback function for earnings transcripts on error.
        return FallbackData.getEarningsTranscripts(ticker);
    }
};

// --- POLYGON.IO FUNCTIONS ---

export const screenStocks = async (criteria: ScreenerCriteria): Promise<ScreenerResult[]> => {
    if (!isPolygonKeyValid) return FallbackData.screenStocks(criteria);
    
    // Polygon screener is a premium feature. This will likely fail with a free key.
    // For the purpose of this exercise, we will use the fallback.
    // A real implementation would check user subscription level.
    console.warn("Polygon.io Stock Screener is a premium feature and may not work with a free API key. Using fallback data.");
    return FallbackData.screenStocks(criteria);
};

export const getDividends = async (ticker: string): Promise<Omit<Dividend, 'companyName'|'totalAmount'>[]> => {
    if (!isPolygonKeyValid) return [];

    const cacheKey = `dividends_poly_${ticker}`;
    const cached = cacheService.get<Omit<Dividend, 'companyName'|'totalAmount'>[]>(cacheKey);
    if (cached) return cached;

    try {
        const data = await apiFetch(`${POLYGON_URL}/v3/reference/dividends?ticker=${ticker}&apiKey=${POLYGON_API_KEY}`);
        const dividends = data.results.map((div: any) => ({
            ticker: div.ticker,
            amountPerShare: div.cash_amount,
            payDate: div.pay_date,
            exDividendDate: div.ex_dividend_date
        }));
        cacheService.set(cacheKey, dividends, 24 * 60 * 60 * 1000);
        return dividends;
    } catch (error) {
        console.error(`Failed to get dividends for ${ticker}:`, error);
        return [];
    }
};

export const getTopCryptos = async(): Promise<CryptoData[]> => {
    if (!isPolygonKeyValid) return FallbackData.getTopCryptos();

    const cacheKey = 'top_cryptos_poly';
    const cached = cacheService.get<CryptoData[]>(cacheKey);
    if(cached) return cached;
    try {
        // This endpoint gives a snapshot of all tickers. We'll sort and slice client-side.
        const data = await apiFetch(`${POLYGON_URL}/v2/snapshot/locale/global/markets/crypto/tickers?apiKey=${POLYGON_API_KEY}`);
        
        const cryptos: CryptoData[] = data.tickers
            .filter((c: any) => c.marketCap && c.ticker.endsWith('USD')) // Filter for pairs with USD and market cap data
            .sort((a: any, b: any) => b.marketCap - a.marketCap)
            .slice(0, 25)
            .map((c: any) => ({
                name: c.ticker.replace('X:', '').replace('USD', ''),
                symbol: c.ticker.replace('X:', '').replace('USD', ''),
                price: c.lastTrade.p,
                change24h: c.todaysChangePerc,
                marketCap: c.marketCap
            }));
        
        cacheService.set(cacheKey, cryptos, 15 * 60 * 1000); // 15 min cache
        return cryptos;
    } catch(err) {
        console.error('Failed to fetch top cryptos:', err);
        return FallbackData.getTopCryptos();
    }
}