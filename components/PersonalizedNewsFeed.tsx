

import * as React from 'react';
import type { NewsItem, Holding, UserWatchlist } from '../types';

interface PersonalizedNewsFeedProps {
    news: NewsItem[];
    holdings: Holding[];
    watchlists: UserWatchlist[];
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

const PersonalizedNewsFeed: React.FC<PersonalizedNewsFeedProps> = ({ news, holdings, watchlists }) => {
    const hasItemsToTrack = holdings.length > 0 || watchlists.some(wl => wl.tickers.length > 0);

    return (
        <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border shadow-lg transition-shadow duration-300 hover:shadow-xl">
            <h3 className="text-lg font-bold text-brand-text mb-3">For You</h3>
            {news.length > 0 ? (
                <div className="space-y-4">
                    {news.map((item, index) => (
                        <div key={index} className="border-b border-brand-border pb-3 last:border-b-0 last:pb-0">
                            {item.url ? (
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-text hover:text-brand-accent transition-colors">
                                    {item.headline}
                                </a>
                            ) : (
                                <span className="font-semibold text-brand-text">
                                    {item.headline}
                                </span>
                            )}
                            {item.summary && <p className="text-sm text-brand-text-secondary mt-1">{item.summary}</p>}
                            <div className="flex justify-between items-center text-xs text-brand-text-secondary mt-2">
                                <span>Source: {item.source}</span>
                                {item.publishedAt && <span>{formatTimeAgo(item.publishedAt)}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <p className="text-sm text-brand-text-secondary text-center py-4">
                    {hasItemsToTrack 
                        ? "AI is searching for relevant news..." 
                        : "Add holdings or watchlist items to see personalized news."
                    }
                </p>
            )}
        </div>
    );
};

export default React.memo(PersonalizedNewsFeed);