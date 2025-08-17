
import * as React from 'react';
import type { InvestmentGoal } from '../types';
import CloseIcon from './icons/CloseIcon';

interface GoalSettingModalProps {
    onClose: () => void;
    onSetGoal: (goal: InvestmentGoal) => void;
}

const GoalSettingModal: React.FC<GoalSettingModalProps> = ({ onClose, onSetGoal }) => {
    const [goal, setGoal] = React.useState<InvestmentGoal['name']>('Wealth Building');
    const [targetAmount, setTargetAmount] = React.useState('');
    const [targetDate, setTargetDate] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(targetAmount);
        if (isNaN(amount) || amount <= 0 || !targetDate) {
            alert("Please enter a valid target amount and date.");
            return;
        }
        onSetGoal({
            name: goal,
            targetAmount: amount,
            targetDate,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-brand-secondary rounded-lg shadow-2xl border border-brand-border w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full text-brand-text-secondary hover:bg-brand-primary" aria-label="Close modal">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-brand-text mb-2">Set Your Investment Goal</h2>
                <p className="text-sm text-brand-text-secondary mb-6">Let's personalize your experience. What are you investing for?</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="goalName" className="block text-sm font-medium text-brand-text-secondary mb-1">Primary Goal</label>
                        <select
                            id="goalName"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value as InvestmentGoal['name'])}
                            className="w-full p-3 bg-brand-primary border border-brand-border rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/75"
                        >
                            <option>Wealth Building</option>
                            <option>Retirement</option>
                            <option>New Home</option>
                            <option>Education</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="targetAmount" className="block text-sm font-medium text-brand-text-secondary mb-1">Target Amount</label>
                            <input
                                type="number"
                                id="targetAmount"
                                value={targetAmount}
                                onChange={(e) => setTargetAmount(e.target.value)}
                                placeholder="e.g., 50000"
                                className="w-full p-3 bg-brand-primary border border-brand-border rounded-lg"
                            />
                        </div>
                        <div>
                            <label htmlFor="targetDate" className="block text-sm font-medium text-brand-text-secondary mb-1">Target Date</label>
                            <input
                                type="date"
                                id="targetDate"
                                value={targetDate}
                                onChange={(e) => setTargetDate(e.target.value)}
                                className="w-full p-3 bg-brand-primary border border-brand-border rounded-lg"
                            />
                        </div>
                    </div>
                    <div className="pt-2">
                        <button type="submit" className="w-full px-6 py-3 font-semibold rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white">Set Goal</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GoalSettingModal;
