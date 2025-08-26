

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
import StockComparison from './StockComparison';
import XCircleIcon from './icons/XCircleIcon';
import AddToWatchlistModal from './AddToWatchlistModal';
import { getFilings } from '../services/secDataService';
import { generateFinancials, generateTranscripts, generateStockAnalysis, generateStockComparison } from '../services/geminiService';
import type { SecFiling, FinancialStatementsData, TranscriptsData, StockAnalysisData, StockComparisonData, UserWatchlist } from '../types';
import { useApi } from '../contexts/ApiContext';

type DashboardTab = 'overview' | 'financials' | 'filings' | 'transcripts';

interface ResearchPageProps {
  watchlists: UserWatchlist[];
  onUpdateWatchlistTickers: (id: string, tickers: string[]) => void;
  onAddWatchlist: (name: string) => void;
}

const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors border-b-2 ${
      isActive
        ? 'text-brand-accent border-brand-accent bg-brand-secondary'
        : 'text-brand-text-secondary border-transparent hover:text-brand-text hover:border-brand-text-secondary/50'
    }`}
    aria-current={isActive ? 'page' : undefined}
  >
    {label}
  </button>
);


const ResearchPage: React.FC<ResearchPageProps> = ({ watchlists, onUpdateWatchlistTickers, onAddWatchlist }) => {
  const [ticker, setTicker] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const [activeTab, setActiveTab] = React.useState<DashboardTab>('overview');
  
  const [filings, setFilings] = React.useState<SecFiling[] | null>(null);
  const [financials, setFinancials] = React.useState<FinancialStatementsData | null>(null);
  const [transcriptsData, setTranscriptsData] = React.useState<TranscriptsData | null>(null);
  const [analysis, setAnalysis] = React.useState<StockAnalysisData | null>(null);
  
  const [comparisonTickers, setComparisonTickers] = React.useState<string[]>([]);
  const [comparisonData, setComparisonData] = React.useState<StockComparisonData | null>(null);
  const [isComparing, setIsComparing] = React.useState<boolean>(false);
  const [comparisonError, setComparisonError] = React.useState<string | null>(null);
  const [comparisonInput, setComparisonInput] = React.useState('');
  
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = React.useState(false);

  const { apiMode, setApiMode } = useApi();

  const handleApiError = (err: any, context?: string) => {
      const errorMessage = err.message || `An unexpected error occurred while fetching ${context || 'data'}.`;
      if (err.message.includes('QUOTA_EXCEEDED')) {
          setApiMode('opensource');
          setError('Live AI quota exceeded. Switched to offline fallback mode for this feature.');
      } else {
          setError(errorMessage);
      }
      if (context === 'initial') {
          setIsLoading(false);
      }
  };

  const handleTickerSubmit = (newTicker: string) => {
    setIsLoading(true);
    setError(null);
    setTicker(newTicker.toUpperCase());
    setActiveTab('overview');
    setAnalysis(null);
    setFinancials(null);
    setFilings(null);
    setTranscriptsData(null);
  };

  React.useEffect(() => {
    if (!ticker) return;
    const fetchInitialData = async () => {
      try {
        setAnalysis(await generateStockAnalysis(ticker, apiMode));
      } catch (err) {
        handleApiError(err, 'initial');
        setTicker(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [ticker, apiMode]);

  React.useEffect(() => {
    if (!ticker) return;
    const fetchDataForTab = async () => {
        try {
            switch(activeTab) {
                case 'financials': if (!financials) setFinancials(await generateFinancials(ticker, apiMode)); break;
                case 'filings': if (!filings) setFilings(await getFilings(ticker, apiMode)); break;
                case 'transcripts': if (!transcriptsData) setTranscriptsData(await generateTranscripts(ticker, apiMode)); break;
            }
        } catch (err) { handleApiError(err, `data for ${activeTab} tab`); }
    };
    fetchDataForTab();
  }, [activeTab, ticker, apiMode, financials, filings, transcriptsData]);

  const renderContent = () => {
    switch(activeTab) {
      case 'overview': return <StockAnalysis analysis={analysis} />;
      case 'financials': return <FinancialStatements data={financials} />;
      case 'filings': return <SecFilings filings={filings} />;
      case 'transcripts': return <EarningsTranscripts transcriptsData={transcriptsData} />;
      default: return <div className="flex items-center justify-center h-64"><Spinner/></div>;
    }
  }
  
  const isWatched = ticker ? watchlists.some(wl => wl.tickers.includes(ticker)) : false;

  const handleAddComparisonTicker = (e: React.FormEvent) => {
    e.preventDefault();
    const tickerToAdd = comparisonInput.trim().toUpperCase();
    if (tickerToAdd && !comparisonTickers.includes(tickerToAdd) && comparisonTickers.length < 5) {
        setComparisonTickers([...comparisonTickers, tickerToAdd]);
        setComparisonInput('');
    }
  };

  const handleRemoveComparisonTicker = (tickerToRemove: string) => {
      setComparisonTickers(comparisonTickers.filter(t => t !== tickerToRemove));
  };

  const handleRunComparison = async () => {
      if (comparisonTickers.length < 2) return;
      setIsComparing(true);
      setComparisonError(null);
      setComparisonData(null);
      try {
          const data = await generateStockComparison(comparisonTickers, apiMode);
          setComparisonData(data);
      } catch (err: any) {
          if (err.message.includes('QUOTA_EXCEEDED')) {
              setApiMode('opensource');
              setComparisonError('Live AI quota exceeded. Switched to offline fallback mode for this feature.');
          } else {
              setComparisonError(err.message || 'An unexpected error occurred while fetching comparison data.');
          }
      } finally {
          setIsComparing(false);
      }
  };

  return (
    <div className="container mx-auto">
      <TickerInput onTickerSubmit={handleTickerSubmit} isLoading={isLoading} />
      
      {isLoading && <div className="flex flex-col items-center justify-center h-96"><Spinner /><p className="mt-4 text-brand-text-secondary">Fetching financial universe for {ticker}...</p></div>}
      
      {error && (
            <div className="text-center my-8 text-red-400 p-4 bg-red-900/20 rounded-lg max-w-2xl mx-auto">
                <p className="font-bold">An Error Occurred</p>
                <p className="mb-4">{error}</p>
                {ticker && (
                    <button
                        onClick={() => handleTickerSubmit(ticker)}
                        className="px-6 py-2 rounded-md bg-brand-accent text-white hover:bg-brand-accent-hover transition-colors"
                    >
                        Try Again
                    </button>
                )}
            </div>
        )}


      {!isLoading && ticker && (
        <div className="mt-8 space-y-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold text-brand-text">Dashboard for {ticker}</h1>
            <button onClick={() => setIsWatchlistModalOpen(true)} className="p-2 rounded-full hover:bg-brand-secondary transition-colors" title={isWatched ? "Edit Watchlists" : "Add to Watchlist"}>
                {isWatched ? <StarSolidIcon className="w-6 h-6 text-yellow-400" /> : <StarIcon className="w-6 h-6 text-brand-text-secondary" />}
            </button>
          </div>
          
          <StockChart ticker={ticker} />

          <div className="border-b border-brand-border"><nav className="-mb-px flex space-x-4" aria-label="Tabs">
              <TabButton label="Overview" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
              <TabButton label="Financials" isActive={activeTab === 'financials'} onClick={() => setActiveTab('financials')} />
              <TabButton label="SEC Filings" isActive={activeTab === 'filings'} onClick={() => setActiveTab('filings')} />
              <TabButton label="Transcripts" isActive={activeTab === 'transcripts'} onClick={() => setActiveTab('transcripts')} />
          </nav></div>

          <div className="mt-4 min-h-[300px]">{renderContent()}</div>
        </div>
      )}

      {!ticker && !isLoading && !error && (
        <div className="text-center mt-16 text-brand-text-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-brand-text-secondary opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-2xl font-bold text-brand-text mt-4">Stock Analysis Dashboard</h2>
          <p className="text-lg mt-2 max-w-lg mx-auto">Enter a stock ticker (e.g., AAPL, GOOGL) to view its performance chart, financial statements, and recent SEC filings.</p>
        </div>
      )}

      <div className="mt-12 pt-8 border-t border-brand-border">
          <h2 className="text-2xl font-bold text-brand-text">Compare Stocks</h2>
          <p className="mt-1 text-brand-text-secondary">Add up to 5 tickers to generate a side-by-side analysis powered by AI.</p>
          <div className="mt-4 bg-brand-secondary p-4 rounded-lg border border-brand-border">
              <form onSubmit={handleAddComparisonTicker} className="flex items-center gap-2">
                  <input type="text" value={comparisonInput} onChange={(e) => setComparisonInput(e.target.value)} placeholder="Enter Ticker to Add" className="w-full p-2 bg-brand-primary border border-brand-border rounded-lg text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition" disabled={isComparing || comparisonTickers.length >= 5} />
                  <button type="submit" disabled={isComparing || comparisonTickers.length >= 5 || !comparisonInput.trim()} className="px-4 py-2 font-semibold rounded-lg bg-brand-primary border border-brand-border text-brand-text-secondary hover:bg-brand-border transition-colors disabled:opacity-50">Add</button>
              </form>
              <div className="flex flex-wrap gap-2 mt-4 min-h-[36px]">
                  {comparisonTickers.map(t => (
                      <div key={t} className="flex items-center gap-2 bg-brand-accent/20 text-brand-accent font-semibold px-3 py-1 rounded-full text-sm animate-fade-in">
                          <span>{t}</span>
                          <button onClick={() => handleRemoveComparisonTicker(t)} disabled={isComparing}><XCircleIcon className="w-4 h-4 text-brand-accent/70 hover:text-brand-accent" /></button>
                      </div>
                  ))}
              </div>
              {comparisonTickers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-brand-border flex justify-end">
                      <button onClick={handleRunComparison} disabled={isComparing || comparisonTickers.length < 2} className="px-6 py-2 rounded-md text-sm font-semibold bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors disabled:bg-brand-accent/50 flex items-center gap-2">
                          {isComparing && <Spinner />}
                          Compare {comparisonTickers.length > 1 ? `${comparisonTickers.length} Stocks` : ''}
                      </button>
                  </div>
              )}
          </div>
          <StockComparison data={comparisonData} isLoading={isComparing} error={comparisonError} />
      </div>
      {isWatchlistModalOpen && ticker && (
        <AddToWatchlistModal
          ticker={ticker}
          watchlists={watchlists}
          onClose={() => setIsWatchlistModalOpen(false)}
          onUpdateWatchlistTickers={onUpdateWatchlistTickers}
          onAddWatchlist={onAddWatchlist}
        />
      )}
    </div>
  );
};

export default ResearchPage;