
import * as React from 'react';
import type { InvestmentGoal } from '../types';

interface GoalProgressProps {
    goal: InvestmentGoal;
    netWorth: number;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const GoalProgress: React.FC<GoalProgressProps> = ({ goal, netWorth }) => {
    const progress = Math.min((netWorth / goal.targetAmount) * 100, 100);
    
    const timeDiff = new Date(goal.targetDate).getTime() - new Date().getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    const yearsRemaining = (daysRemaining / 365.25).toFixed(1);

    return (
        <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border shadow-lg">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-brand-text">Goal: {goal.name}</h3>
                <span className="text-sm font-semibold text-brand-accent">{progress.toFixed(1)}% Complete</span>
            </div>
            <div className="w-full bg-brand-primary rounded-full h-2.5">
                <div className="bg-brand-accent h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
            </div>
            <div className="flex justify-between items-baseline mt-2 text-xs text-brand-text-secondary">
                <span>{formatCurrency(netWorth)}</span>
                <div className="text-right">
                    <p>{formatCurrency(goal.targetAmount)} Target</p>
                    <p>~{yearsRemaining} years remaining</p>
                </div>
            </div>
        </div>
    );
};

export default GoalProgress;
