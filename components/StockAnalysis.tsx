
import * as React from 'react';
import type { StockMetrics } from '../types';
import Spinner from './icons/Spinner';
import * as financialDataService from '../services/financialDataService';

interface StockMetricsProps {
  ticker: string | null;
}

const formatNumber = (value: number | null | undefined, precision = 2) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision });
};

const formatMarketCap = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
}

const MetricItem: React.FC<{ label: string; value: string | number | null | undefined; }> = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-brand-border last:border-b-0">
        <span className="text-sm text-brand-text-secondary">{label}</span>
        <span className="text-sm font-semibold text-brand-text">{value}</span>
    </div>
);

const StockMetricsDisplay: React.FC<{ metrics: StockMetrics | null }> = ({ metrics }) => {
    if (!metrics) {
        return (
            <div className="bg-brand-secondary border border-brand-border rounded-lg shadow-lg p-6 min-h-[200px] flex items-center justify-center">
                <Spinner />
                <p className="ml-4 text-brand-text-secondary">Fetching key metrics...</p>
            </div>
        );
    }

    return (
        <div className="bg-brand-secondary border border-brand-border rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-bold text-brand-text mb-2">Key Metrics for {metrics.ticker}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <div>
                    <MetricItem label="Market Cap" value={formatMarketCap(metrics.marketCap)} />
                    <MetricItem label="P/E Ratio (TTM)" value={formatNumber(metrics.peRatio)} />
                    <MetricItem label="Dividend Yield" value={metrics.dividendYield ? `${formatNumber(metrics.dividendYield)}%` : 'N/A'} />
                </div>
                <div>
                    <MetricItem label="52-Week High" value={`$${formatNumber(metrics.week52High)}`} />
                    <MetricItem label="52-Week Low" value={`$${formatNumber(metrics.week52Low)}`} />
                    <MetricItem label="Beta" value={formatNumber(metrics.beta)} />
                </div>
            </div>
        </div>
    );
};


const StockMetrics: React.FC<StockMetricsProps> = ({ ticker }) => {
    const [metrics, setMetrics] = React.useState<StockMetrics | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    
    React.useEffect(() => {
        const fetchMetrics = async () => {
            if (!ticker) return;
            setIsLoading(true);
            setError(null);
            setMetrics(null);
            try {
                const data = await financialDataService.getStockMetrics(ticker);
                setMetrics(data);
            } catch (err: any) {
                setError(err.message || "Failed to load stock metrics.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchMetrics();
    }, [ticker]);

    if (isLoading) {
        return (
            <div className="bg-brand-secondary border border-brand-border rounded-lg shadow-lg p-6 min-h-[200px] flex items-center justify-center">
                <Spinner />
                <p className="ml-4 text-brand-text-secondary">Fetching key metrics...</p>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center my-4 text-red-400 p-3 bg-red-900/20 rounded-lg">{error}</div>;
    }

    return <StockMetricsDisplay metrics={metrics} />;
};


export default StockMetrics;
