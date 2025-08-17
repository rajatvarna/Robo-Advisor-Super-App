
import * as React from 'react';
import type { NewsItem, Holding, UserWatchlist } from '../types';

interface PersonalizedNewsFeedProps {
    news: NewsItem[];
    holdings: Holding[];
    watchlists: UserWatchlist[];
}

const PersonalizedNewsFeed: React.FC<PersonalizedNewsFeedProps> = ({ news, holdings, watchlists }) => {
    const hasItemsToTrack = holdings.length > 0 || watchlists.some(wl => wl.tickers.length > 0);

    return (
        <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border shadow-lg transition-shadow duration-300 hover:shadow-xl">
            <h3 className="text-lg font-bold text-brand-text mb-3">For You</h3>
            {news.length > 0 ? (
                <div className="space-y-4">
                    {news.map((item, index) => (
                        <div key={index} className="border-b border-brand-border pb-3 last:border-b-0 last:pb-0">
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-text hover:text-brand-accent transition-colors">
                                {item.headline}
                            </a>
                            <p className="text-sm text-brand-text-secondary mt-1">{item.summary}</p>
                            <p className="text-xs text-brand-text-secondary mt-2">Source: {item.source}</p>
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
