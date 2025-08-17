import * as React from 'react';
import LightbulbIcon from './icons/LightbulbIcon';
import Spinner from './icons/Spinner';

interface DashboardInsightsProps {
    insights?: string[];
}

const DashboardInsights: React.FC<DashboardInsightsProps> = ({ insights }) => {
    return (
        <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border shadow-lg">
            <div className="flex items-center gap-2 mb-3">
                <LightbulbIcon className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-bold text-brand-text">AI Daily Briefing</h3>
            </div>
            {!insights ? (
                <div className="flex items-center justify-center h-20">
                    <Spinner />
                    <p className="ml-3 text-sm text-brand-text-secondary">AI is analyzing your portfolio for key insights...</p>
                </div>
            ) : (
                <ul className="space-y-2 list-disc list-inside text-sm text-brand-text-secondary">
                    {insights.map((insight, index) => (
                        <li key={index}>{insight}</li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DashboardInsights;
