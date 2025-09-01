

import * as React from 'react';
import DividendTracker from './DividendTracker';
import PerformanceChart from './PerformanceChart';
import type { DashboardData } from '../types';

type AnalyticsTab = 'performance' | 'dividends';

interface AnalyticsPageProps {
    data: DashboardData | null;
}

const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors border-b-2 ${
      isActive
        ? 'text-brand-accent border-brand-accent'
        : 'text-brand-text-secondary border-transparent hover:text-brand-text hover:border-gray-600'
    }`}
    aria-current={isActive ? 'page' : undefined}
  >
    {label}
  </button>
);


const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ data }) => {
    const [activeTab, setActiveTab] = React.useState<AnalyticsTab>('performance');

    const renderContent = () => {
        if (!data || data.holdings.length === 0) {
            return (
                 <div className="text-center flex flex-col items-center justify-center h-full min-h-[40vh]">
                    <h2 className="text-2xl font-bold text-brand-text mt-4">No Data to Analyze</h2>
                    <p className="text-lg mt-2 max-w-lg mx-auto text-brand-text-secondary">
                        Add holdings to your portfolio to use the analytics tools.
                    </p>
                </div>
            )
        }
        
        switch (activeTab) {
            case 'performance':
                return <PerformanceChart transactions={data.transactions} />;
            case 'dividends':
                return <DividendTracker holdings={data.holdings} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-brand-text">Portfolio Analytics</h1>
                <p className="mt-2 text-brand-text-secondary">Deeper insights into your investments.</p>
            </div>
            <div className="border-b border-brand-border">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton label="Performance" isActive={activeTab === 'performance'} onClick={() => setActiveTab('performance')} />
                    <TabButton label="Dividend Tracker" isActive={activeTab === 'dividends'} onClick={() => setActiveTab('dividends')} />
                </nav>
            </div>

            <div className="mt-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default AnalyticsPage;
