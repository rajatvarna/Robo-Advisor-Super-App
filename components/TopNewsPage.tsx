


import * as React from 'react';
// FIX: Changed import to use getMarketNews, which replaced getTopBusinessNews.
import { getMarketNews } from '../services/financialDataService';
import type { NewsItem } from '../types';
import Spinner from './icons/Spinner';
import { useApi } from '../contexts/ApiContext';

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

const TopNewsPage: React.FC = () => {
    const [news, setNews] = React.useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const { apiMode, setApiMode } = useApi();

    const fetchNews = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // FIX: Removed invalid apiMode argument.
            const results = await getMarketNews('general');
            setNews(results);
        } catch (err: any) {
             if (err.message.includes('QUOTA_EXCEEDED')) {
                setApiMode('opensource');
                setError('Live AI quota exceeded. Switched to offline fallback mode for this feature.');
            } else {
                setError(err.message || 'Failed to load top news.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [apiMode, setApiMode]);

    React.useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-96">
                    <Spinner />
                    <p className="mt-4 text-brand-text-secondary">AI is curating the latest top news stories...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center my-8 text-red-400 p-4 bg-red-900/20 rounded-lg max-w-2xl mx-auto">
                    <p className="font-bold">Could not load news</p>
                    <p className="mb-4">{error}</p>
                    <button
                        onClick={fetchNews}
                        className="px-6 py-2 rounded-md bg-brand-accent text-white hover:bg-brand-accent-hover transition-colors"
                    >
                        Retry
                    </button>
                </div>
            );
        }
        
        if (news.length === 0) {
            return (
                 <div className="text-center my-8 text-brand-text-secondary">
                    <p>No news stories could be fetched at this time. Please try again later.</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {news.map((item, index) => {
                    const content = (
                        <>
                            <div className="flex justify-between items-center">
                                <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider">{item.source}</p>
                                {item.publishedAt && <p className="text-xs text-brand-text-secondary">{formatTimeAgo(item.publishedAt)}</p>}
                            </div>
                            <h3 className="text-lg font-bold text-brand-text mt-1">{item.headline}</h3>
                            {item.summary && <p className="text-sm text-brand-text-secondary mt-2">{item.summary}</p>}
                        </>
                    );

                    if (item.url) {
                        return (
                            <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                key={item.id} 
                                className="block bg-brand-secondary p-4 rounded-lg border border-brand-border hover:bg-brand-border/20 hover:border-brand-border transition-colors duration-200"
                            >
                                {content}
                            </a>
                        );
                    }

                    return (
                        <div
                            key={item.id} 
                            className="block bg-brand-secondary p-4 rounded-lg border border-brand-border"
                        >
                            {content}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-brand-text">Top Business News</h1>
                <p className="mt-2 text-brand-text-secondary">The latest stories from trusted financial sources, curated by AI.</p>
            </div>
            {renderContent()}
        </div>
    );
};

export default TopNewsPage;