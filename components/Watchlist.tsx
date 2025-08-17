
import * as React from 'react';
import type { Holding } from '../types';
import StarSolidIcon from './icons/StarSolidIcon';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const WatchlistRow: React.FC<{ stock: Holding }> = React.memo(({ stock }) => {
    const [flashClass, setFlashClass] = React.useState('');
    const isPositive = stock.dayChange >= 0;

    React.useEffect(() => {
        if (stock.isUpdating) {
            setFlashClass(isPositive ? 'bg-green-500/20' : 'bg-red-500/20');
            const timer = setTimeout(() => setFlashClass(''), 500);
            return () => clearTimeout(timer);
        }
    }, [stock.isUpdating, stock.currentPrice, isPositive]);

    return (
        <tr className={`transition-colors duration-500 ${flashClass}`}>
            <td className="py-2 px-3 font-bold text-brand-text">{stock.ticker}</td>
            <td className="py-2 px-3 text-right tabular-nums text-brand-text">{formatCurrency(stock.currentPrice)}</td>
            <td className={`py-2 px-3 text-right tabular-nums font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {stock.dayChangePercent.toFixed(2)}%
            </td>
        </tr>
    );
});

const Watchlist: React.FC<{ stocks: Holding[] }> = ({ stocks }) => {
    return (
        <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border shadow-lg transition-shadow duration-300 hover:shadow-xl">
            <h3 className="text-lg font-bold text-brand-text mb-3 flex items-center gap-2">
                <StarSolidIcon className="w-5 h-5 text-yellow-400" />
                Watchlist
            </h3>
            {stocks.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                         <tbody className="divide-y divide-brand-border">
                            {stocks.map(stock => <WatchlistRow key={stock.ticker} stock={stock} />)}
                         </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-sm text-brand-text-secondary text-center py-4">Add stocks to your watchlist from the Research page to track them here.</p>
            )}
        </div>
    );
};

export default React.memo(Watchlist);