
import * as React from 'react';
import type { Holding, PortfolioScore } from '../types';
import { calculatePortfolioScore } from '../services/geminiService';
import { useApi } from '../contexts/ApiContext';
import Spinner from './icons/Spinner';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface WhatIfScenarioProps {
    holdings: Holding[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF6666', '#A0E7E5', '#B4F8C8', '#FBE7C6'];


const AllocationPie: React.FC<{ allocation: { name: string, value: number }[] }> = ({ allocation }) => (
    <div className="w-24 h-24 mx-auto">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={allocation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={2}>
                    {allocation.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    </div>
);


const WhatIfScenario: React.FC<WhatIfScenarioProps> = ({ holdings }) => {
    const [ticker, setTicker] = React.useState('');
    const [shares, setShares] = React.useState('');
    const [price, setPrice] = React.useState('');
    const [action, setAction] = React.useState<'Buy' | 'Sell'>('Buy');

    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [originalScore, setOriginalScore] = React.useState<PortfolioScore | null>(null);
    const [simulatedScore, setSimulatedScore] = React.useState<PortfolioScore | null>(null);

    const { apiMode, setApiMode } = useApi();

    React.useEffect(() => {
        // Calculate original score on mount
        const getOriginalScore = async () => {
            if (holdings.length > 0) {
                const score = await calculatePortfolioScore(holdings, apiMode);
                setOriginalScore(score);
            }
        };
        getOriginalScore();
    }, [holdings, apiMode]);

    const handleSimulate = async () => {
        setIsLoading(true);
        setError(null);
        setSimulatedScore(null);

        const sharesNum = parseFloat(shares);
        const priceNum = parseFloat(price);

        if (!ticker.trim() || isNaN(sharesNum) || sharesNum <= 0 || isNaN(priceNum) || priceNum <= 0) {
            setError("Please enter valid ticker, shares, and price.");
            setIsLoading(false);
            return;
        }

        try {
            const simulatedHoldings = JSON.parse(JSON.stringify(holdings));
            let existingHolding = simulatedHoldings.find((h: Holding) => h.ticker === ticker.toUpperCase());

            if (action === 'Buy') {
                if (existingHolding) {
                    existingHolding.costBasis += sharesNum * priceNum;
                    existingHolding.shares += sharesNum;
                    existingHolding.totalValue = existingHolding.shares * existingHolding.currentPrice; // Assume current price doesn't change for simulation
                } else {
                    // For simulation, we need a sector. We'll mark it as unknown.
                    existingHolding = {
                        ticker: ticker.toUpperCase(),
                        shares: sharesNum,
                        costBasis: sharesNum * priceNum,
                        currentPrice: priceNum,
                        totalValue: sharesNum * priceNum,
                        sector: 'Unknown',
                        companyName: ticker.toUpperCase()
                    };
                    simulatedHoldings.push(existingHolding);
                }
            } else { // Sell
                if (!existingHolding || existingHolding.shares < sharesNum) {
                    throw new Error("Cannot sell more shares than you own.");
                }
                const avgCost = existingHolding.costBasis / existingHolding.shares;
                existingHolding.costBasis -= sharesNum * avgCost;
                existingHolding.shares -= sharesNum;
                existingHolding.totalValue = existingHolding.shares * existingHolding.currentPrice;
            }

            const score = await calculatePortfolioScore(simulatedHoldings, apiMode);
            setSimulatedScore(score);

        } catch (err: any) {
             if(err.message.includes('QUOTA_EXCEEDED')) {
                setApiMode('opensource');
                setError("Live AI quota exceeded.");
             } else {
                 setError(err.message);
             }
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border shadow-lg">
            <h3 className="text-lg font-bold text-brand-text mb-2">"What-If" Scenario Tool</h3>
            <p className="text-xs text-brand-text-secondary mb-4">Simulate a trade to see its impact on your portfolio score.</p>
            <div className="space-y-3">
                <div className="flex gap-2">
                    <button onClick={() => setAction('Buy')} className={`w-1/2 p-2 rounded-lg text-sm font-semibold ${action === 'Buy' ? 'bg-green-600 text-white' : 'bg-brand-primary'}`}>Buy</button>
                    <button onClick={() => setAction('Sell')} className={`w-1/2 p-2 rounded-lg text-sm font-semibold ${action === 'Sell' ? 'bg-red-600 text-white' : 'bg-brand-primary'}`}>Sell</button>
                </div>
                <input type="text" value={ticker} onChange={e => setTicker(e.target.value)} placeholder="Ticker (e.g. AAPL)" className="w-full p-2 bg-brand-primary border border-brand-border rounded-lg text-sm"/>
                <div className="flex gap-2">
                    <input type="number" value={shares} onChange={e => setShares(e.target.value)} placeholder="Shares" className="w-1/2 p-2 bg-brand-primary border border-brand-border rounded-lg text-sm"/>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" className="w-1/2 p-2 bg-brand-primary border border-brand-border rounded-lg text-sm"/>
                </div>
                <button onClick={handleSimulate} disabled={isLoading} className="w-full p-2 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent-hover disabled:bg-brand-accent/50 flex items-center justify-center">
                    {isLoading ? <Spinner/> : "Simulate"}
                </button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            
            {(originalScore || simulatedScore) && (
                 <div className="mt-4 pt-4 border-t border-brand-border grid grid-cols-2 gap-4 text-center">
                     <div>
                         <h4 className="font-bold text-sm">BEFORE</h4>
                         <p className="text-2xl font-bold mt-2">{originalScore?.score || 'N/A'}</p>
                         <p className="text-xs text-brand-text-secondary">{originalScore?.summary}</p>
                     </div>
                      <div>
                         <h4 className="font-bold text-sm">AFTER</h4>
                         <p className="text-2xl font-bold mt-2">{simulatedScore?.score || '?'}</p>
                         <p className="text-xs text-brand-text-secondary">{simulatedScore?.summary || 'Run simulation'}</p>
                     </div>
                 </div>
            )}
        </div>
    );
};

export default WhatIfScenario;
