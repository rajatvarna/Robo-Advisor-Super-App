

import { GoogleGenAI, Type } from "@google/genai";
import type { SecFiling, ApiMode } from '../types';
import * as FallbackData from './fallbackData';

// The API Key is expected to be available in the environment.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set. The application cannot start.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const checkIsQuotaError = (error: any): boolean => {
    if(error instanceof Error) {
        return error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED');
    }
    return false;
}

const handleApiError = (error: any, context: string): Error => {
    console.error(`Error in ${context}:`, error);
    if (checkIsQuotaError(error)) {
        return new Error("QUOTA_EXCEEDED");
    }
    if (error instanceof Error) {
        if (error.message.includes('API key') || error.message.includes('400') || error.message.includes('403'))) {
            return new Error(`The AI call failed for ${context}. Please verify that the API_KEY is configured correctly.`);
        }
        return new Error(`The AI failed to generate ${context}. Reason: ${error.message}`);
    }
    return new Error(`An unknown error occurred while generating ${context}.`);
};


/**
 * Generates a list of plausible SEC filings for a given stock ticker using the Gemini API.
 * This replaces the direct fetch to the SEC API to avoid CORS issues.
 * @param ticker The stock ticker symbol.
 * @returns A promise that resolves to an array of SecFiling objects.
 */
export async function getFilings(ticker: string, apiMode: ApiMode): Promise<SecFiling[]> {
  if (apiMode === 'opensource') {
      return FallbackData.getFilings(ticker);
  }
  const prompt = `
    Act as a financial data provider. Generate a list of 10 recent and plausible SEC filings for the stock ticker "${ticker.toUpperCase()}".
    Include a mix of common forms like 10-K (annual report), 10-Q (quarterly report), and 8-K (current event report).
    Ensure the dates are recent (within the last 2-3 years) and chronologically plausible.
    For each filing, provide a realistic accession number, filing date, report date, form type, a primary document filename, and a brief document description.
    All dates must be in 'YYYY-MM-DD' format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: FallbackData.filingsSchema,
      },
    });

    const jsonText = response.text.trim();
    const generatedFilings = JSON.parse(jsonText);

    if (!Array.isArray(generatedFilings)) {
        console.error("AI did not return an array for filings", generatedFilings);
        return [];
    }
    
    // The link can't point to a specific generated document.
    // Instead, we link to the company's search results page on EDGAR as a useful fallback.
    const edgarSearchUrl = `https://www.sec.gov/edgar/searchedgar/companysearch?q=${ticker.toUpperCase()}`;

    const filings = generatedFilings.map((filing: any): SecFiling => ({
      accessionNumber: filing.accessionNumber,
      filingDate: filing.filingDate,
      reportDate: filing.reportDate,
      form: filing.form,
      primaryDocument: filing.primaryDocument,
      primaryDocDescription: filing.primaryDocDescription,
      url: edgarSearchUrl, // All links for this ticker go to the same search page.
    }));

    // Sort by most recent filing date descending
    return filings.sort((a, b) => new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime());

  } catch (error) {
    throw handleApiError(error, `SEC filings for ${ticker}`);
  }
}