
import * as React from 'react';
import type { StockComparisonData, StockMetrics } from '../types';
import Spinner from './icons/Spinner';

interface StockComparisonProps {
    data: StockComparisonData | null;
    isLoading: boolean;
    error: string | null;
}

const formatMarketCap = (value: number | null) => {
    if (value === null) return 'N/A';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
}

const StockComparison: React.FC<StockComparisonProps> = ({ data, isLoading, error }) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 bg-brand-secondary rounded-lg border border-brand-border mt-6">
                <Spinner />
                <p className="mt-4 text-brand-text-secondary">Generating detailed stock comparison...</p>
            </div>
        );
    }

    if (error) {
        return <div className="text-center my-8 text-red-400 p-4 bg-red-900/20 rounded-lg max-w-2xl mx-auto mt-6">{error}</div>;
    }

    if (!data) {
        return null;
    }

    const headers: { key: keyof StockMetrics, label: string }[] = [
        { key: 'companyName', label: 'Company Name' },
        { key: 'marketCap', label: 'Market Cap' },
        { key: 'peRatio', label: 'P/E Ratio' },
        { key: 'dividendYield', label: 'Dividend Yield' },
        { key: 'beta', label: 'Beta' },
        { key: 'week52High', label: '52-Week High' },
        { key: 'week52Low', label: '52-Week Low' },
    ];

    const renderCell = (item: StockMetrics, key: keyof StockMetrics) => {
        const value = item[key];
        switch (key) {
            case 'companyName':
                 return <div className="text-sm font-semibold text-brand-text whitespace-pre-wrap">{value}</div>;
            case 'marketCap':
                 return <div className="text-sm text-brand-text whitespace-pre-wrap tabular-nums">{formatMarketCap(value as number)}</div>;
            case 'peRatio':
                return <div className="text-sm text-brand-text whitespace-pre-wrap tabular-nums">{value != null ? (value as number).toFixed(2) : 'N/A'}</div>;
            case 'dividendYield':
                return <div className="text-sm text-brand-text whitespace-pre-wrap tabular-nums">{value != null ? `${(value as number).toFixed(2)}%` : 'N/A'}</div>;
            case 'beta':
            case 'week52High':
            case 'week52Low':
                return <div className="text-sm text-brand-text whitespace-pre-wrap tabular-nums">{value != null ? (value as number).toFixed(2) : 'N/A'}</div>;
            default:
                return <div className="text-sm text-brand-text whitespace-pre-wrap">{value?.toString()}</div>;
        }
    };

    return (
        <div className="mt-8 bg-brand-primary rounded-lg border border-brand-border shadow-lg overflow-hidden animate-fade-in">
            <h2 className="text-2xl font-bold text-brand-text p-4 border-b border-brand-border">Stock Comparison</h2>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm text-left">
                    <thead className="text-xs text-brand-text-secondary uppercase bg-brand-secondary">
                        <tr>
                            <th className="py-3 px-4 sticky left-0 bg-brand-secondary z-10 w-48">Metric</th>
                            {data.map(item => (
                                <th key={item.ticker} className="py-3 px-4 text-center min-w-[200px] font-bold text-brand-text text-base">{item.ticker}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {headers.map((header, rowIndex) => (
                            <tr key={header.key} className={rowIndex % 2 === 0 ? 'bg-brand-primary' : 'bg-brand-secondary/50'}>
                                <td className={`py-4 px-4 font-semibold text-brand-text sticky left-0 z-10 w-48 ${rowIndex % 2 === 0 ? 'bg-brand-primary' : 'bg-brand-secondary/50'}`}>{header.label}</td>
                                {data.map(item => (
                                    <td key={item.ticker} className="py-4 px-4 align-top min-w-[200px]">
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
