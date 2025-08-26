

import * as React from 'react';
import type { DashboardData, Quote, UserWatchlist } from '../types';
import EmptyState from './EmptyState';
import StatCard from './StatCard';
import PortfolioScoreCard from './PortfolioScoreCard';
import AchievementsList from './AchievementsList';
import Watchlist from './Watchlist';
import PersonalizedNewsFeed from './PersonalizedNewsFeed';
import GoalProgress from './GoalProgress';
import DashboardInsights from './DashboardInsights';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

interface DashboardPageProps {
  data: DashboardData | null;
  quotes: Record<string, Quote>;
  onGenerateDemo: () => void;
  onAddHolding: () => void;
  error: string | null;
  onAddWatchlist: (name: string) => void;
  onRenameWatchlist: (id: string, newName: string) => void;
  onDeleteWatchlist: (id: string) => void;
  onUpdateWatchlistTickers: (id: string, tickers: string[]) => void;
  onDismissNews: (newsId: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ data, quotes, onGenerateDemo, onAddHolding, error, onDismissNews, ...watchlistProps }) => {
  if (!data) {
    return (
        <>
            {error && (
                <div className="text-center my-8 text-red-400 p-4 bg-red-900/20 rounded-lg max-w-2xl mx-auto">
                    {error}
                </div>
            )}
            <EmptyState onPrimaryClick={onAddHolding} onSecondaryClick={onGenerateDemo} />
        </>
    );
  }

  const { user, netWorth, holdings, portfolioScore, achievements, personalizedNews, watchlists, goal, dashboardInsights, dismissedNewsIds } = data;
  
  const dayGain = holdings.reduce((acc, h) => acc + (h.dayChange * h.shares), 0);
  const totalOriginalValue = holdings.reduce((acc, h) => acc + ((h.currentPrice - h.dayChange) * h.shares), 0);
  const dayGainPercent = totalOriginalValue > 0 ? (dayGain / totalOriginalValue) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-brand-text">Welcome back, {user.name.split(' ')[0]}!</h1>
        
        <div id="dashboard-insights">
            <DashboardInsights insights={dashboardInsights} />
        </div>
        
        {goal && <GoalProgress goal={goal} netWorth={netWorth} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div id="net-worth-card">
              <StatCard title="Net Worth" value={formatCurrency(netWorth)} />
            </div>
            <StatCard title="Day's Gain / Loss" value={formatCurrency(dayGain)} change={dayGainPercent} />
            <StatCard title="Holdings" value={holdings.length.toString()} />
            <div id="portfolio-score-card">
              <PortfolioScoreCard score={portfolioScore} />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div id="personalized-news-feed">
                  <PersonalizedNewsFeed 
                    news={personalizedNews || []} 
                    holdings={holdings} 
                    watchlists={watchlists}
                    dismissedNewsIds={dismissedNewsIds || []}
                    onDismissNews={onDismissNews}
                  />
                </div>
                <div id="achievements-list">
                  <AchievementsList achievements={achievements || []} />
                </div>
            </div>
            <div className="space-y-6">
                <div id="watchlist-card">
                    <Watchlist 
                        watchlists={watchlists || []}
                        quotes={quotes}
                        {...watchlistProps}
                    />
                </div>
            </div>
        </div>
    </div>
  );
};

export default DashboardPage;