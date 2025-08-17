


import * as React from 'react';
import type { StockComparisonData } from '../types';
import Spinner from './icons/Spinner';

interface StockComparisonProps {
    data: StockComparisonData | null;
    isLoading: boolean;
    error: string | null;
}

const formatMarketCap = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}T`;
    return `$${value}B`;
}

const StockComparison: React.FC<StockComparisonProps> = ({ data, isLoading, error }) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 bg-brand-secondary rounded-lg border border-brand-border mt-6">
                <Spinner />
                <p className="mt-4 text-brand-text-secondary">AI is generating a detailed stock comparison...</p>
            </div>
        );
    }

    if (error) {
        return <div className="text-center my-8 text-red-400 p-4 bg-red-900/20 rounded-lg max-w-2xl mx-auto mt-6">{error}</div>;
    }

    if (!data) {
        return null;
    }

    const headers = [
        { key: 'companyName', label: 'Company Name' },
        { key: 'marketCap', label: 'Market Cap' },
        { key: 'peRatio', label: 'P/E Ratio' },
        { key: 'dividendYield', label: 'Dividend Yield' },
        { key: 'analystRating', label: 'Analyst Rating' },
        { key: 'financialHealthSummary', label: 'Financial Health' },
        { key: 'bullCase', label: 'Bull Case' },
        { key: 'bearCase', label: 'Bear Case' },
    ];

    const renderCell = (item: any, key: string) => {
        const value = item[key];
        switch (key) {
            case 'marketCap':
                 return <div className="text-sm text-brand-text whitespace-pre-wrap">{formatMarketCap(value)}</div>;
            case 'peRatio':
                return <div className="text-sm text-brand-text whitespace-pre-wrap">{value != null ? value.toFixed(2) : 'N/A'}</div>;
            case 'dividendYield':
                return <div className="text-sm text-brand-text whitespace-pre-wrap">{value != null ? `${value.toFixed(2)}%` : 'N/A'}</div>;
            case 'financialHealthSummary':
                 return <div className="text-sm text-brand-text-secondary whitespace-pre-wrap">{value}</div>;
            case 'bullCase':
                return <div className="text-sm text-green-500 dark:text-green-300/90 whitespace-pre-wrap">{value}</div>;
            case 'bearCase':
                 return <div className="text-sm text-red-500 dark:text-red-300/90 whitespace-pre-wrap">{value}</div>;
            default:
                return <div className="text-sm text-brand-text whitespace-pre-wrap">{value}</div>;
        }
    };

    return (
        <div className="mt-8 bg-brand-secondary rounded-lg border border-brand-border shadow-lg overflow-hidden animate-fade-in">
            <h2 className="text-2xl font-bold text-brand-text p-4 border-b border-brand-border">Stock Comparison</h2>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm text-left">
                    <thead className="text-xs text-brand-text-secondary uppercase bg-brand-primary">
                        <tr>
                            <th className="py-3 px-4 sticky left-0 bg-brand-primary z-10 w-48">Metric</th>
                            {data.map(item => (
                                <th key={item.ticker} className="py-3 px-4 text-center min-w-[250px] font-bold text-brand-text text-base">{item.ticker}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {headers.map(header => (
                            <tr key={header.key}>
                                <td className="py-4 px-4 font-semibold text-brand-text sticky left-0 bg-brand-secondary z-10 w-48">{header.label}</td>
                                {data.map(item => (
                                    <td key={item.ticker} className="py-4 px-4 align-top min-w-[250px]">
                                        {renderCell(item, header.key)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockComparison;