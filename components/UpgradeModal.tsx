
import * as React from 'react';
import CloseIcon from './icons/CloseIcon';
import CrownIcon from './icons/CrownIcon';

interface UpgradeModalProps {
    onClose: () => void;
    onUpgrade: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, onUpgrade }) => {
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-brand-secondary rounded-lg shadow-2xl border border-brand-border w-full max-w-md p-8 relative text-center"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 p-1 rounded-full text-brand-text-secondary hover:bg-brand-primary"
                    aria-label="Close modal"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
                <div className="w-16 h-16 mx-auto bg-brand-accent/20 text-brand-accent rounded-full flex items-center justify-center">
                    <CrownIcon className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-brand-text mt-4">Upgrade to Pro</h2>
                <p className="text-brand-text-secondary mt-2">This feature is part of our upcoming Pro plan. Explore our subscription options to see what's next.</p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 font-semibold rounded-lg bg-brand-primary border border-brand-border text-brand-text-secondary hover:bg-brand-border transition-colors"
                    >
                        Maybe Later
                    </button>
                    <button
                        onClick={onUpgrade}
                        className="w-full px-6 py-3 font-semibold rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors"
                    >
                        View Plans
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
