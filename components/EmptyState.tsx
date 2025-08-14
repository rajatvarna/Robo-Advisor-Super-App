
import * as React from 'react';
import PlusIcon from './icons/PlusIcon';

interface EmptyStateProps {
    onPrimaryClick: () => void;
    onSecondaryClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onPrimaryClick, onSecondaryClick }) => {
  return (
    <div className="text-center flex flex-col items-center justify-center h-full min-h-[50vh] animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-brand-text-secondary opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h2 className="text-2xl font-bold text-brand-text mt-4">Your Portfolio is Empty</h2>
        <p className="text-lg mt-2 max-w-lg mx-auto text-brand-text-secondary">
            Get started by adding your first stock holding or generate a demo portfolio to see the app in action.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
                onClick={onPrimaryClick}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent-hover transition-colors"
            >
                <PlusIcon className="w-5 h-5" />
                Add a Holding
            </button>
            <button
                onClick={onSecondaryClick}
                className="px-6 py-3 bg-brand-secondary text-brand-text font-semibold rounded-lg border border-brand-border hover:bg-brand-border transition-colors"
            >
                Generate Demo Data
            </button>
        </div>
    </div>
  );
};

export default EmptyState;
