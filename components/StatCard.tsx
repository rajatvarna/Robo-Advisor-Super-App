
import * as React from 'react';

interface StatCardProps {
    title: string;
    value: string;
    change?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change }) => {
    const isChangeDefined = change !== undefined;
    const isPositive = isChangeDefined && change >= 0;

    return (
        <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border shadow-lg transition-shadow duration-300 hover:shadow-xl">
            <p className="text-sm text-brand-text-secondary">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-brand-text">{value}</p>
                {isChangeDefined && (
                    <span className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                    </span>
                )}
            </div>
        </div>
    );
};

export default React.memo(StatCard);