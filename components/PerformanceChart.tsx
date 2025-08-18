
import * as React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import type { Transaction, PortfolioHistoryPoint } from '../types';
import * as financialDataService from '../services/financialDataService';
import { useApi } from '../contexts/ApiContext';
import Spinner from './icons/Spinner';

interface PerformanceChartProps {
    transactions: Transaction[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ transactions }) => {
    const [chartData, setChartData] = React.useState<PortfolioHistoryPoint[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const { apiMode } = useApi();

    React.useEffect(() => {
        const calculateHistory = async () => {
            if (transactions.length === 0) {
                setIsLoading(false);
                setChartData([]);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const sortedTxns = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                const startDate = sortedTxns[0].date;
                
                // For simplicity, we'll use SPY as the benchmark
                const benchmarkHistory = await financialDataService.fetchHistoricalData('SPY', startDate, apiMode);

                if (benchmarkHistory.length === 0) {
                    throw new Error("Could not fetch benchmark historical data.");
                }

                const uniqueTickers = [...new Set(sortedTxns.map(tx => tx.ticker))];
                const priceHistories: Record<string, {date: string, price: number}[]> = {};
                await Promise.all(uniqueTickers.map(async ticker => {
                    priceHistories[ticker] = await financialDataService.fetchHistoricalData(ticker, startDate, apiMode);
                }));

                const normalizedData: PortfolioHistoryPoint[] = [];
                let firstPortfolioValue = 0;
                const firstBenchmarkValue = benchmarkHistory[0].price;

                benchmarkHistory.forEach((benchmarkPoint, index) => {
                    const currentDate = new Date(benchmarkPoint.date);
                    let portfolioValue = 0;
                    
                    const holdings = new Map<string, number>();
                    sortedTxns.forEach(tx => {
                        if (new Date(tx.date) <= currentDate) {
                            holdings.set(tx.ticker, (holdings.get(tx.ticker) || 0) + (tx.type === 'Buy' ? tx.shares : -tx.shares));
                        }
                    });

                    holdings.forEach((shares, ticker) => {
                        const priceHistory = priceHistories[ticker];
                        const pricePoint = priceHistory?.find(p => p.date === benchmarkPoint.date);
                        if(pricePoint) {
                            portfolioValue += shares * pricePoint.price;
                        }
                    });

                    if (index === 0) {
                        firstPortfolioValue = portfolioValue > 0 ? portfolioValue : 1;
                    }
                    
                    if (portfolioValue > 0) {
                        normalizedData.push({
                            date: benchmarkPoint.date,
                            portfolioValue: ((portfolioValue / firstPortfolioValue) - 1) * 100,
                            benchmarkValue: ((benchmarkPoint.price / firstBenchmarkValue) - 1) * 100,
                        });
                    }
                });
                
                setChartData(normalizedData);
            } catch (err: any) {
                setError(err.message || "Failed to calculate performance history.");
            } finally {
                setIsLoading(false);
            }
        };

        calculateHistory();
    }, [transactions, apiMode]);

    if (isLoading) {
        return <div className="h-80 flex items-center justify-center bg-brand-secondary rounded-lg border border-brand-border"><Spinner/></div>;
    }
    if (error) {
        return <div className="h-80 flex items-center justify-center bg-red-900/20 rounded-lg text-red-400 p-4">{error}</div>;
    }
    if(chartData.length === 0) {
        return <div className="h-80 flex items-center justify-center bg-brand-secondary rounded-lg border border-brand-border text-brand-text-secondary">Not enough data to display performance chart.</div>;
    }

    return (
        <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border shadow-lg">
            <h3 className="text-lg font-bold text-brand-text mb-4">Performance vs. S&P 500 (SPY)</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={"var(--color-brand-border)"} />
                        <XAxis dataKey="date" stroke={"var(--color-brand-text-secondary)"} tick={{ fontSize: 12 }} />
                        <YAxis stroke={"var(--color-brand-text-secondary)"} tickFormatter={(value) => `${value}%`} />
                        <Tooltip
                          formatter={(value) => `${(value as number).toFixed(2)}%`}
                          contentStyle={{ backgroundColor: 'var(--color-brand-primary)', borderColor: 'var(--color-brand-border)', borderRadius: '0.5rem' }}
                        />
                        <Legend wrapperStyle={{ color: "var(--color-brand-text-secondary)" }}/>
                        <Line type="monotone" dataKey="portfolioValue" name="My Portfolio" stroke="#38BDF8" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="benchmarkValue" name="S&P 500" stroke="#9CA3AF" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PerformanceChart;