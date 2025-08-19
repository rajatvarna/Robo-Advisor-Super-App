

import * as React from 'react';
import GoogleIcon from './icons/GoogleIcon';
import GithubIcon from './icons/GithubIcon';
import FacebookIcon from './icons/FacebookIcon';
import Spinner from './icons/Spinner';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface HomeProps {
  onLogin: () => void;
}

type AuthView = 'login' | 'resetPassword' | 'resetSuccess';

const Home: React.FC<HomeProps> = ({ onLogin }) => {
  const [authenticatingService, setAuthenticatingService] = React.useState<string | null>(null);
  const [authView, setAuthView] = React.useState<AuthView>('login');

  const handleAuthAction = (e: React.MouseEvent | React.FormEvent, service: string) => {
    e.preventDefault();
    if (authenticatingService) return;

    setAuthenticatingService(service);

    setTimeout(() => {
      onLogin();
    }, 2000);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
      e.preventDefault();
      if (authenticatingService) return;
      setAuthenticatingService('reset');
      setTimeout(() => {
          setAuthenticatingService(null);
          setAuthView('resetSuccess');
      }, 2000);
  }

  const socialButtonClasses = "w-full flex items-center justify-center gap-3 p-3 rounded-lg bg-brand-primary hover:bg-brand-secondary border border-brand-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const mainButtonClasses = "w-full p-3 font-semibold rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors flex items-center justify-center disabled:bg-brand-accent/50 disabled:cursor-not-allowed";

  const renderLoginView = () => (
    <>
      <h2 className="text-2xl font-bold text-center text-brand-text mb-6">Get Started</h2>
      <div className="space-y-3">
        <button onClick={(e) => handleAuthAction(e, 'Google')} disabled={!!authenticatingService} className={socialButtonClasses}>
          {authenticatingService === 'Google' ? (<><Spinner /><span>Authenticating...</span></>) : (<><GoogleIcon className="w-5 h-5" /><span>Continue with Google</span></>)}
        </button>
        <button onClick={(e) => handleAuthAction(e, 'GitHub')} disabled={!!authenticatingService} className={socialButtonClasses}>
          {authenticatingService === 'GitHub' ? (<><Spinner /><span>Authenticating...</span></>) : (<><GithubIcon className="w-5 h-5" /><span>Continue with GitHub</span></>)}
        </button>
        <button onClick={(e) => handleAuthAction(e, 'Facebook')} disabled={!!authenticatingService} className={socialButtonClasses}>
          {authenticatingService === 'Facebook' ? (<><Spinner /><span>Authenticating...</span></>) : (<><FacebookIcon className="w-5 h-5" /><span>Continue with Facebook</span></>)}
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
          <input type="email" id="email" name="email" placeholder="you@example.com" disabled={!!authenticatingService} className="w-full p-3 bg-brand-primary border border-brand-border rounded-lg text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent/75 transition disabled:bg-brand-border/20 disabled:cursor-not-allowed" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-brand-text-secondary mb-1">Password</label>
          <input type="password" id="password" name="password" placeholder="••••••••" disabled={!!authenticatingService} className="w-full p-3 bg-brand-primary border border-brand-border rounded-lg text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent/75 transition disabled:bg-brand-border/20 disabled:cursor-not-allowed" />
        </div>
         <div className="text-right text-sm">
            <a href="#" onClick={(e) => { e.preventDefault(); setAuthView('resetPassword'); }} className="font-medium text-brand-accent hover:underline">
                Forgot password?
            </a>
        </div>
        <button type="submit" disabled={!!authenticatingService} className={mainButtonClasses}>
          {authenticatingService === 'Email' ? (<><Spinner /><span>Authenticating...</span></>) : (<span>Sign In / Register</span>)}
        </button>
      </form>
    </>
  );

  const renderResetPasswordView = () => (
    <>
      <h2 className="text-2xl font-bold text-center text-brand-text mb-2">Reset Password</h2>
      <p className="text-center text-sm text-brand-text-secondary mb-6">Enter your email to receive a reset link.</p>
       <form onSubmit={handlePasswordReset} className="space-y-4">
        <div>
          <label htmlFor="reset-email" className="block text-sm font-medium text-brand-text-secondary mb-1">Email address</label>
          <input type="email" id="reset-email" name="reset-email" required placeholder="you@example.com" disabled={!!authenticatingService} className="w-full p-3 bg-brand-primary border border-brand-border rounded-lg text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent/75 transition disabled:bg-brand-border/20 disabled:cursor-not-allowed" />
        </div>
        <button type="submit" disabled={!!authenticatingService} className={mainButtonClasses}>
          {authenticatingService === 'reset' ? (<><Spinner /><span>Sending...</span></>) : (<span>Send Reset Link</span>)}
        </button>
      </form>
      <div className="mt-4 text-center text-sm">
        <a href="#" onClick={(e) => { e.preventDefault(); setAuthView('login'); }} className="font-medium text-brand-accent hover:underline">
            &larr; Back to Login
        </a>
      </div>
    </>
  );

  const renderResetSuccessView = () => (
      <div className="text-center">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-brand-text mb-2">Check Your Inbox!</h2>
          <p className="text-brand-text-secondary mb-6">A password reset link has been sent to your email address (simulation).</p>
           <button onClick={() => setAuthView('login')} className="w-full p-3 font-semibold rounded-lg bg-brand-secondary text-brand-text hover:bg-brand-border border border-brand-border transition-colors">
            Back to Login
          </button>
      </div>
  );

  return (
    <div className="min-h-screen bg-brand-body-bg text-brand-text font-sans flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="text-center mb-10 max-w-3xl">
        <svg className="h-20 w-20 mx-auto mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="logo-gradient" x1="12" y1="2" x2="12" y2="23" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--color-brand-accent)"/>
                    <stop offset="1" stopColor="var(--color-brand-accent-hover)"/>
                </linearGradient>
            </defs>
            <path d="M12 2.25C12 2.25 4.5 4.5 4.5 11.25c0 6.188 6.188 9.75 7.5 10.5 1.313-.75 7.5-4.313 7.5-10.5C19.5 4.5 12 2.25 12 2.25z" fill="url(#logo-gradient)"/>
            <path d="M10.125 15l-3.375-3.375 1.05-1.05 2.325 2.325 5.175-5.175 1.05 1.05-6.225 6.225z" fill="white" opacity="0.95"/>
        </svg>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-brand-text tracking-tight">
          Your Personal AI <span className="text-brand-accent">Financial Co-pilot</span>
        </h1>
        <p className="mt-6 text-lg text-brand-text-secondary max-w-2xl mx-auto">
          Navigate the markets with confidence. Get personalized portfolio advice, deep-dive stock analysis, and automated insights—all in one place.
        </p>
      </div>

      <div className="w-full max-w-sm bg-brand-secondary p-8 rounded-xl shadow-2xl border border-brand-border">
          {authView === 'login' && renderLoginView()}
          {authView === 'resetPassword' && renderResetPasswordView()}
          {authView === 'resetSuccess' && renderResetSuccessView()}
      </div>

       <footer className="text-center p-4 mt-10 text-brand-text-secondary text-xs max-w-2xl">
          <p>By signing up, you agree to our Terms of Service and Privacy Policy. Financial data may be simulated by AI and should not be used for real investment decisions.</p>
        </footer>
    </div>
  );
};

export default Home;