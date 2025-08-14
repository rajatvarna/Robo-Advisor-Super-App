

import * as React from 'react';
import { generateDividendData } from '../services/geminiService';
import type { Holding, Dividend } from '../types';
import Spinner from './icons/Spinner';
import { useApi } from '../contexts/ApiContext';

interface DividendTrackerProps {
    holdings: Holding[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const DividendTracker: React.FC<DividendTrackerProps> = ({ holdings }) => {
    const [dividends, setDividends] = React.useState<Dividend[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const { apiMode, setApiMode } = useApi();

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await generateDividendData(holdings, apiMode);
                setDividends(data);
            } catch (err: any) {
                if(err.message.includes('QUOTA_EXCEEDED')) {
                    setApiMode('opensource');
                     setError('Live AI quota exceeded. Switched to offline fallback mode for this feature.');
                } else {
                    setError(err.message || 'Failed to load dividend data.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (holdings.length > 0) {
            fetchData();
        } else {
            setIsLoading(false);
            setDividends([]);
        }
    }, [holdings, apiMode, setApiMode]);
    
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Spinner />
                <p className="mt-4 text-brand-text-secondary">AI is forecasting your dividend income...</p>
            </div>
        );
    }

    if (error) {
        return <div className="text-center my-8 text-red-400 p-4 bg-red-900/20 rounded-lg">{error}</div>;
    }

    if (dividends.length === 0) {
        return <div className="text-center my-8 text-brand-text-secondary">No upcoming dividends found for your current holdings.</div>;
    }

    const totalDividendIncome = dividends.reduce((sum, div) => sum + div.totalAmount, 0);

    return (
        <div className="bg-brand-secondary rounded-lg border border-brand-border shadow-lg overflow-hidden animate-fade-in">
             <div className="p-4 border-b border-brand-border flex justify-between items-baseline">
                <h3 className="text-lg font-bold text-brand-text">Upcoming Dividends (Next 3 Months)</h3>
                <p className="text-brand-text-secondary">Total Projected Income: <span className="font-bold text-green-400">{formatCurrency(totalDividendIncome)}</span></p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-brand-text-secondary uppercase bg-brand-primary">
                        <tr>
                            <th className="py-3 px-4">Ticker</th>
                            <th className="py-3 px-4">Ex-Dividend Date</th>
                            <th className="py-3 px-4">Payment Date</th>
                            <th className="py-3 px-4 text-right">Amount / Share</th>
                            <th className="py-3 px-4 text-right">Total Payout</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {dividends.map((div) => (
                            <tr key={`${div.ticker}-${div.payDate}`}>
                                <td className="py-4 px-4 font-bold text-brand-accent">{div.ticker}</td>
                                <td className="py-4 px-4 text-brand-text-secondary">{div.exDividendDate}</td>
                                <td className="py-4 px-4 text-brand-text-secondary">{div.payDate}</td>
                                <td className="py-4 px-4 text-right tabular-nums text-brand-text">{formatCurrency(div.amountPerShare)}</td>
                                <td className="py-4 px-4 text-right tabular-nums font-bold text-green-400">{formatCurrency(div.totalAmount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DividendTracker;
