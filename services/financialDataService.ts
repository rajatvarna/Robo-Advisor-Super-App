
import type { ApiMode, Quote, PortfolioHistoryPoint } from '../types';
import * as FallbackData from './fallbackData';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

const checkIsFinnhubError = (error: any): boolean => {
    const messageToSearch = (error?.message || JSON.stringify(error)).toLowerCase();
    return messageToSearch.includes('finnhub');
};

const handleApiError = (error: any, context: string): Error => {
    console.error(`Error in ${context}:`, error);
    if (checkIsFinnhubError(error)) {
        return new Error(`The Financial Data API call failed for ${context}. Please verify that the FINNHUB_API_KEY is configured correctly.`);
    }
    return new Error(`An unknown error occurred while fetching ${context}.`);
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
        if (data.s !== 'ok') {
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
