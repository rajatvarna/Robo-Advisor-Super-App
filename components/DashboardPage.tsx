

import * as React from 'react';
import type { DashboardData } from '../types';
import EmptyState from './EmptyState';
import StatCard from './StatCard';
import PortfolioScoreCard from './PortfolioScoreCard';
import AchievementsList from './AchievementsList';
import Watchlist from './Watchlist';
import PersonalizedNewsFeed from './PersonalizedNewsFeed';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

interface DashboardPageProps {
  data: DashboardData | null;
  onGenerateDemo: () => void;
  onAddHolding: () => void;
  error: string | null;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ data, onGenerateDemo, onAddHolding, error }) => {
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

  const { user, netWorth, holdings, portfolioScore, achievements, watchlist, personalizedNews } = data;
  
  const dayGain = holdings.reduce((acc, h) => acc + (h.dayChange * h.shares), 0);
  const totalOriginalValue = holdings.reduce((acc, h) => acc + ((h.currentPrice - h.dayChange) * h.shares), 0);
  const dayGainPercent = totalOriginalValue > 0 ? (dayGain / totalOriginalValue) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-brand-text">Welcome back, {user.name.split(' ')[0]}!</h1>
        
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
                  <PersonalizedNewsFeed news={personalizedNews || []} />
                </div>
                <div id="achievements-list">
                  <AchievementsList achievements={achievements || []} />
                </div>
            </div>
            <div className="space-y-6">
                <Watchlist stocks={watchlist || []} />
            </div>
        </div>
    </div>
  );
};

export default DashboardPage;