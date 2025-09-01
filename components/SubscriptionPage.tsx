
import * as React from 'react';
import CheckCircleIcon from './icons/CheckCircleIcon';

const SubscriptionPage: React.FC = () => {

    const handleUpgrade = () => {
        // In a real app, this would trigger a payment flow (e.g., with Stripe)
        alert("Upgrade functionality is a simulation. In a real app, this would lead to a payment gateway.");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-brand-text text-center">Choose Your Plan</h1>
                <p className="mt-2 text-brand-text-secondary text-center">Unlock the full potential of your financial co-pilot.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Free Plan */}
                <div className="bg-brand-secondary p-8 rounded-lg border-2 border-brand-accent shadow-lg relative">
                    <span className="absolute top-4 right-4 text-xs font-bold bg-brand-accent text-white px-3 py-1 rounded-full">Current Plan</span>
                    <h2 className="text-2xl font-bold text-brand-text">Standard</h2>
                    <p className="text-brand-text-secondary mt-2">All essential tools included.</p>
                    <p className="text-4xl font-extrabold text-brand-text mt-6">$0<span className="text-lg font-medium text-brand-text-secondary">/month</span></p>
                    <ul className="mt-8 space-y-3 text-brand-text-secondary">
                        <li className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-green-500" />Portfolio Tracking</li>
                        <li className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-green-500" />In-Depth Stock Research</li>
                        <li className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-green-500" />Personalized News Feed</li>
                        <li className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-green-500" />Stock Screener</li>
                        <li className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-green-500" />Advanced Analytics</li>
                    </ul>
                </div>

                {/* Pro Plan */}
                <div className="bg-brand-secondary p-8 rounded-lg border-2 border-brand-border shadow-lg">
                    <h2 className="text-2xl font-bold text-brand-accent">Pro (Coming Soon)</h2>
                    <p className="text-brand-text-secondary mt-2">For professional investors.</p>
                    <p className="text-4xl font-extrabold text-brand-text mt-6">$49<span className="text-lg font-medium text-brand-text-secondary">/month</span></p>
                     <ul className="mt-8 space-y-3 text-brand-text-secondary">
                        <li className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-brand-accent" />Everything in Standard, plus:</li>
                        <li className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-brand-accent" />Advanced API Access</li>
                        <li className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-brand-accent" />Automated Strategy Backtesting</li>
                        <li className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-brand-accent" />Priority Support</li>
                    </ul>
                    <button 
                        disabled
                        className="w-full mt-8 p-3 font-semibold rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors disabled:bg-brand-secondary disabled:text-brand-text-secondary disabled:cursor-not-allowed"
                    >
                        Coming Soon
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPage;
