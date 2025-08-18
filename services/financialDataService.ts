

import type { ApiMode, Quote, NewsItem, SecFiling, FinancialStatementsData } from '../types';
import * as FallbackData from './fallbackData';
import { cacheService } from './cacheService';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

const handleApiError = (error: any, context: string): Error => {
    console.error(`Error fetching from Finnhub for ${context}:`, error);
    return new Error(`The Financial Data API call failed for ${context}. Please verify that the FINNHUB_API_KEY is configured correctly.`);
};

export const fetchQuotes = async (tickers: string[], apiMode: ApiMode): Promise<Record<string, Quote>> => {
    if (apiMode === 'opensource') {
        return FallbackData.fetchQuotes(tickers);
    }
    if (!FINNHUB_API_KEY) {
        console.warn("FINNHUB_API_KEY not set. Using fallback data for quotes.");
        return FallbackData.fetchQuotes(tickers);
    }

    const quotes: Record<string, Quote> = {};
    const uniqueTickers = [...new Set(tickers)];

    await Promise.all(uniqueTickers.map(async (ticker) => {
        try {
            const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
            if (!response.ok) {
                console.error(`Finnhub API error for ${ticker}: ${response.statusText}`);
                quotes[ticker] = FallbackData.getFallbackQuote(ticker);
                return;
            }
            const data = await response.json();
            if (data.c === 0 && data.pc === 0) { // Finnhub returns 0 for invalid tickers
                console.warn(`Invalid ticker or no data for ${ticker}, using fallback.`);
                quotes[ticker] = FallbackData.getFallbackQuote(ticker);
                return;
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


export const fetchHistoricalData = async (ticker: string, startDate: string, apiMode: ApiMode): Promise<{date: string, price: number}[]> => {
    if (apiMode === 'opensource') {
        return FallbackData.fetchHistoricalData(ticker, startDate);
    }
     if (!FINNHUB_API_KEY) {
        console.warn("FINNHUB_API_KEY not set. Using fallback data for historical prices.");
        return FallbackData.fetchHistoricalData(ticker, startDate);
    }
    
    const from = Math.floor(new Date(startDate).getTime() / 1000);
    const to = Math.floor(Date.now() / 1000);

    try {
        const response = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`);
        if (!response.ok) {
            throw new Error(`Finnhub API error for ${ticker} history: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.s !== 'ok' || !data.t) {
            console.warn(`No historical data from Finnhub for ${ticker}, using fallback.`);
            return FallbackData.fetchHistoricalData(ticker, startDate);
        }
        
        return data.t.map((timestamp: number, index: number) => ({
            date: new Date(timestamp * 1000).toISOString().split('T')[0],
            price: data.c[index],
        }));

    } catch (error) {
        console.error(`Failed to fetch historical data for ${ticker}:`, error);
        return FallbackData.fetchHistoricalData(ticker, startDate);
    }
}

export const getCompanyProfile = async (ticker: string, apiMode: ApiMode): Promise<{ companyName: string; sector: string; }> => {
    if (apiMode === 'opensource' || !FINNHUB_API_KEY) {
        return FallbackData.fetchStockDetailsForPortfolio(ticker);
    }
    const cacheKey = `profile_${ticker}`;
    const cached = cacheService.get<{ companyName: string; sector: string; }>(cacheKey);
    if(cached) return cached;

    try {
        const response = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
        if(!response.ok) throw new Error(`Finnhub profile error: ${response.statusText}`);
        const data = await response.json();
        if(!data.name) return FallbackData.fetchStockDetailsForPortfolio(ticker);

        const profile = { companyName: data.name, sector: data.finnhubIndustry };
        cacheService.set(cacheKey, profile, 24 * 60 * 60 * 1000); // 24 hour cache
        return profile;
    } catch (error) {
        console.error(`Failed to fetch company profile for ${ticker}:`, error);
        return FallbackData.fetchStockDetailsForPortfolio(ticker);
    }
};

export const getCompanyNews = async (ticker: string, apiMode: ApiMode): Promise<NewsItem[]> => {
    if (apiMode === 'opensource' || !FINNHUB_API_KEY) {
        return FallbackData.generatePersonalizedNews([ticker], []);
    }
    
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const from = oneWeekAgo.toISOString().split('T')[0];
    const to = today.toISOString().split('T')[0];

    try {
        const response = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`);
        if(!response.ok) throw new Error(`Finnhub company news error: ${response.statusText}`);
        const data = await response.json();
        
        return data.slice(0, 5).map((item: any): NewsItem => ({
            headline: item.headline,
            url: item.url,
            source: item.source,
            summary: item.summary,
            publishedAt: new Date(item.datetime * 1000).toISOString(),
            ticker: item.related,
        }));
    } catch (error) {
        console.error(`Failed to fetch company news for ${ticker}:`, error);
        return FallbackData.generatePersonalizedNews([ticker], []);
    }
};

export const getMarketNews = async (category: 'general' | 'crypto', apiMode: ApiMode): Promise<NewsItem[]> => {
    if (apiMode === 'opensource' || !FINNHUB_API_KEY) {
        return category === 'crypto' ? FallbackData.getCryptoNews() : FallbackData.getTopBusinessNews();
    }
    try {
        const response = await fetch(`https://finnhub.io/api/v1/news?category=${category}&token=${FINNHUB_API_KEY}`);
        if(!response.ok) throw new Error(`Finnhub market news error: ${response.statusText}`);
        const data = await response.json();
        return data.slice(0, 20).map((item: any): NewsItem => ({
            headline: item.headline,
            url: item.url,
            source: item.source,
            summary: item.summary,
            publishedAt: new Date(item.datetime * 1000).toISOString(),
            ticker: item.related,
        }));
    } catch(error) {
        console.error(`Failed to fetch market news for ${category}:`, error);
        return category === 'crypto' ? FallbackData.getCryptoNews() : FallbackData.getTopBusinessNews();
    }
};

export const getFilings = async (ticker: string, apiMode: ApiMode): Promise<SecFiling[]> => {
  if (apiMode === 'opensource' || !FINNHUB_API_KEY) {
      return FallbackData.getFilings(ticker);
  }
  const cacheKey = `filings_finnhub_${ticker}`;
  const cached = cacheService.get<SecFiling[]>(cacheKey);
  if (cached) return cached;
  try {
      const response = await fetch(`https://finnhub.io/api/v1/stock/filings?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
      if (!response.ok) throw new Error(`Finnhub filings error: ${response.statusText}`);
      const data = await response.json();
      const filings = data.slice(0, 10).map((f: any): SecFiling => ({
          accessionNumber: f.accessNumber,
          filingDate: f.filedDate.split(' ')[0],
          reportDate: f.acceptedDate.split(' ')[0],
          form: f.form,
          url: f.reportUrl,
          primaryDocument: f.reportUrl,
          primaryDocDescription: `${f.form} filing from ${f.filedDate}`
      }));
      cacheService.set(cacheKey, filings, 6 * 60 * 60 * 1000); // 6 hour cache
      return filings;
  } catch(error) {
      console.error(`Failed to fetch filings for ${ticker}:`, error);
      return FallbackData.getFilings(ticker);
  }
};

export const getFinancials = async (ticker: string, apiMode: ApiMode): Promise<FinancialStatementsData> => {
    if (apiMode === 'opensource' || !FINNHUB_API_KEY) {
        return FallbackData.generateFinancials(ticker);
    }
    const cacheKey = `financials_finnhub_${ticker}`;
    const cached = cacheService.get<FinancialStatementsData>(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(`https://finnhub.io/api/v1/stock/financials-reported?symbol=${ticker}&freq=annual&token=${FINNHUB_API_KEY}`);
        if (!response.ok) throw new Error(`Finnhub financials error: ${response.statusText}`);
        const rawData = await response.json();
        
        const data = rawData.data;

        const incomeStatement = data.map((item: any) => ({
            year: item.year,
            revenue: item.report.ic?.find((r:any) => r.concept === 'Revenues')?.value || 0,
            netIncome: item.report.ic?.find((r:any) => r.concept === 'NetIncomeLoss')?.value || 0,
        })).slice(0,10);
        
        const balanceSheet = data.map((item: any) => ({
            year: item.year,
            totalAssets: item.report.bs?.find((r:any) => r.concept === 'Assets')?.value || 0,
            totalLiabilities: item.report.bs?.find((r:any) => r.concept === 'Liabilities')?.value || 0,
            totalEquity: item.report.bs?.find((r:any) => r.concept === 'StockholdersEquity')?.value || 0,
        })).slice(0,10);
        
        const cashFlow = data.map((item: any) => ({
            year: item.year,
            operatingCashFlow: item.report.cf?.find((r:any) => r.concept === 'NetCashProvidedByUsedInOperatingActivities')?.value || 0,
            investingCashFlow: item.report.cf?.find((r:any) => r.concept === 'NetCashProvidedByUsedInInvestingActivities')?.value || 0,
            financingCashFlow: item.report.cf?.find((r:any) => r.concept === 'NetCashProvidedByUsedInFinancingActivities')?.value || 0,
        })).slice(0,10);

        const result: FinancialStatementsData = {
            incomeStatement, balanceSheet, cashFlow,
            incomeStatementKeys: ['revenue', 'netIncome'],
            balanceSheetKeys: ['totalAssets', 'totalLiabilities', 'totalEquity'],
            cashFlowKeys: ['operatingCashFlow', 'investingCashFlow', 'financingCashFlow'],
        };

        cacheService.set(cacheKey, result, 24 * 60 * 60 * 1000); // 24 hour cache
        return result;

    } catch (error) {
        console.error(`Failed to fetch financials for ${ticker}:`, error);
        return FallbackData.generateFinancials(ticker);
    }
};