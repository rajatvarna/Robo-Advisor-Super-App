

import * as React from 'react';
import { getTopCryptos, getCryptoNews } from '../services/geminiService';
import type { CryptoData, NewsItem } from '../types';
import Spinner from './icons/Spinner';
import { useApi } from '../contexts/ApiContext';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `${formatCurrency(value / 1e12)}T`;
    if (value >= 1e9) return `${formatCurrency(value / 1e9)}B`;
    if (value >= 1e6) return `${formatCurrency(value / 1e6)}M`;
    return formatCurrency(value);
}

const formatTimeAgo = (isoDate: string | null): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

type SortKey = keyof CryptoData;
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

const CryptoPage: React.FC = () => {
    const [cryptos, setCryptos] = React.useState<CryptoData[]>([]);
    const [news, setNews] = React.useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'marketCap', direction: 'descending' });
    const { apiMode, setApiMode } = useApi();

    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [cryptoData, newsData] = await Promise.all([
                getTopCryptos(apiMode),
                getCryptoNews(apiMode),
            ]);
            setCryptos(cryptoData);
            setNews(newsData);
        } catch (err: any) {
            if (err.message.includes('QUOTA_EXCEEDED')) {
                setApiMode('opensource');
                setError('Live AI quota exceeded. Switched to offline fallback mode for this feature.');
            } else {
                setError(err.message || 'Failed to load crypto data.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [apiMode, setApiMode]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedCryptos = React.useMemo(() => {
        let sortableItems = [...cryptos];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                
                if (aValue === null) return 1;
                if (bValue === null) return -1;
                
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
    }, [cryptos, sortConfig]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-96">
                    <Spinner />
                    <p className="mt-4 text-brand-text-secondary">AI is retrieving the latest crypto data...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center my-8 text-red-400 p-4 bg-red-900/20 rounded-lg max-w-2xl mx-auto">
                    <p className="font-bold">Could not load crypto data</p>
                    <p className="mb-4">{error}</p>
                    <button
                        onClick={() => fetchData()}
                        className="px-6 py-2 rounded-md bg-brand-accent text-white hover:bg-brand-accent-hover transition-colors"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-brand-secondary rounded-lg border border-brand-border shadow-lg overflow-hidden">
                    <h3 className="text-lg font-bold text-brand-text p-4 border-b border-brand-border">Top 25 Cryptocurrencies</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-brand-text-secondary uppercase bg-brand-primary">
                                <tr>
                                    <SortableHeader label="Name" sortKey="name" sortConfig={sortConfig} onClick={requestSort} />
                                    <SortableHeader label="Price" sortKey="price" sortConfig={sortConfig} onClick={requestSort} className="text-right justify-end" />
                                    <SortableHeader label="24h %" sortKey="change24h" sortConfig={sortConfig} onClick={requestSort} className="text-right justify-end" />
                                    <SortableHeader label="Market Cap" sortKey="marketCap" sortConfig={sortConfig} onClick={requestSort} className="text-right justify-end" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border">
                                {sortedCryptos.map(crypto => (
                                    <tr key={crypto.symbol} className="hover:bg-brand-border/20 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-brand-text">{crypto.symbol}</div>
                                            <div className="text-xs text-brand-text-secondary">{crypto.name}</div>
                                        </td>
                                        <td className="py-3 px-4 text-right tabular-nums text-brand-text">{formatCurrency(crypto.price)}</td>
                                        <td className={`py-3 px-4 text-right tabular-nums font-semibold ${crypto.change24h == null ? '' : crypto.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {crypto.change24h != null ? `${crypto.change24h.toFixed(2)}%` : 'N/A'}
                                        </td>
                                        <td className="py-3 px-4 text-right tabular-nums text-brand-text">{formatMarketCap(crypto.marketCap)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border shadow-lg">
                     <h3 className="text-lg font-bold text-brand-text mb-3">Crypto News</h3>
                     <div className="space-y-4">
                        {news.map((item, index) => {
                            const content = (
                                <>
                                    <p className="font-semibold text-brand-text group-hover:text-brand-accent transition-colors">{item.headline}</p>
                                    <div className="flex justify-between items-center text-xs text-brand-text-secondary mt-2">
                                        <span>Source: {item.source}</span>
                                        {item.publishedAt && <span>{formatTimeAgo(item.publishedAt)}</span>}
                                    </div>
                                </>
                            );

                            if (item.url) {
                                return (
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" key={index} className="block border-b border-brand-border pb-3 last:border-b-0 last:pb-0 group">
                                        {content}
                                    </a>
                                );
                            }
                            return (
                                <div key={index} className="block border-b border-brand-border pb-3 last:border-b-0 last:pb-0">
                                    {content}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-brand-text">Crypto Dashboard</h1>
                    <p className="mt-2 text-brand-text-secondary">The latest market data and news for the crypto world, powered by AI.</p>
                </div>
                 <button 
                    onClick={() => fetchData()}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-semibold rounded-md bg-brand-secondary text-brand-text hover:bg-brand-border disabled:opacity-50 transition-colors"
                >
                    Refresh
                </button>
            </div>
            {renderContent()}
        </div>
    );
};

export default CryptoPage;