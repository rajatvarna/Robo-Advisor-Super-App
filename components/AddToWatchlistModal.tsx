
import * as React from 'react';
import type { UserWatchlist } from '../types';
import CloseIcon from './icons/CloseIcon';

interface AddToWatchlistModalProps {
    ticker: string;
    watchlists: UserWatchlist[];
    onClose: () => void;
    onUpdateWatchlistTickers: (id: string, tickers: string[]) => void;
    onAddWatchlist: (name: string) => void;
}

const AddToWatchlistModal: React.FC<AddToWatchlistModalProps> = ({ ticker, watchlists, onClose, onUpdateWatchlistTickers, onAddWatchlist }) => {
    const [selectedLists, setSelectedLists] = React.useState<Set<string>>(() => {
        const initialSelected = new Set<string>();
        watchlists.forEach(wl => {
            if (wl.tickers.includes(ticker)) {
                initialSelected.add(wl.id);
            }
        });
        return initialSelected;
    });
    const [newWatchlistName, setNewWatchlistName] = React.useState('');

    const handleToggle = (id: string) => {
        const newSelection = new Set(selectedLists);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedLists(newSelection);
    };

    const handleSave = () => {
        watchlists.forEach(wl => {
            const isSelected = selectedLists.has(wl.id);
            const hasTicker = wl.tickers.includes(ticker);

            if (isSelected && !hasTicker && wl.tickers.length < 100) {
                onUpdateWatchlistTickers(wl.id, [...wl.tickers, ticker]);
            } else if (!isSelected && hasTicker) {
                onUpdateWatchlistTickers(wl.id, wl.tickers.filter(t => t !== ticker));
            }
        });
        onClose();
    };

    const handleAddAndSelect = () => {
        if (newWatchlistName.trim()) {
            onAddWatchlist(newWatchlistName.trim());
            // This is a bit of a hack, but we assume the new watchlist is added to the end
            // A better solution would involve passing back the new watchlist ID
            setTimeout(() => {
                const newWl = watchlists.find(w => w.name === newWatchlistName.trim());
                if(newWl) {
                    onUpdateWatchlistTickers(newWl.id, [ticker]);
                }
                 onClose();
            }, 500);
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-brand-secondary rounded-lg shadow-2xl border border-brand-border w-full max-w-sm p-6 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full text-brand-text-secondary hover:bg-brand-primary" aria-label="Close modal">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold text-brand-text mb-4">Add {ticker} to...</h2>
                
                <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                    {watchlists.map(wl => (
                        <label key={wl.id} className="flex items-center p-2 bg-brand-primary rounded-md cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedLists.has(wl.id)}
                                onChange={() => handleToggle(wl.id)}
                                className="h-4 w-4 rounded border-brand-border text-brand-accent focus:ring-brand-accent"
                            />
                            <span className="ml-3 text-brand-text">{wl.name}</span>
                        </label>
                    ))}
                </div>

                <div className="flex gap-2 items-center pt-4 border-t border-brand-border">
                     <input
                        type="text"
                        value={newWatchlistName}
                        onChange={e => setNewWatchlistName(e.target.value)}
                        placeholder="Create new list..."
                        className="w-full p-2 bg-brand-primary border border-brand-border rounded-lg text-sm"
                    />
                    <button onClick={handleAddAndSelect} disabled={!newWatchlistName.trim()} className="px-4 py-2 bg-brand-primary border border-brand-border text-sm font-semibold rounded-lg disabled:opacity-50">Create</button>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={handleSave} className="px-6 py-2 bg-brand-accent text-white font-semibold rounded-lg">Done</button>
                </div>
            </div>
        </div>
    );
};

export default AddToWatchlistModal;
