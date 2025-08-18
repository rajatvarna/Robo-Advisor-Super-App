

import { GoogleGenAI, Type } from "@google/genai";
import type { SecFiling, ApiMode } from '../types';
import * as FallbackData from './fallbackData';
import { cacheService } from './cacheService';
import * as financialDataService from './financialDataService';

/**
 * Fetches a list of recent SEC filings for a given stock ticker using the Finnhub API.
 * @param ticker The stock ticker symbol.
 * @param apiMode The current API mode.
 * @returns A promise that resolves to an array of SecFiling objects.
 */
export async function getFilings(ticker: string, apiMode: ApiMode): Promise<SecFiling[]> {
  const cacheKey = `filings_finnhub_${ticker}`;
  const cachedData = cacheService.get<SecFiling[]>(cacheKey);
  if (cachedData) return cachedData;
  
  if (apiMode === 'opensource') {
      const data = FallbackData.getFilings(ticker);
      cacheService.set(cacheKey, data, 6 * 60 * 60 * 1000);
      return data;
  }
 
  try {
    const filings = await financialDataService.getFilings(ticker, apiMode);
    
    // Sort by most recent filing date descending
    const sortedFilings = filings.sort((a, b) => new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime());
    cacheService.set(cacheKey, sortedFilings, 6 * 60 * 60 * 1000); // Cache for 6 hours
    return sortedFilings;

  } catch (error) {
     console.error(`Error fetching filings via financialDataService for ${ticker}:`, error);
     return FallbackData.getFilings(ticker);
  }
}
