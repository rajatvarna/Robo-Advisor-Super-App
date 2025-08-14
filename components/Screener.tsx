

import * as React from 'react';
import { screenStocks } from '../services/geminiService';
import type { ScreenerCriteria, ScreenerResult } from '../types';
import Spinner from './icons/Spinner';
import { useApi } from '../contexts/ApiContext';

const SECTORS = [
  'Technology', 'Healthcare', 'Financial Services', 'Consumer Cyclical', 
  'Industrials', 'Consumer Defensive', 'Energy', 'Real Estate', 
  'Utilities', 'Communication Services', 'Basic Materials'
];

const ANALYST_RATINGS = ['Any', 'Hold', 'Buy', 'Strong Buy'];
const RESULTS_PER_PAGE = 15;

const INITIAL_CRITERIA: ScreenerCriteria = {
  marketCapMin: 0,
  marketCapMax: Infinity,
  peRatioMin: 0,
  peRatioMax: Infinity,
  dividendYieldMin: 0,
  dividendYieldMax: Infinity,
  sectors: [],
  analystRating: 'Any',
};

interface ScreenerProps {
    onRunScreener: () => void;
}

const formatMarketCap = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}T`;
    return `$${value}B`;
}

type SortKey = keyof ScreenerResult;
type SortDirection = 'ascending' | 'descending';

const SortableHeader: React.FC<{
    label: string;
    sortKey: SortKey;
    sortConfig: { key: SortKey; direction: SortDirection } | null;
    onClick: (key: SortKey) => void;
    className?: string;
}> = ({ label, sortKey, sortConfig, onClick, className }) => {
    const isSorting = sortConfig?.key === sortKey;
    const directionIcon = isSorting ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '';
    
    return (
        <th className={`py-3 px-4 cursor-pointer hover:bg-brand-primary ${className}`} onClick={() => onClick(sortKey)}>
            <div className="flex items-center gap-1">
                <span>{label}</span>
                <span className="text-brand-accent w-2">{directionIcon}</span>
            </div>
        </th>
    );
};

const Screener: React.FC<ScreenerProps> = ({ onRunScreener }) => {
    const [criteria, setCriteria] = React.useState<ScreenerCriteria>(INITIAL_CRITERIA);
    const [results, setResults] = React.useState<ScreenerResult[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [hasSearched, setHasSearched] = React.useState(false);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'marketCap', direction: 'descending' });
    const { apiMode, setApiMode } = useApi();

    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericValue = value === '' && name.includes('Max') ? Infinity : parseFloat(value);
        setCriteria(prev => ({ ...prev, [name]: isNaN(numericValue) ? (name.includes('Max') ? Infinity : 0) : numericValue }));
    };

    const handleSectorToggle = (sector: string) => {
        setCriteria(prev => {
            const newSectors = prev.sectors.includes(sector)
                ? prev.sectors.filter(s => s !== sector)
                : [...prev.sectors, sector];
            return { ...prev, sectors: newSectors };
        });
    };

    const handleRunScreener = async () => {
        setIsLoading(true);
        setError(null);
        setHasSearched(true);
        setCurrentPage(1);
        setSortConfig({ key: 'marketCap', direction: 'descending' }); 
        setResults([]);
        onRunScreener();
        try {
            const data = await screenStocks(criteria, apiMode);
            setResults(data);
        } catch (err: any) {
            if (err.message.includes('QUOTA_EXCEEDED')) {
                setApiMode('opensource');
                setError("Live AI quota exceeded. Switched to offline fallback mode for this feature.");
            } else {
                setError(err.message || 'An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const sortedResults = React.useMemo(() => {
        let sortableItems = [...results];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                     return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
                }
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                     return sortConfig.direction === 'ascending' 
                        ? aValue.localeCompare(bValue) 
                        : bValue.localeCompare(aValue);
                }
                return 0;
            });
        }
        return sortableItems;
    }, [results, sortConfig]);

    const renderResults = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-64">
                    <Spinner />
                    <p className="mt-4 text-brand-text-secondary">AI is screening thousands of stocks for you...</p>
                </div>
            );
        }

        if (error) {
            return <div className="text-center my-8 text-red-400 p-4 bg-red-900/20 rounded-lg max-w-2xl mx-auto">{error}</div>;
        }

        if (!hasSearched) {
            return (
                <div className="text-center mt-12 text-brand-text-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-brand-text-secondary opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1v-6z" />
                    </svg>
                    <h3 className="text-2xl font-bold text-brand-text mt-4">Discover Your Next Investment</h3>
                    <p className="text-lg mt-2 max-w-lg mx-auto">Set your criteria above and run the screener to find stocks that match your strategy.</p>
                </div>
            );
        }
        
        if (sortedResults.length === 0) {
            return <div className="text-center mt-12 text-brand-text-secondary">No stocks found matching your criteria. Try broadening your search.</div>;
        }

        const totalPages = Math.ceil(sortedResults.length / RESULTS_PER_PAGE);
        const paginatedResults = sortedResults.slice(
            (currentPage - 1) * RESULTS_PER_PAGE,
            currentPage * RESULTS_PER_PAGE
        );


        return (
            <>
                 <div className="mt-6 bg-brand-secondary rounded-lg border border-brand-border shadow-lg overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-brand-text-secondary uppercase bg-brand-primary">
                                <tr>
                                    <SortableHeader label="Ticker" sortKey="ticker" sortConfig={sortConfig} onClick={requestSort} />
                                    <SortableHeader label="Company Name" sortKey="companyName" sortConfig={sortConfig} onClick={requestSort} />
                                    <SortableHeader label="Sector" sortKey="sector" sortConfig={sortConfig} onClick={requestSort} />
                                    <SortableHeader label="Market Cap" sortKey="marketCap" sortConfig={sortConfig} onClick={requestSort} className="text-right justify-end" />
                                    <SortableHeader label="P/E Ratio" sortKey="peRatio" sortConfig={sortConfig} onClick={requestSort} className="text-right justify-end" />
                                    <SortableHeader label="Div. Yield" sortKey="dividendYield" sortConfig={sortConfig} onClick={requestSort} className="text-right justify-end" />
                                    <SortableHeader label="Analyst Rating" sortKey="analystRating" sortConfig={sortConfig} onClick={requestSort} />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border">
                                {paginatedResults.map(stock => (
                                    <tr key={stock.ticker}>
                                        <td className="py-4 px-4 font-bold text-brand-accent">{stock.ticker}</td>
                                        <td className="py-4 px-4 text-brand-text-secondary">{stock.companyName}</td>
                                        <td className="py-4 px-4 text-brand-text-secondary">{stock.sector}</td>
                                        <td className="py-4 px-4 text-right tabular-nums text-brand-text">{formatMarketCap(stock.marketCap)}</td>
                                        <td className="py-4 px-4 text-right tabular-nums text-brand-text">
                                            {(stock.peRatio !== null && stock.peRatio !== undefined) ? stock.peRatio.toFixed(2) : 'N/A'}
                                        </td>
                                        <td className="py-4 px-4 text-right tabular-nums text-brand-text">
                                            {(stock.dividendYield !== null && stock.dividendYield !== undefined) ? stock.dividendYield.toFixed(2) + '%' : 'N/A'}
                                        </td>
                                        <td className="py-4 px-4 text-brand-text-secondary">{stock.analystRating}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4 p-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-semibold rounded-md bg-brand-secondary text-brand-text hover:bg-brand-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-brand-text-secondary">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-sm font-semibold rounded-md bg-brand-secondary text-brand-text hover:bg-brand-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-brand-text">US Stock Screener</h1>
                <p className="mt-2 text-brand-text-secondary">Find your next investment opportunity with our AI-powered screener.</p>
            </div>

            <div className="bg-brand-secondary p-6 rounded-lg border border-brand-border">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Market Cap */}
                    <div>
                        <label className="block text-sm font-medium text-brand-text mb-1">Market Cap (Billions)</label>
                        <div className="flex gap-2">
                            <input type="number" name="marketCapMin" placeholder="Min" onChange={handleNumericChange} className="w-full p-2 bg-brand-primary border border-brand-border rounded-md text-sm" />
                            <input type="number" name="marketCapMax" placeholder="Max" onChange={handleNumericChange} className="w-full p-2 bg-brand-primary border border-brand-border rounded-md text-sm" />
                        </div>
                    </div>
                     {/* P/E Ratio */}
                    <div>
                        <label className="block text-sm font-medium text-brand-text mb-1">P/E Ratio</label>
                        <div className="flex gap-2">
                            <input type="number" name="peRatioMin" placeholder="Min" onChange={handleNumericChange} className="w-full p-2 bg-brand-primary border border-brand-border rounded-md text-sm" />
                            <input type="number" name="peRatioMax" placeholder="Max" onChange={handleNumericChange} className="w-full p-2 bg-brand-primary border border-brand-border rounded-md text-sm" />
                        </div>
                    </div>
                    {/* Dividend Yield */}
                    <div>
                        <label className="block text-sm font-medium text-brand-text mb-1">Dividend Yield (%)</label>
                        <div className="flex gap-2">
                            <input type="number" name="dividendYieldMin" placeholder="Min" step="0.1" onChange={handleNumericChange} className="w-full p-2 bg-brand-primary border border-brand-border rounded-md text-sm" />
                            <input type="number" name="dividendYieldMax" placeholder="Max" step="0.1" onChange={handleNumericChange} className="w-full p-2 bg-brand-primary border border-brand-border rounded-md text-sm" />
                        </div>
                    </div>
                     {/* Analyst Rating */}
                    <div>
                        <label htmlFor="analystRating" className="block text-sm font-medium text-brand-text mb-1">Min. Analyst Rating</label>
                        <select
                            id="analystRating"
                            name="analystRating"
                            value={criteria.analystRating}
                            onChange={(e) => setCriteria(prev => ({ ...prev, analystRating: e.target.value }))}
                            className="w-full p-2 bg-brand-primary border border-brand-border rounded-md text-sm"
                        >
                            {ANALYST_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-medium text-brand-text mb-2">Sectors</label>
                    <div className="flex flex-wrap gap-2">
                        {SECTORS.map(sector => (
                            <button
                                key={sector}
                                onClick={() => handleSectorToggle(sector)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                                    criteria.sectors.includes(sector)
                                        ? 'bg-brand-accent text-white'
                                        : 'bg-brand-primary hover:bg-gray-700'
                                }`}
                            >
                                {sector}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-brand-border flex justify-end gap-4">
                     <button 
                        onClick={() => { setCriteria(INITIAL_CRITERIA); setResults([]); setHasSearched(false); setCurrentPage(1); }}
                        className="px-6 py-2 rounded-md text-sm font-semibold bg-brand-border text-brand-text-secondary hover:bg-gray-600 transition-colors"
                     >
                        Reset Filters
                    </button>
                    <button 
                        onClick={handleRunScreener}
                        disabled={isLoading}
                        className="px-8 py-2 rounded-md text-sm font-semibold bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors disabled:bg-brand-accent/50 flex items-center gap-2"
                    >
                        {isLoading && <Spinner />}
                        Run Screener
                    </button>
                </div>
            </div>

            {renderResults()}
        </div>
    );
};

export default Screener;
