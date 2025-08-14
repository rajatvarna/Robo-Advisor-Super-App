

import * as React from 'react';
import TickerInput from './TickerInput';
import SecFilings from './SecFilings';
import FinancialStatements from './FinancialStatements';
import StockChart from './StockChart';
import EarningsTranscripts from './EarningsTranscripts';
import Spinner from './icons/Spinner';
import StockAnalysis from './StockAnalysis';
import StarIcon from './icons/StarIcon';
import StarSolidIcon from './icons/StarSolidIcon';
import { getFilings } from '../services/secDataService';
import { generateFinancials, generateTranscripts, generateStockAnalysis } from '../services/geminiService';
import type { SecFiling, FinancialStatementsData, TranscriptsData, StockAnalysisData } from '../types';
import { useApi } from '../contexts/ApiContext';

type DashboardTab = 'overview' | 'financials' | 'filings' | 'transcripts';

interface ResearchPageProps {
  watchlist: string[];
  onToggleWatchlist: (ticker: string) => void;
}

const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 font-medium text-sm rounded-t-lg transition-colors border-b-2 ${
      isActive
        ? 'text-brand-accent border-brand-accent'
        : 'text-brand-text-secondary border-transparent hover:text-brand-text hover:border-gray-600'
    }`}
    aria-current={isActive ? 'page' : undefined}
  >
    {label}
  </button>
);


const ResearchPage: React.FC<ResearchPageProps> = ({ watchlist, onToggleWatchlist }) => {
  const [ticker, setTicker] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const [activeTab, setActiveTab] = React.useState<DashboardTab>('overview');
  const [fetchedTabs, setFetchedTabs] = React.useState<Set<DashboardTab>>(new Set());

  const [filings, setFilings] = React.useState<SecFiling[]>([]);
  const [financials, setFinancials] = React.useState<FinancialStatementsData | null>(null);
  const [transcriptsData, setTranscriptsData] = React.useState<TranscriptsData | null>(null);
  const [analysis, setAnalysis] = React.useState<StockAnalysisData | null>(null);
  
  const { apiMode, setApiMode } = useApi();

  const handleApiError = (err: any) => {
      if (err.message.includes('QUOTA_EXCEEDED')) {
          setApiMode('opensource');
          setError('Live AI quota exceeded. Switched to offline fallback mode for this feature.');
      } else {
          setError(err.message || 'An unexpected error occurred while fetching data.');
      }
      setIsLoading(false);
  };

  const fetchInitialData = async (newTicker: string) => {
    setIsLoading(true);
    setError(null);
    setTicker(newTicker.toUpperCase());
    setActiveTab('overview');

    // Reset all data
    setFetchedTabs(new Set());
    setFilings([]);
    setFinancials(null);
    setTranscriptsData(null);
    setAnalysis(null);
    
    try {
      // Lazily load only the first tab's data
      const analysisResult = await generateStockAnalysis(newTicker, apiMode);
      setAnalysis(analysisResult);
      setFetchedTabs(new Set(['overview']));
    } catch(err) {
      handleApiError(err);
      setTicker(null); // Reset ticker on error
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTabClick = async (tab: DashboardTab) => {
    setActiveTab(tab);
    if (!ticker || fetchedTabs.has(tab)) {
      return; // Already fetched or no ticker
    }

    try {
      let dataFetched = false;
      if (tab === 'financials') {
        setFinancials(null); // Show spinner
        const data = await generateFinancials(ticker, apiMode);
        setFinancials(data);
        dataFetched = true;
      } else if (tab === 'transcripts') {
        setTranscriptsData(null); // Show spinner
        const data = await generateTranscripts(ticker, apiMode);
        setTranscriptsData(data);
        dataFetched = true;
      } else if (tab === 'filings') {
        setFilings([]); // Show spinner
        const data = await getFilings(ticker, apiMode);
        setFilings(data);
        dataFetched = true;
      }
      
      if (dataFetched) {
        setFetchedTabs(prev => new Set(prev).add(tab));
      }
    } catch(err) {
      handleApiError(err);
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return analysis ? <StockAnalysis analysis={analysis} /> : <Spinner/>;
      case 'financials':
        return <FinancialStatements data={financials} />;
      case 'filings':
        // Show spinner for filings if it has been clicked but not yet loaded
        return (fetchedTabs.has('filings') || filings.length > 0) ? <SecFilings filings={filings} /> : <div className="flex items-center justify-center h-64"><Spinner/></div>;
      case 'transcripts':
        return <EarningsTranscripts transcriptsData={transcriptsData} />;
      default:
        return null;
    }
  }
  
  const isWatched = ticker ? watchlist.includes(ticker) : false;

  return (
    <div className="container mx-auto">
      <TickerInput onTickerSubmit={fetchInitialData} isLoading={isLoading} />
      
      {isLoading && !ticker && (
         <div className="flex flex-col items-center justify-center h-96">
            <Spinner />
            <p className="mt-4 text-brand-text-secondary">Fetching financial universe...</p>
        </div>
      )}

      {error && (
        <div className="text-center my-8 text-red-400 p-4 bg-red-900/20 rounded-lg max-w-2xl mx-auto">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {!isLoading && ticker && (
        <div className="mt-8 space-y-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold text-brand-text">Dashboard for {ticker}</h1>
            <button onClick={() => onToggleWatchlist(ticker)} className="p-2 rounded-full hover:bg-brand-secondary transition-colors" title={isWatched ? "Remove from Watchlist" : "Add to Watchlist"}>
                {isWatched ? <StarSolidIcon className="w-6 h-6 text-yellow-400" /> : <StarIcon className="w-6 h-6 text-brand-text-secondary" />}
            </button>
          </div>
          
          <StockChart ticker={ticker} />

          <div className="border-b border-brand-border">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                <TabButton label="Overview" isActive={activeTab === 'overview'} onClick={() => handleTabClick('overview')} />
                <TabButton label="Financials" isActive={activeTab === 'financials'} onClick={() => handleTabClick('financials')} />
                <TabButton label="SEC Filings" isActive={activeTab === 'filings'} onClick={() => handleTabClick('filings')} />
                <TabButton label="Transcripts" isActive={activeTab === 'transcripts'} onClick={() => handleTabClick('transcripts')} />
            </nav>
          </div>

          <div className="mt-4">
            {renderContent()}
          </div>
        </div>
      )}

      {!isLoading && !ticker && !error && (
        <div className="text-center mt-16 text-brand-text-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-brand-text-secondary opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-2xl font-bold text-brand-text mt-4">Stock Analysis Dashboard</h2>
          <p className="text-lg mt-2 max-w-lg mx-auto">Enter a stock ticker (e.g., AAPL, GOOGL) to view its performance chart, financial statements, and recent SEC filings.</p>
        </div>
      )}
    </div>
  );
};

export default ResearchPage;