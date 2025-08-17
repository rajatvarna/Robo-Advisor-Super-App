

import * as React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import type { DashboardData, Holding, Transaction } from '../types';
import EmptyState from './EmptyState';
import PlusIcon from './icons/PlusIcon';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF6666', '#A0E7E5', '#B4F8C8', '#FBE7C6'];

type PortfolioTab = 'holdings' | 'transactions';

const HoldingRow: React.FC<{h: Holding}> = React.memo(({ h }) => {
    const [flashClass, setFlashClass] = React.useState('');
    
    React.useEffect(() => {
        if (h.isUpdating) {
            setFlashClass(h.dayChange >= 0 ? 'bg-green-500/20' : 'bg-red-500/20');
            const timer = setTimeout(() => setFlashClass(''), 500);
            return () => clearTimeout(timer);
        }
    }, [h.isUpdating, h.currentPrice, h.dayChange]);
    
    const isGain = h.unrealizedGain >= 0;

    return (
        <tr className={`transition-colors duration-500 hover:bg-brand-border/20 ${flashClass}`}>
            <td className="py-4 px-4 font-bold text-brand-accent">{h.ticker}</td>
            <td className="py-4 px-4 text-brand-text-secondary hidden md:table-cell">{h.companyName}</td>
            <td className="py-4 px-4 text-right tabular-nums text-brand-text">{h.shares.toFixed(2)}</td>
            <td className="py-4 px-4 text-right tabular-nums text-brand-text">{formatCurrency(h.currentPrice)}</td>
            <td className="py-4 px-4 text-right tabular-nums font-bold text-brand-text">{formatCurrency(h.totalValue)}</td>
            <td className={`py-4 px-4 text-right tabular-nums font-semibold ${isGain ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(h.unrealizedGain)} ({h.unrealizedGainPercent.toFixed(2)}%)
            </td>
        </tr>
    );
});

const TransactionRow: React.FC<{ tx: Transaction }> = React.memo(({ tx }) => (
    <tr className="hover:bg-brand-border/20">
        <td className="py-3 px-4 text-brand-text-secondary">{new Date(tx.date).toLocaleDateString()}</td>
        <td className={`py-3 px-4 font-semibold ${tx.type === 'Buy' ? 'text-green-500' : 'text-red-500'}`}>{tx.type}</td>
        <td className="py-3 px-4 font-bold text-brand-accent">{tx.ticker}</td>
        <td className="py-3 px-4 text-right tabular-nums text-brand-text">{tx.shares}</td>
        <td className="py-3 px-4 text-right tabular-nums text-brand-text">{formatCurrency(tx.price)}</td>
        <td className="py-3 px-4 text-right tabular-nums text-brand-text">{formatCurrency(tx.totalValue)}</td>
    </tr>
));


const PortfolioPage: React.FC<{ data: DashboardData | null; onGenerateDemo: () => void; onAddHolding: () => void; }> = ({ data, onGenerateDemo, onAddHolding }) => {
  const [activeTab, setActiveTab] = React.useState<PortfolioTab>('holdings');

  if (!data || data.holdings.length === 0) {
    return <EmptyState onPrimaryClick={onAddHolding} onSecondaryClick={onGenerateDemo} />;
  }

  const { holdings, allocation, transactions } = data;

  const renderContent = () => {
    if (activeTab === 'holdings') {
        return (
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-brand-text-secondary uppercase bg-brand-primary">
                        <tr>
                            <th className="py-3 px-4">Symbol</th>
                            <th className="py-3 px-4 hidden md:table-cell">Company</th>
                            <th className="py-3 px-4 text-right">Shares</th>
                            <th className="py-3 px-4 text-right">Price</th>
                            <th className="py-3 px-4 text-right">Total Value</th>
                            <th className="py-3 px-4 text-right">Unrealized Gain</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {holdings.map(h => <HoldingRow key={h.ticker} h={h} />)}
                    </tbody>
                </table>
            </div>
        );
    }
    if (activeTab === 'transactions') {
        return (
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-brand-text-secondary uppercase bg-brand-primary">
                        <tr>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Symbol</th>
                            <th className="py-3 px-4 text-right">Shares</th>
                            <th className="py-3 px-4 text-right">Price</th>
                            <th className="py-3 px-4 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
                    </tbody>
                </table>
            </div>
        );
    }
  };

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
                 <div className="p-4 border-b border-brand-border">
                    <div className="flex gap-4">
                       <button onClick={() => setActiveTab('holdings')} className={`pb-2 border-b-2 text-sm font-semibold ${activeTab === 'holdings' ? 'text-brand-accent border-brand-accent' : 'text-brand-text-secondary border-transparent hover:text-brand-text'}`}>Holdings</button>
                       <button onClick={() => setActiveTab('transactions')} className={`pb-2 border-b-2 text-sm font-semibold ${activeTab === 'transactions' ? 'text-brand-accent border-brand-accent' : 'text-brand-text-secondary border-transparent hover:text-brand-text'}`}>Transactions</button>
                    </div>
                </div>
                {renderContent()}
            </div>
            <div className="bg-brand-secondary p-6 rounded-lg border border-brand-border shadow-lg transition-shadow duration-300 hover:shadow-xl">
                <h2 className="text-xl font-bold mb-4">Sector Allocation</h2>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={allocation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                {allocation.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                             <Tooltip formatter={(value, name) => [`${(value as number).toFixed(1)}%`, name]} contentStyle={{ backgroundColor: 'var(--color-brand-primary)', borderColor: 'var(--color-brand-border)' }}/>
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
