
import * as React from 'react';
import type { PortfolioScore } from '../types';

const HealthGauge: React.FC<{ score: number }> = ({ score }) => {
    const percentage = score;
    const circumference = 2 * Math.PI * 25; // 2 * pi * r
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    let colorClass = 'text-red-400';
    if (score >= 85) colorClass = 'text-green-400';
    else if (score >= 60) colorClass = 'text-yellow-400';

    return (
        <div className="relative flex items-center justify-center w-20 h-20">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
                <circle className="text-brand-border" strokeWidth="8" stroke="currentColor" fill="transparent" r="25" cx="30" cy="30" />
                <circle
                    className={colorClass}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="25"
                    cx="30"
                    cy="30"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                />
            </svg>
            <span className={`absolute text-xl font-bold ${colorClass}`}>{score}</span>
        </div>
    );
};


const PortfolioScoreCard: React.FC<{ score: PortfolioScore }> = ({ score }) => {
    return (
        <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border shadow-lg flex items-center gap-4">
            <HealthGauge score={score.score} />
            <div className="flex-grow">
                 <p className="text-sm text-brand-text-secondary">Portfolio Score</p>
                 <p className="text-xs text-brand-text mt-1">{score.summary}</p>
            </div>
        </div>
    );
};

export default React.memo(PortfolioScoreCard);
