import * as React from 'react';
import type { UserWatchlist } from '../types';
import CloseIcon from './icons/CloseIcon';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import XCircleIcon from './icons/XCircleIcon';

interface ManageWatchlistsModalProps {
    watchlists: UserWatchlist[];
    onClose: () => void;
    onAddWatchlist: (name: string) => void;
    onRenameWatchlist: (id: string, newName: string) => void;
    onDeleteWatchlist: (id: string) => void;
    onUpdateWatchlistTickers: (id: string, tickers: string[]) => void;
}

const ManageWatchlistsModal: React.FC<ManageWatchlistsModalProps> = ({ watchlists, onClose, onAddWatchlist, onRenameWatchlist, onDeleteWatchlist, onUpdateWatchlistTickers }) => {
    const [newWatchlistName, setNewWatchlistName] = React.useState('');
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editingName, setEditingName] = React.useState('');
    const [newTickerInputs, setNewTickerInputs] = React.useState<Record<string, string>>({});

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newWatchlistName.trim()) {
            onAddWatchlist(newWatchlistName.trim());
            setNewWatchlistName('');
        }
    };

    const handleStartEdit = (watchlist: UserWatchlist) => {
        setEditingId(watchlist.id);
        setEditingName(watchlist.name);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName('');
    };

    const handleSaveEdit = () => {
        if (editingId && editingName.trim()) {
            onRenameWatchlist(editingId, editingName.trim());
            handleCancelEdit();
        }
    };

    const handleAddTicker = (e: React.FormEvent, wl: UserWatchlist) => {
        e.preventDefault();
        const newTicker = newTickerInputs[wl.id]?.trim().toUpperCase();
        if (newTicker && !wl.tickers.includes(newTicker)) {
            onUpdateWatchlistTickers(wl.id, [...wl.tickers, newTicker]);
            setNewTickerInputs(prev => ({ ...prev, [wl.id]: '' }));
        }
    };

    const handleRemoveTicker = (wl: UserWatchlist, tickerToRemove: string) => {
        const newTickers = wl.tickers.filter(t => t !== tickerToRemove);
        onUpdateWatchlistTickers(wl.id, newTickers);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-brand-secondary rounded-lg shadow-2xl border border-brand-border w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full text-brand-text-secondary hover:bg-brand-primary" aria-label="Close modal">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-brand-text mb-4">Manage Watchlists</h2>
                
                <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newWatchlistName}
                        onChange={e => setNewWatchlistName(e.target.value)}
                        placeholder="New watchlist name..."
                        className="w-full p-2 bg-brand-primary border border-brand-border rounded-lg text-sm"
                    />
                    <button type="submit" className="px-4 py-2 bg-brand-accent text-white font-semibold rounded-lg text-sm" disabled={!newWatchlistName.trim()}>Add</button>
                </form>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {watchlists.map(wl => (
                        <details key={wl.id} className="bg-brand-primary rounded-md group border border-brand-border">
                             <summary className="flex items-center justify-between p-2 cursor-pointer list-none">
                                {editingId === wl.id ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={e => setEditingName(e.target.value)}
                                        className="w-full p-1 bg-brand-border rounded-md text-sm"
                                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                                        onBlur={handleSaveEdit}
                                        autoFocus
                                        onClick={e => e.stopPropagation()}
                                    />
                                ) : (
                                    <span className="text-brand-text">{wl.name}</span>
                                )}
                                <div className="flex items-center gap-2">
                                    {editingId === wl.id ? (
                                        <button onClick={handleSaveEdit} className="text-sm text-green-500 font-bold">Save</button>
                                    ) : (
                                        <button onClick={() => handleStartEdit(wl)} className="p-1 text-brand-text-secondary hover:text-brand-text"><EditIcon className="w-4 h-4" /></button>
                                    )}
                                    <button onClick={() => onDeleteWatchlist(wl.id)} className="p-1 text-brand-text-secondary hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </summary>
                             <div className="p-2 border-t border-brand-border" onClick={e => e.stopPropagation()}>
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {wl.tickers.length > 0 ? wl.tickers.map(ticker => (
                                        <div key={ticker} className="flex items-center gap-1 bg-brand-secondary text-brand-text px-2 py-0.5 rounded-full text-xs font-medium">
                                            <span>{ticker}</span>
                                            <button onClick={() => handleRemoveTicker(wl, ticker)} className="text-brand-text-secondary hover:text-red-500">
                                                <XCircleIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )) : <p className="text-xs text-brand-text-secondary italic">No tickers in this watchlist.</p>}
                                </div>
                                <form onSubmit={(e) => handleAddTicker(e, wl)} className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={newTickerInputs[wl.id] || ''}
                                        onChange={(e) => setNewTickerInputs(prev => ({...prev, [wl.id]: e.target.value.toUpperCase()}))}
                                        placeholder="Add Ticker"
                                        className="flex-grow p-1 bg-brand-border rounded-md text-sm text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-1 focus:ring-brand-accent"
                                        onClick={e => e.stopPropagation()}
                                        autoComplete="off"
                                    />
                                    <button type="submit" className="px-3 text-xs font-semibold rounded-md bg-brand-accent text-white disabled:opacity-50" disabled={!newTickerInputs[wl.id]?.trim()}>Add</button>
                                </form>
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ManageWatchlistsModal;