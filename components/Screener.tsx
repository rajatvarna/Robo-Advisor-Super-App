

import * as React from 'react';
import { screenStocks } from '../services/financialDataService';
import type { ScreenerCriteria, ScreenerResult } from '../types';
import Spinner from './icons/Spinner';

const SECTORS = [
  'Technology', 'Healthcare', 'Financial Services', 'Consumer Cyclical', 
  'Industrials', 'Consumer Defensive', 'Energy', 'Real Estate', 
  'Utilities', 'Communication Services', 'Basic Materials'
];

const RESULTS_PER_PAGE = 15;

const INITIAL_CRITERIA: ScreenerCriteria = {
  marketCapMin: 0,
  marketCapMax: Infinity,
  peRatioMin: 0,
  peRatioMax: Infinity,
  dividendYieldMin: 0,
  dividendYieldMax: Infinity,
  sectors: [],
};

interface ScreenerProps {
    onRunScreener: () => void;
}

const formatMarketCap = (value: number) => {
    if (value >= 1000000000000) return `$${(value / 1000000000000).toFixed(2)}T`;
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
    return `$${(value / 1000000).toFixed(2)}M`;
}

type SortKey = keyof ScreenerResult;
type SortDirection = 'ascending' | 'descending';

const SortableHeader: React.FC<{
    label: string;
    sortKey: SortKey;
    sortConfig: { key: SortKey; direction: SortDirection } | null;
    onClick: (key: SortKey) => void;
    className?: string;
}> = ({ label, sortKey, sortConfig, onClick, className = '' }) => {
    const isSorting = sortConfig?.key === sortKey;
    const directionIcon = isSorting ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '';
    
    return (
        <th className={`py-3 px-4 cursor-pointer hover:bg-brand-primary ${className}`} onClick={() => onClick(sortKey)}>
            <div className={`flex items-center gap-1 ${className.includes('text-right') ? 'justify-end' : ''}`}>
                <span>{label}</span>
                <span className="text-brand-accent w-2">{directionIcon}</span>
            </div>
        </th>
    );
};

// --- HELPER UI COMPONENTS ---

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);

const TooltipLabel: React.FC<{ label: string; tooltipText: string; htmlFor?: string }> = ({ label, tooltipText, htmlFor }) => (
  <div className="flex items-center gap-1.5">
    <label htmlFor={htmlFor} className="block text-sm font-medium text-brand-text mb-1">{label}</label>
    <div className="relative group flex items-center">
      <InfoIcon className="w-4 h-4 text-brand-text-secondary cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-xs text-center text-white bg-gray-700 dark:bg-gray-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-x-transparent before:border-b-transparent before:border-t-gray-700 dark:before:border-t-gray-800">
        {tooltipText}
      </div>
    </div>
  </div>
);

const RangeSlider: React.FC<{
    min: number;
    max: number;
    step: number;
    minValue: number;
    maxValue: number;
    onChange: (type: 'min' | 'max', value: number) => void;
    formatLabel: (value: number) => string;
}> = ({ min, max, step, minValue, maxValue, onChange, formatLabel }) => {
    return (
        <div className="relative h-12">
            <div className="relative h-1 bg-brand-border rounded-full mt-4">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={minValue}
                    onChange={(e) => onChange('min', parseFloat(e.target.value))}
                    className="absolute w-full h-1 bg-transparent appearance-none pointer-events-none top-0"
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={maxValue}
                    onChange={(e) => onChange('max', parseFloat(e.target.value))}
                    className="absolute w-full h-1 bg-transparent appearance-none pointer-events-none top-0"
                />
            </div>
            <div className="flex justify-between text-xs text-brand-text-secondary mt-2">
                <span>{formatLabel(minValue)}</span>
                <span>{formatLabel(maxValue)}</span>
            </div>
        </div>
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
    const [isSectorDropdownOpen, setIsSectorDropdownOpen] = React.useState(false);
    const sectorDropdownRef = React.useRef<HTMLDivElement>(null);
    
    // --- State & Handlers for Market Cap ---
    const [marketCapRange, setMarketCapRange] = React.useState({ min: 0, max: 5001 });
    const MAX_MARKET_CAP_SLIDER = 5001; // Represents "Any" or Infinity
    const handleMarketCapChange = (type: 'min' | 'max', value: number) => {
        const newRange = { ...marketCapRange, [type]: value };
        if (newRange.min > newRange.max) {
            if (type === 'max') newRange.min = newRange.max; else newRange.max = newRange.min;
        }
        setMarketCapRange(newRange);
        setCriteria(prev => ({ ...prev, marketCapMin: newRange.min * 1_000_000_000, marketCapMax: newRange.max >= MAX_MARKET_CAP_SLIDER ? Infinity : newRange.max * 1_000_000_000 }));
    };
    const formatMarketCapLabel = (value: number) => {
        if (value >= MAX_MARKET_CAP_SLIDER) return "Any";
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}T`;
        return `$${value}B`;
    };
    
    // --- State & Handlers for P/E Ratio ---
    const [peRatioRange, setPeRatioRange] = React.useState({ min: 0, max: 101 });
    const MAX_PE_RATIO = 101; // Represents "Any" or Infinity
    const handlePeRatioChange = (type: 'min' | 'max', value: number) => {
        const newRange = { ...peRatioRange, [type]: value };
        if (newRange.min > newRange.max) {
            if (type === 'max') newRange.min = newRange.max; else newRange.max = newRange.min;
        }
        setPeRatioRange(newRange);
        setCriteria(prev => ({ ...prev, peRatioMin: newRange.min, peRatioMax: newRange.max >= MAX_PE_RATIO ? Infinity : newRange.max }));
    };
    const formatPeRatioLabel = (value: number) => (value >= MAX_PE_RATIO ? "Any" : value.toString());

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sectorDropdownRef.current && !sectorDropdownRef.current.contains(event.target as Node)) {
                setIsSectorDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
            const data = await screenStocks(criteria);
            setResults(data);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
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
                if (aValue === null) return 1; if (bValue === null) return -1;
                if (typeof aValue === 'number' && typeof bValue === 'number') { return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue; }
                if (typeof aValue === 'string' && typeof bValue === 'string') { return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue); }
                return 0;
            });
        }
        return sortableItems;
    }, [results, sortConfig]);

    const paginatedResults = sortedResults.slice((currentPage - 1) * RESULTS_PER_PAGE, currentPage * RESULTS_PER_PAGE);
    const totalPages = Math.ceil(sortedResults.length / RESULTS_PER_PAGE);

    const renderResults = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-64">
                    <Spinner />
                    <p className="mt-4 text-brand-text-secondary">Screening thousands of stocks...</p>
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <h2 className="text-xl font-bold text-brand-text mt-4">Set your criteria</h2>
                    <p>Adjust the filters above and run the screener to find your next investment.</p>
                </div>
            );
        }

        if (paginatedResults.length === 0) {
            return <div className="text-center my-8 text-brand-text-secondary">No stocks found matching your criteria. Try broadening your search.</div>;
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-brand-text-secondary uppercase bg-brand-primary">
                        <tr>
                            <SortableHeader label="Ticker" sortKey="ticker" sortConfig={sortConfig} onClick={requestSort} />
                            <SortableHeader label="Company Name" sortKey="companyName" sortConfig={sortConfig} onClick={requestSort} />
                            <SortableHeader label="Market Cap" sortKey="marketCap" sortConfig={sortConfig} onClick={requestSort} className="text-right" />
                            <SortableHeader label="P/E Ratio" sortKey="peRatio" sortConfig={sortConfig} onClick={requestSort} className="text-right" />
                            <SortableHeader label="Div. Yield" sortKey="dividendYield" sortConfig={sortConfig} onClick={requestSort} className="text-right" />
                            <SortableHeader label="Sector" sortKey="sector" sortConfig={sortConfig} onClick={requestSort} />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {paginatedResults.map(stock => (
                            <tr key={stock.ticker} className="hover:bg-brand-border/20 transition-colors">
                                <td className="py-3 px-4 font-bold text-brand-accent">{stock.ticker}</td>
                                <td className="py-3 px-4 text-brand-text">{stock.companyName}</td>
                                <td className="py-3 px-4 text-right tabular-nums text-brand-text">{formatMarketCap(stock.marketCap)}</td>
                                <td className="py-3 px-4 text-right tabular-nums text-brand-text">{stock.peRatio?.toFixed(2) ?? 'N/A'}</td>
                                <td className="py-3 px-4 text-right tabular-nums text-brand-text">{stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : 'N/A'}</td>
                                <td className="py-3 px-4 text-brand-text-secondary">{stock.sector}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-md text-sm ${currentPage === page ? 'bg-brand-accent text-white' : 'bg-brand-primary'}`}>{page}</button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-brand-text">Stock Screener</h1>
                <p className="mt-2 text-brand-text-secondary">Discover investment opportunities by filtering stocks with your custom criteria.</p>
            </div>

            <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                     <div>
                        <TooltipLabel
                            label="Market Cap"
                            tooltipText="The total value of a company's shares. Filter by size, from small-cap to mega-cap."
                        />
                         <RangeSlider min={0} max={MAX_MARKET_CAP_SLIDER} step={10} minValue={marketCapRange.min} maxValue={marketCapRange.max} onChange={handleMarketCapChange} formatLabel={formatMarketCapLabel} />
                    </div>
                     <div>
                        <TooltipLabel
                            label="P/E Ratio"
                            tooltipText="Price-to-Earnings ratio. A common metric for valuation. Lower can mean undervalued, higher can mean overvalued."
                        />
                         <RangeSlider min={0} max={MAX_PE_RATIO} step={1} minValue={peRatioRange.min} maxValue={peRatioRange.max} onChange={handlePeRatioChange} formatLabel={formatPeRatioLabel} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-brand-border">
                    <div className="flex items-center gap-4">
                         <div className="flex-1">
                            <TooltipLabel label="Dividend Yield (Min %)" tooltipText="The minimum annual dividend payout as a percentage of the stock's price." htmlFor="dividendYieldMin"/>
                             <div className="relative">
                                <input type="number" name="dividendYieldMin" id="dividendYieldMin" value={criteria.dividendYieldMin} onChange={handleNumericChange} placeholder="e.g., 2.5" step="0.1" className="w-full p-2 pl-3 pr-8 bg-brand-primary border border-brand-border rounded-lg text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition"/>
                                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-brand-text-secondary pointer-events-none">%</span>
                            </div>
                        </div>
                         <div className="flex-1">
                            <TooltipLabel label="Dividend Yield (Max %)" tooltipText="The maximum annual dividend payout as a percentage of the stock's price." htmlFor="dividendYieldMax"/>
                             <div className="relative">
                                <input type="number" name="dividendYieldMax" id="dividendYieldMax" value={isFinite(criteria.dividendYieldMax) ? criteria.dividendYieldMax : ''} onChange={handleNumericChange} placeholder="Any" step="0.1" className="w-full p-2 pl-3 pr-8 bg-brand-primary border border-brand-border rounded-lg text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition"/>
                                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-brand-text-secondary pointer-events-none">%</span>
                            </div>
                        </div>
                    </div>
                     <div className="lg:col-span-2">
                        <TooltipLabel label="Sectors" tooltipText="Filter by industry sector. Select one or more to narrow your search." />
                         <div className="relative" ref={sectorDropdownRef}>
                            <button onClick={() => setIsSectorDropdownOpen(!isSectorDropdownOpen)} className="w-full p-2 bg-brand-primary border border-brand-border rounded-lg text-left truncate">
                                {criteria.sectors.length > 0 ? `${criteria.sectors.length} selected` : 'Any Sector'}
                            </button>
                             {isSectorDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-brand-primary border border-brand-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {SECTORS.map(sector => (
                                        <label key={sector} className="flex items-center px-3 py-2 cursor-pointer hover:bg-brand-secondary">
                                            <input type="checkbox" checked={criteria.sectors.includes(sector)} onChange={() => handleSectorToggle(sector)} className="h-4 w-4 rounded border-brand-border text-brand-accent focus:ring-brand-accent"/>
                                            <span className="ml-2 text-sm text-brand-text">{sector}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-brand-border flex justify-end">
                    <button onClick={handleRunScreener} disabled={isLoading} className="px-8 py-2.5 font-semibold rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors flex items-center justify-center disabled:bg-brand-accent/50">
                        {isLoading ? <><Spinner /> <span className="ml-2">Screening...</span></> : 'Run Screener'}
                    </button>
                </div>
            </div>

            <div className="mt-8">
                {renderResults()}
            </div>
        </div>
    );
};

export default Screener;
