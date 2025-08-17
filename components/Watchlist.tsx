
import * as React from 'react';
import type { Quote, UserWatchlist } from '../types';
import StarSolidIcon from './icons/StarSolidIcon';
import ManageWatchlistsModal from './ManageWatchlistsModal';
import { tickers } from '../services/tickerData';

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
    onUpdateWatchlistTickers: (id: string, tickers: string[]) => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ watchlists, quotes, onUpdateWatchlistTickers, ...manageProps }) => {
    const [activeWatchlistId, setActiveWatchlistId] = React.useState<string | null>(null);
    const [isManageModalOpen, setIsManageModalOpen] = React.useState(false);
    const [newTicker, setNewTicker] = React.useState('');
    const [suggestions, setSuggestions] = React.useState<{ symbol: string; name: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const formRef = React.useRef<HTMLFormElement>(null);

    React.useEffect(() => {
        if (!activeWatchlistId && watchlists.length > 0) {
            setActiveWatchlistId(watchlists[0].id);
        }
        if (activeWatchlistId && !watchlists.some(w => w.id === activeWatchlistId)) {
            setActiveWatchlistId(watchlists[0]?.id || null);
        }
    }, [watchlists, activeWatchlistId]);
    
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
          if (formRef.current && !formRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
          }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [formRef]);

    const activeWatchlist = watchlists.find(w => w.id === activeWatchlistId);
    const stocks = activeWatchlist?.tickers.map(t => quotes[t]).filter(Boolean) || [];
    
    const handleAddTicker = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeWatchlist && newTicker.trim()) {
            const upperTicker = newTicker.trim().toUpperCase();
            if (!activeWatchlist.tickers.includes(upperTicker)) {
                const newTickers = [...activeWatchlist.tickers, upperTicker];
                onUpdateWatchlistTickers(activeWatchlist.id, newTickers);
            }
            setNewTicker('');
            setShowSuggestions(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewTicker(value);

        if (value.length > 0) {
          const filteredSuggestions = tickers
            .filter(t => t.symbol.toLowerCase().startsWith(value.toLowerCase()) || t.name.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 5);
          setSuggestions(filteredSuggestions);
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (ticker: string) => {
        setNewTicker(ticker);
        setShowSuggestions(false);
    };

    return (
        <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border shadow-lg transition-shadow duration-300 hover:shadow-xl flex flex-col h-full">
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

            <div className="flex-grow">
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
                             <p className="text-sm text-brand-text-secondary text-center py-4">This watchlist is empty. Add a ticker below.</p>
                        )}
                    </>
                ) : (
                    <p className="text-sm text-brand-text-secondary text-center py-4">Create your first watchlist to track stocks here.</p>
                )}
            </div>
            
            <div className="mt-auto">
                {activeWatchlist && (
                    <form onSubmit={handleAddTicker} className="mt-3 pt-3 border-t border-brand-border relative" ref={formRef}>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTicker}
                                onChange={handleInputChange}
                                onFocus={() => newTicker && setShowSuggestions(true)}
                                placeholder="Add ticker..."
                                className="w-full p-2 bg-brand-primary border border-brand-border rounded-lg text-sm"
                                autoComplete="off"
                            />
                            <button type="submit" className="px-4 py-2 bg-brand-accent text-white font-semibold rounded-lg text-sm disabled:opacity-50" disabled={!newTicker.trim()}>Add</button>
                        </div>
                        {showSuggestions && suggestions.length > 0 && (
                            <ul className="absolute bottom-full mb-1 z-10 w-full bg-brand-primary border border-brand-border rounded-lg overflow-hidden shadow-lg">
                                {suggestions.map(s => (
                                    <li
                                        key={s.symbol}
                                        onClick={() => handleSelectSuggestion(s.symbol)}
                                        className="px-3 py-2 cursor-pointer hover:bg-brand-accent hover:text-white"
                                    >
                                        <span className="font-bold">{s.symbol}</span>
                                        <span className="ml-2 text-xs text-brand-text-secondary">{s.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </form>
                )}
            </div>


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