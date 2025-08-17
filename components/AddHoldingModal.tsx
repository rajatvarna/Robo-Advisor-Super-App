
import * as React from 'react';
import type { AddHoldingData } from '../types';
import Spinner from './icons/Spinner';
import CloseIcon from './icons/CloseIcon';

interface AddHoldingModalProps {
    onClose: () => void;
    onAddHolding: (holding: AddHoldingData) => Promise<void>;
}

const AddHoldingModal: React.FC<AddHoldingModalProps> = ({ onClose, onAddHolding }) => {
    const [ticker, setTicker] = React.useState('');
    const [shares, setShares] = React.useState('');
    const [purchasePrice, setPurchasePrice] = React.useState('');
    const [purchaseDate, setPurchaseDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const sharesNum = parseFloat(shares);
        const priceNum = parseFloat(purchasePrice);

        if (!ticker.trim() || isNaN(sharesNum) || sharesNum <= 0 || isNaN(priceNum) || priceNum < 0 || !purchaseDate) {
            setError("Please enter a valid ticker, shares, price, and date.");
            return;
        }

        setIsLoading(true);
        try {
            await onAddHolding({ 
                ticker: ticker.trim().toUpperCase(), 
                shares: sharesNum,
                purchasePrice: priceNum,
                purchaseDate: purchaseDate,
            });
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to add holding. Please check the ticker and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-brand-secondary rounded-lg shadow-2xl border border-brand-border w-full max-w-md p-6 relative"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 p-1 rounded-full text-brand-text-secondary hover:bg-brand-primary"
                    aria-label="Close modal"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-brand-text mb-4">Add Transaction</h2>
                <p className="text-sm text-brand-text-secondary mb-6">Enter the details of your stock purchase to add it to your portfolio.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="ticker" className="block text-sm font-medium text-brand-text-secondary mb-1">Stock Ticker</label>
                        <input
                            type="text"
                            id="ticker"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value)}
                            placeholder="e.g., AAPL"
                            className="w-full p-3 bg-brand-primary border border-brand-border rounded-lg text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent/75 transition"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="shares" className="block text-sm font-medium text-brand-text-secondary mb-1">Shares</label>
                            <input
                                type="number"
                                id="shares"
                                value={shares}
                                onChange={(e) => setShares(e.target.value)}
                                placeholder="e.g., 10.5"
                                step="any"
                                min="0"
                                className="w-full p-3 bg-brand-primary border border-brand-border rounded-lg text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent/75 transition"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="purchasePrice" className="block text-sm font-medium text-brand-text-secondary mb-1">Price per Share</label>
                            <input
                                type="number"
                                id="purchasePrice"
                                value={purchasePrice}
                                onChange={(e) => setPurchasePrice(e.target.value)}
                                placeholder="e.g., 150.25"
                                step="any"
                                min="0"
                                className="w-full p-3 bg-brand-primary border border-brand-border rounded-lg text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent/75 transition"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="purchaseDate" className="block text-sm font-medium text-brand-text-secondary mb-1">Purchase Date</label>
                        <input
                            type="date"
                            id="purchaseDate"
                            value={purchaseDate}
                            onChange={(e) => setPurchaseDate(e.target.value)}
                            className="w-full p-3 bg-brand-primary border border-brand-border rounded-lg text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent/75 transition"
                            disabled={isLoading}
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <div className="pt-2 flex justify-end">
                         <button
                            type="submit"
                            disabled={isLoading || !ticker || !shares || !purchasePrice || !purchaseDate}
                            className="w-full sm:w-auto px-6 py-3 font-semibold rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors flex items-center justify-center disabled:bg-brand-accent/50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Spinner /> : 'Add Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddHoldingModal;
