
import * as React from 'react';
import GoogleIcon from './icons/GoogleIcon';
import GithubIcon from './icons/GithubIcon';
import FacebookIcon from './icons/FacebookIcon';
import Spinner from './icons/Spinner';

interface HomeProps {
  onLogin: () => void;
}

const Home: React.FC<HomeProps> = ({ onLogin }) => {
  const [authenticatingService, setAuthenticatingService] = React.useState<string | null>(null);

  const handleAuthAction = (e: React.MouseEvent | React.FormEvent, service: string) => {
    e.preventDefault();
    if (authenticatingService) return; // Prevent multiple clicks while one is in progress

    setAuthenticatingService(service);

    // Simulate an API call for authentication
    setTimeout(() => {
      onLogin();
      // The component will unmount on successful login, so no need to reset state.
    }, 2000);
  };

  const socialButtonClasses = "w-full flex items-center justify-center gap-3 p-3 rounded-lg bg-brand-primary hover:bg-brand-secondary border border-brand-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const mainButtonClasses = "w-full p-3 font-semibold rounded-lg bg-brand-accent hover:bg-brand-accent-hover transition-colors flex items-center justify-center disabled:bg-brand-accent/50 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-brand-body-bg text-brand-text font-sans flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="text-center mb-10 max-w-3xl">
        <svg className="h-20 w-20 text-brand-accent mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15l3-3m-3 3l-3-3m3-3v6" />
        </svg>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-brand-text tracking-tight">
          Your Personal AI <span className="text-brand-accent">Financial Co-pilot</span>
        </h1>
        <p className="mt-6 text-lg text-brand-text-secondary max-w-2xl mx-auto">
          Navigate the markets with confidence. Get personalized portfolio advice, deep-dive stock analysis, and automated insights—all in one place.
        </p>
      </div>

      <div className="w-full max-w-sm bg-brand-secondary p-8 rounded-xl shadow-2xl border border-brand-border">
        <h2 className="text-2xl font-bold text-center text-brand-text mb-6">Get Started</h2>
        
        <div className="space-y-3">
          <button onClick={(e) => handleAuthAction(e, 'Google')} disabled={!!authenticatingService} className={socialButtonClasses}>
            {authenticatingService === 'Google' ? (
                <><Spinner /><span>Authenticating...</span></>
            ) : (
                <><GoogleIcon className="w-5 h-5" /><span>Continue with Google</span></>
            )}
          </button>
          <button onClick={(e) => handleAuthAction(e, 'GitHub')} disabled={!!authenticatingService} className={socialButtonClasses}>
             {authenticatingService === 'GitHub' ? (
                <><Spinner /><span>Authenticating...</span></>
            ) : (
                <><GithubIcon className="w-5 h-5" /><span>Continue with GitHub</span></>
            )}
          </button>
           <button onClick={(e) => handleAuthAction(e, 'Facebook')} disabled={!!authenticatingService} className={socialButtonClasses}>
            {authenticatingService === 'Facebook' ? (
                <><Spinner /><span>Authenticating...</span></>
            ) : (
                <><FacebookIcon className="w-5 h-5" /><span>Continue with Facebook</span></>
            )}
          </button>
        </div>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-t border-brand-border" />
          <span className="mx-4 text-xs text-brand-text-secondary">OR</span>
          <hr className="flex-grow border-t border-brand-border" />
        </div>

        <form onSubmit={(e) => handleAuthAction(e, 'Email')} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary mb-1">Email address</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              placeholder="you@example.com"
              disabled={!!authenticatingService}
              className="w-full p-3 bg-brand-primary border border-brand-border rounded-lg text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent/75 transition disabled:bg-brand-border/20 disabled:cursor-not-allowed" 
            />
          </div>
          <div>
             <label htmlFor="password" className="block text-sm font-medium text-brand-text-secondary mb-1">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password"
              placeholder="••••••••"
              disabled={!!authenticatingService}
              className="w-full p-3 bg-brand-primary border border-brand-border rounded-lg text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent/75 transition disabled:bg-brand-border/20 disabled:cursor-not-allowed"
            />
          </div>
          <button type="submit" disabled={!!authenticatingService} className={mainButtonClasses}>
             {authenticatingService === 'Email' ? (
                <><Spinner /><span>Authenticating...</span></>
            ) : (
                <span>Sign In / Register</span>
            )}
          </button>
        </form>
      </div>

       <footer className="text-center p-4 mt-10 text-brand-text-secondary text-xs max-w-2xl">
          <p>By signing up, you agree to our Terms of Service and Privacy Policy. Financial data may be simulated by AI and should not be used for real investment decisions.</p>
        </footer>
    </div>
  );
};

export default Home;