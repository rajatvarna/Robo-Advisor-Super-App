
import * as React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import type { DashboardData, Holding } from '../types';
import EmptyState from './EmptyState';
import PlusIcon from './icons/PlusIcon';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF6666', '#A0E7E5', '#B4F8C8', '#FBE7C6'];

interface PortfolioPageProps {
  data: DashboardData | null;
  onGenerateDemo: () => void;
  onAddHolding: () => void;
}

const HoldingRow: React.FC<{h: Holding}> = React.memo(({ h }) => {
    const [flashClass, setFlashClass] = React.useState('');
    
    React.useEffect(() => {
        if (h.isUpdating) {
            const priceNow = h.currentPrice;
            const priceBefore = h.currentPrice - h.dayChange; // This isn't perfect, but gives us direction
            setFlashClass(priceNow > priceBefore ? 'bg-green-500/20' : 'bg-red-500/20');
            const timer = setTimeout(() => setFlashClass(''), 500);
            return () => clearTimeout(timer);
        }
    }, [h.isUpdating, h.currentPrice, h.dayChange]);

    return (
        <tr className={`transition-colors duration-500 hover:bg-brand-border/20 ${flashClass}`}>
            <td className="py-4 px-4 font-bold text-brand-accent">{h.ticker}</td>
            <td className="py-4 px-4 text-brand-text-secondary">{h.companyName}</td>
            <td className="py-4 px-4 text-right tabular-nums text-brand-text">{h.shares.toFixed(2)}</td>
            <td className="py-4 px-4 text-right tabular-nums text-brand-text">{formatCurrency(h.currentPrice)}</td>
            <td className={`py-4 px-4 text-right tabular-nums font-semibold ${h.dayChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {h.dayChange.toFixed(2)} ({h.dayChangePercent.toFixed(2)}%)
            </td>
            <td className="py-4 px-4 text-right tabular-nums font-bold text-brand-text">{formatCurrency(h.totalValue)}</td>
        </tr>
    );
});

const PortfolioPage: React.FC<PortfolioPageProps> = ({ data, onGenerateDemo, onAddHolding }) => {
  if (!data || data.holdings.length === 0) {
    return <EmptyState onPrimaryClick={onAddHolding} onSecondaryClick={onGenerateDemo} />;
  }

  const { holdings, allocation } = data;

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-brand-text">My Portfolio</h1>
            <button 
                onClick={onAddHolding}
                className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent-hover transition-colors"
            >
                <PlusIcon className="w-5 h-5" />
                Add Holding
            </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-brand-secondary rounded-lg border border-brand-border shadow-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-brand-text-secondary uppercase bg-brand-primary">
                            <tr>
                                <th className="py-3 px-4">Symbol</th>
                                <th className="py-3 px-4">Company</th>
                                <th className="py-3 px-4 text-right">Shares</th>
                                <th className="py-3 px-4 text-right">Price</th>
                                <th className="py-3 px-4 text-right">Day's Change</th>
                                <th className="py-3 px-4 text-right">Total Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {holdings.map(h => <HoldingRow key={h.ticker} h={h} />)}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="bg-brand-secondary p-6 rounded-lg border border-brand-border shadow-lg transition-shadow duration-300 hover:shadow-xl">
                <h2 className="text-xl font-bold mb-4">Sector Allocation</h2>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={allocation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                {allocation.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                             <Tooltip formatter={(value, name) => [`${(value as number).toFixed(1)}%`, name]} contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D' }}/>
                            <Legend wrapperStyle={{fontSize: "12px"}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
};

export default PortfolioPage;