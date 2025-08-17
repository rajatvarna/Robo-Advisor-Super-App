
import { GoogleGenAI, Type } from "@google/genai";
import type { SecFiling, ApiMode } from '../types';
import * as FallbackData from './fallbackData';
import { cacheService } from './cacheService';

// The API Key is expected to be available in the environment.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set. The application cannot start.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const checkIsQuotaError = (error: any): boolean => {
    // The error from the SDK can be an Error object with the server's JSON response in the `message` field.
    // We create a string to search for by prioritizing the message property.
    const messageToSearch = (error?.message || JSON.stringify(error)).toLowerCase();
    
    // Check for the specific status field from the API error structure.
    if (messageToSearch.includes('"status":"resource_exhausted"')) {
        return true;
    }

    // Fallback for other quota-related messages.
    return messageToSearch.includes('429') || messageToSearch.includes('quota');
};

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

const parseJsonFromText = (text: string, context: string): any => {
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/^```json\s*|```\s*$/g, '');
    try {
        return JSON.parse(cleanedText);
    } catch (e1) {
        const match = cleanedText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
        if (match && match[0]) {
            try {
                return JSON.parse(match[0]);
            } catch (e2) {
                console.error(`Failed to parse extracted JSON for ${context}. Raw text:`, text);
                throw new Error(`The AI returned invalid JSON for ${context}.`);
            }
        }
        console.error(`Failed to parse any JSON for ${context}. Raw text:`, text);
        throw new Error(`The AI returned a non-JSON response for ${context}.`);
    }
};

/**
 * Fetches a list of recent SEC filings for a given stock ticker using the Gemini API with Google Search grounding.
 * @param ticker The stock ticker symbol.
 * @returns A promise that resolves to an array of SecFiling objects.
 */
export async function getFilings(ticker: string, apiMode: ApiMode): Promise<SecFiling[]> {
  const cacheKey = `filings_${ticker}`;
  const cachedData = cacheService.get<SecFiling[]>(cacheKey);
  if (cachedData) return cachedData;
  
  if (apiMode === 'opensource') {
      const data = FallbackData.getFilings(ticker);
      cacheService.set(cacheKey, data);
      return data;
  }
  const prompt = `
    Act as a financial data API. Use Google Search to find a list of the 10 most recent SEC filings for the stock ticker "${ticker.toUpperCase()}".
    For each filing, provide the accession number, filing date (in 'YYYY-MM-DD' format), report date (in 'YYYY-MM-DD' format), form type (e.g., "10-K", "8-K"), a primary document filename, and a brief document description.
    Respond with ONLY a valid JSON array of objects and nothing else.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    const generatedFilings = parseJsonFromText(response.text, `SEC filings for ${ticker}`);

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
    const sortedFilings = filings.sort((a, b) => new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime());
    cacheService.set(cacheKey, sortedFilings);
    return sortedFilings;

  } catch (error) {
    throw handleApiError(error, `SEC filings for ${ticker}`);
  }
}