
import * as React from 'react';
import type { StockAnalysisData } from '../types';
import Spinner from './icons/Spinner';
import BullIcon from './icons/BullIcon';
import BearIcon from './icons/BearIcon';
import HealthIcon from './icons/HealthIcon';
import LinkIcon from './icons/LinkIcon';

interface StockAnalysisProps {
  analysis: StockAnalysisData | null;
}

const HealthGauge: React.FC<{ score: number }> = ({ score }) => {
    const percentage = (score / 10) * 100;
    const circumference = 2 * Math.PI * 45; // 2 * pi * r
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    let colorClass = 'text-red-400';
    if (score >= 7) colorClass = 'text-green-400';
    else if (score >= 4) colorClass = 'text-yellow-400';

    return (
        <div className="relative flex items-center justify-center w-32 h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                    className="text-brand-border"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                />
                <circle
                    className={colorClass}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                />
            </svg>
            <span className={`absolute text-3xl font-bold ${colorClass}`}>{score}</span>
        </div>
    );
};

const StockAnalysis: React.FC<StockAnalysisProps> = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="bg-brand-secondary border border-brand-border rounded-lg shadow-lg p-6 min-h-[200px] flex items-center justify-center">
        <Spinner />
        <p className="ml-4 text-brand-text-secondary">AI is analyzing the company...</p>
      </div>
    );
  }

  const { businessSummary, bullCase, bearCase, financialHealth, recentNews, sources } = analysis;
  
  const sentimentStyles = {
    Positive: 'bg-green-500/20 text-green-400',
    Negative: 'bg-red-500/20 text-red-400',
    Neutral: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <div className="animate-fade-in space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Business Summary */}
            <div className="lg:col-span-2 bg-brand-secondary border border-brand-border rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-brand-text mb-3">Business Summary</h3>
                <p className="text-brand-text-secondary text-sm leading-relaxed">{businessSummary}</p>
            </div>
            
            {/* Financial Health */}
            <div className="bg-brand-secondary border border-brand-border rounded-lg shadow-lg p-6 flex flex-col items-center justify-center">
                <h3 className="text-xl font-bold text-brand-text mb-3 flex items-center gap-2"><HealthIcon className="w-6 h-6"/>Financial Health</h3>
                <HealthGauge score={financialHealth.score} />
                <p className="text-center text-brand-text-secondary text-sm mt-3">{financialHealth.summary}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bull Case */}
            <div className="bg-brand-secondary border border-brand-border rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-green-400 mb-3 flex items-center gap-2"><BullIcon className="w-6 h-6"/>Bull Case</h3>
                <p className="text-brand-text-secondary text-sm leading-relaxed">{bullCase}</p>
            </div>

            {/* Bear Case */}
            <div className="bg-brand-secondary border border-brand-border rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-red-400 mb-3 flex items-center gap-2"><BearIcon className="w-6 h-6"/>Bear Case</h3>
                <p className="text-brand-text-secondary text-sm leading-relaxed">{bearCase}</p>
            </div>
        </div>

        {/* Recent News */}
        <div className="bg-brand-secondary border border-brand-border rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-brand-text mb-4">Recent News & Sentiment</h3>
            <div className="space-y-4">
                {recentNews.map((item, index) => {
                    const source = sources.find(s => s.index === item.sourceIndex);
                    return (
                        <div key={index} className="flex items-start gap-4">
                            <div className={`flex-shrink-0 w-24 text-center text-xs font-semibold py-1 rounded-full ${sentimentStyles[item.sentiment]}`}>
                                {item.sentiment}
                            </div>
                            <div className="flex-grow">
                                 <a href={source?.uri} target="_blank" rel="noopener noreferrer" className="text-brand-text hover:text-brand-accent transition-colors">
                                    {item.headline}
                                 </a>
                                 <p className="text-xs text-brand-text-secondary mt-1">Source: {source?.title || 'Unknown'}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
             {sources && sources.length > 0 && (
                <div className="mt-6 pt-4 border-t border-brand-border">
                  <h4 className="text-sm font-bold text-brand-text mb-2">Analysis Sources</h4>
                  <ul className="space-y-1">
                    {sources.map((source, index) => (
                      <li key={index} className="text-xs flex items-center gap-2">
                        <LinkIcon className="w-3 h-3 text-brand-text-secondary flex-shrink-0"/>
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline truncate" title={source.title || source.uri}>
                          {source.title || source.uri}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
            )}
        </div>
    </div>
  );
};

export default StockAnalysis;