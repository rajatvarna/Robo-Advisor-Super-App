
import * as React from 'react';
import HeartIcon from './icons/HeartIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import Spinner from './icons/Spinner';

const DonationPage: React.FC = () => {
    const [amount, setAmount] = React.useState<number | string>(15);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);

    const handleAmountSelect = (value: number) => {
        setAmount(value);
    };

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || isSuccess) return;
        
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
        }, 2000); // Simulate network request
    }
    
    if(isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto animate-fade-in p-8 bg-brand-secondary rounded-lg border border-brand-border">
                <HeartIcon className="w-16 h-16 text-pink-500 mb-4" />
                <h1 className="text-3xl font-bold text-brand-text">Thank You!</h1>
                <p className="mt-2 text-brand-text-secondary">Your generous support helps us continue to build and improve this application. We couldn't do it without you!</p>
                 <button 
                    onClick={() => setIsSuccess(false)}
                    className="mt-6 px-6 py-2 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent-hover transition-colors"
                >
                    Make Another Donation
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
             <div>
                <h1 className="text-3xl font-bold text-brand-text flex items-center gap-3"><HeartIcon className="w-8 h-8 text-pink-500"/> Support Us</h1>
                <p className="mt-2 text-brand-text-secondary">Your contributions help us cover server costs, API fees, and continued development. Thank you for being a part of our journey!</p>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-brand-secondary p-8 rounded-lg border border-brand-border shadow-lg space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-brand-text mb-3">Choose an amount</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[5, 15, 25, 50].map(val => (
                            <button
                                type="button"
                                key={val}
                                onClick={() => handleAmountSelect(val)}
                                className={`p-4 rounded-lg font-bold text-center transition-colors border-2 ${amount === val ? 'bg-brand-accent border-brand-accent text-white' : 'bg-brand-primary border-brand-border hover:bg-brand-border'}`}
                            >
                                ${val}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="custom-amount" className="block text-sm font-medium text-brand-text-secondary mb-1">Or enter a custom amount</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-text-secondary">$</span>
                        <input
                            type="number"
                            id="custom-amount"
                            value={amount}
                            onChange={handleCustomAmountChange}
                            className="w-full pl-7 pr-3 py-2 bg-brand-primary border border-brand-border rounded-lg"
                            placeholder="e.g., 42"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-brand-border space-y-4">
                     <div>
                        <label htmlFor="card-number" className="block text-sm font-medium text-brand-text-secondary mb-1">Card Information (Simulation)</label>
                         <div className="relative">
                             <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-text-secondary"><CreditCardIcon className="w-5 h-5"/></span>
                            <input type="text" id="card-number" placeholder="4242 4242 4242 4242" className="w-full pl-10 pr-3 py-2 bg-brand-primary border border-brand-border rounded-lg" />
                        </div>
                    </div>
                     <div className="flex gap-4">
                        <div className="w-1/2">
                            <input type="text" placeholder="MM / YY" className="w-full p-2 bg-brand-primary border border-brand-border rounded-lg" />
                        </div>
                         <div className="w-1/2">
                            <input type="text" placeholder="CVC" className="w-full p-2 bg-brand-primary border border-brand-border rounded-lg" />
                        </div>
                    </div>
                </div>
                
                 <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 p-3 font-semibold rounded-lg bg-pink-600 hover:bg-pink-700 text-white transition-colors flex items-center justify-center disabled:bg-pink-600/50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <Spinner /> : `Donate $${amount}`}
                </button>
            </form>
        </div>
    );
};

export default DonationPage;
