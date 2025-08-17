
import * as React from 'react';
import type { Quote, UserWatchlist } from '../types';
import StarSolidIcon from './icons/StarSolidIcon';
import ManageWatchlistsModal from './ManageWatchlistsModal';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const WatchlistRow: React.FC<{ stock: Quote }> = React.memo(({ stock }) => {
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

interface WatchlistProps {
    watchlists: UserWatchlist[];
    quotes: Record<string, Quote>;
    onAddWatchlist: (name: string) => void;
    onRenameWatchlist: (id: string, newName: string) => void;
    onDeleteWatchlist: (id: string) => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ watchlists, quotes, ...manageProps }) => {
    const [activeWatchlistId, setActiveWatchlistId] = React.useState<string | null>(null);
    const [isManageModalOpen, setIsManageModalOpen] = React.useState(false);

    React.useEffect(() => {
        if (!activeWatchlistId && watchlists.length > 0) {
            setActiveWatchlistId(watchlists[0].id);
        }
        if (activeWatchlistId && !watchlists.some(w => w.id === activeWatchlistId)) {
            setActiveWatchlistId(watchlists[0]?.id || null);
        }
    }, [watchlists, activeWatchlistId]);

    const activeWatchlist = watchlists.find(w => w.id === activeWatchlistId);
    const stocks = activeWatchlist?.tickers.map(t => quotes[t]).filter(Boolean) || [];

    return (
        <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border shadow-lg transition-shadow duration-300 hover:shadow-xl">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <StarSolidIcon className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-bold text-brand-text">Watchlists</h3>
                </div>
                <button 
                    onClick={() => setIsManageModalOpen(true)}
                    className="text-xs font-semibold text-brand-text-secondary hover:text-brand-text"
                >
                    Manage
                </button>
            </div>

            {watchlists.length > 0 && activeWatchlist ? (
                <>
                    <select
                        value={activeWatchlistId || ''}
                        onChange={(e) => setActiveWatchlistId(e.target.value)}
                        className="w-full p-2 mb-3 bg-brand-primary border border-brand-border rounded-lg text-sm text-brand-text focus:ring-2 focus:ring-brand-accent/50 focus:outline-none"
                    >
                        {watchlists.map(wl => (
                            <option key={wl.id} value={wl.id}>{wl.name}</option>
                        ))}
                    </select>
                    {stocks.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-brand-border">
                                    {stocks.map(stock => <WatchlistRow key={stock.ticker} stock={stock} />)}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                         <p className="text-sm text-brand-text-secondary text-center py-4">This watchlist is empty. Add stocks from the Research page.</p>
                    )}
                </>
            ) : (
                <p className="text-sm text-brand-text-secondary text-center py-4">Create your first watchlist to track stocks here.</p>
            )}

            {isManageModalOpen && (
                <ManageWatchlistsModal
                    watchlists={watchlists}
                    onClose={() => setIsManageModalOpen(false)}
                    {...manageProps}
                />
            )}
        </div>
    );
};

export default React.memo(Watchlist);
