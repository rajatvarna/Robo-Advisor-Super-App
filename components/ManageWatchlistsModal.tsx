
import * as React from 'react';
import type { UserWatchlist } from '../types';
import CloseIcon from './icons/CloseIcon';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';

interface ManageWatchlistsModalProps {
    watchlists: UserWatchlist[];
    onClose: () => void;
    onAddWatchlist: (name: string) => void;
    onRenameWatchlist: (id: string, newName: string) => void;
    onDeleteWatchlist: (id: string) => void;
}

const ManageWatchlistsModal: React.FC<ManageWatchlistsModalProps> = ({ watchlists, onClose, onAddWatchlist, onRenameWatchlist, onDeleteWatchlist }) => {
    const [newWatchlistName, setNewWatchlistName] = React.useState('');
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editingName, setEditingName] = React.useState('');

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
                        <div key={wl.id} className="flex items-center justify-between p-2 bg-brand-primary rounded-md">
                            {editingId === wl.id ? (
                                <input
                                    type="text"
                                    value={editingName}
                                    onChange={e => setEditingName(e.target.value)}
                                    className="w-full p-1 bg-brand-border rounded-md text-sm"
                                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                                    onBlur={handleSaveEdit}
                                    autoFocus
                                />
                            ) : (
                                <span className="text-brand-text">{wl.name}</span>
                            )}
                            <div className="flex items-center gap-2">
                                {editingId === wl.id ? (
                                    <button onClick={handleSaveEdit} className="text-green-500 font-bold">Save</button>
                                ) : (
                                    <button onClick={() => handleStartEdit(wl)} className="p-1 text-brand-text-secondary hover:text-brand-text"><EditIcon className="w-4 h-4" /></button>
                                )}
                                <button onClick={() => onDeleteWatchlist(wl.id)} className="p-1 text-brand-text-secondary hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ManageWatchlistsModal;
