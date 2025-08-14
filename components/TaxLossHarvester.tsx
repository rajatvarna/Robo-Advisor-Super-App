

import * as React from 'react';
import { generateTaxLossOpportunities } from '../services/geminiService';
import type { Holding, TaxLossOpportunity } from '../types';
import Spinner from './icons/Spinner';
import { useApi } from '../contexts/ApiContext';

interface TaxLossHarvesterProps {
    holdings: Holding[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const TaxLossHarvester: React.FC<TaxLossHarvesterProps> = ({ holdings }) => {
    const [opportunities, setOpportunities] = React.useState<TaxLossOpportunity[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const { apiMode, setApiMode } = useApi();

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await generateTaxLossOpportunities(holdings, apiMode);
                setOpportunities(data);
            } catch (err: any) {
                if(err.message.includes('QUOTA_EXCEEDED')) {
                    setApiMode('opensource');
                    setError('Live AI quota exceeded. Switched to offline fallback mode for this feature.');
                } else {
                    setError(err.message || 'Failed to load tax-loss harvesting data.');
                }
            } finally {
                setIsLoading(false);
            }
        };
        if (holdings.length > 0) fetchData();
        else {
             setIsLoading(false);
             setOpportunities([]);
        }
    }, [holdings, apiMode, setApiMode]);
    
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Spinner />
                <p className="mt-4 text-brand-text-secondary">AI is analyzing your portfolio for tax-saving opportunities...</p>
            </div>
        );
    }

    if (error) {
        return <div className="text-center my-8 text-red-400 p-4 bg-red-900/20 rounded-lg">{error}</div>;
    }

    if (opportunities.length === 0) {
        return (
            <div className="text-center my-8 p-6 bg-brand-secondary rounded-lg border border-brand-border">
                <h3 className="text-xl font-bold text-green-400">Good News!</h3>
                <p className="text-brand-text-secondary mt-2">Our AI didn't find any significant tax-loss harvesting opportunities in your portfolio at this time. This usually means your positions are holding strong.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="p-4 bg-brand-secondary rounded-lg border border-yellow-500/30">
                <p className="text-sm text-yellow-300">
                    <span className="font-bold">Disclaimer:</span> This is not tax advice. The information provided is for educational purposes only. Consult with a qualified financial advisor or tax professional before making any investment decisions.
                </p>
            </div>
            {opportunities.map((opp) => (
                 <div key={opp.ticker} className="bg-brand-secondary rounded-lg border border-brand-border shadow-lg overflow-hidden">
                    <div className="p-4 border-b border-brand-border">
                        <h3 className="text-lg font-bold text-brand-text">Opportunity: Sell {opp.ticker} ({opp.companyName})</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                       <div className="text-center p-3 rounded-lg bg-brand-primary">
                            <p className="text-sm text-brand-text-secondary">Est. Loss to Harvest</p>
                            <p className="text-2xl font-bold text-red-400">{formatCurrency(opp.estimatedLoss)}</p>
                       </div>
                       <div className="text-center p-3 rounded-lg bg-brand-primary">
                            <p className="text-sm text-brand-text-secondary">Shares to Sell</p>
                            <p className="text-2xl font-bold text-brand-text">{opp.sharesToSell}</p>
                       </div>
                       <div className="text-center p-3 rounded-lg bg-brand-primary">
                            <p className="text-sm text-brand-text-secondary">Assumed Cost Basis</p>
                            <p className="text-2xl font-bold text-brand-text">{formatCurrency(opp.costBasis)}</p>
                       </div>
                       <div className="text-center p-3 rounded-lg bg-brand-primary">
                            <p className="text-sm text-brand-text-secondary">Current Value</p>
                            <p className="text-2xl font-bold text-brand-text">{formatCurrency(opp.currentValue)}</p>
                       </div>
                    </div>
                    <div className="p-4 border-t border-brand-border">
                        <h4 className="font-bold text-brand-text mb-2">AI Rationale:</h4>
                        <p className="text-sm text-brand-text-secondary">{opp.explanation}</p>
                    </div>
                 </div>
            ))}
        </div>
    );
};

export default TaxLossHarvester;
