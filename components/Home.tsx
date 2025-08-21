
import * as React from 'react';
import GoogleIcon from './icons/GoogleIcon';
import Spinner from './icons/Spinner';
import * as firebase from '../services/firebaseService';

const Home: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleAuthError = (err: any) => {
      console.error("Firebase Auth Error:", err);
      if (err.code) {
          switch (err.code) {
              case 'auth/user-not-found':
              case 'auth/wrong-password':
                  setError('Invalid credentials. Please check your email and password.');
                  break;
              case 'auth/email-already-in-use':
                  setError('This email is already in use. Please sign in or use a different email.');
                  break;
              case 'auth/weak-password':
                  setError('Password should be at least 6 characters.');
                  break;
              case 'auth/popup-closed-by-user':
                  setError(null); // User intentionally closed the popup, not an error
                  break;
              default:
                  setError('An unexpected error occurred. Please try again.');
          }
      } else {
          setError('An unexpected error occurred. Please try again.');
      }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading('email');
    setError(null);
    try {
        await firebase.signInWithEmail(email, password);
    } catch (err: any) {
         if (err.code === 'auth/user-not-found') {
            // If user not found, try to create an account
            try {
                await firebase.createAccountWithEmail(email, password);
            } catch (createErr: any) {
                handleAuthError(createErr);
            }
        } else {
            handleAuthError(err);
        }
    } finally {
        setIsLoading(null);
    }
  };
  
  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading('google');
    setError(null);
    try {
      await firebase.signInWithGoogle();
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(null);
    }
  };

  const socialButtonClasses = "w-full flex items-center justify-center gap-3 p-3 rounded-lg bg-brand-primary hover:bg-brand-secondary border border-brand-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const mainButtonClasses = "w-full p-3 font-semibold rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors flex items-center justify-center disabled:bg-brand-accent/50 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-brand-body-bg text-brand-text font-sans flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="text-center mb-10 max-w-3xl">
         <svg className="h-20 w-20 mx-auto mb-4" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="logo-gradient" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--color-brand-accent)"/>
                    <stop offset="1" stopColor="var(--color-brand-accent-hover)"/>
                </linearGradient>
            </defs>
            <path d="M16 4L4 28H28L16 4Z" fill="url(#logo-gradient)"/>
            <path d="M16 4L10 18H22L16 4Z" fill="white" opacity="0.3"/>
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
            <button onClick={handleGoogleSignIn} disabled={!!isLoading} className={socialButtonClasses}>
              {isLoading === 'google' ? (<><Spinner /><span>Signing in...</span></>) : (<><GoogleIcon className="w-5 h-5" /><span>Continue with Google</span></>)}
            </button>
          </div>
          <div className="flex items-center my-6">
            <hr className="flex-grow border-t border-brand-border" />
            <span className="mx-4 text-xs text-brand-text-secondary">OR</span>
            <hr className="flex-grow border-t border-brand-border" />
          </div>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary mb-1">Email address</label>
              <input type="email" id="email" name="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required disabled={!!isLoading} className="w-full p-3 bg-brand-primary border border-brand-border rounded-lg text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent/75 transition disabled:bg-brand-border/20 disabled:cursor-not-allowed" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-text-secondary mb-1">Password</label>
              <input type="password" id="password" name="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required disabled={!!isLoading} className="w-full p-3 bg-brand-primary border border-brand-border rounded-lg text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent/75 transition disabled:bg-brand-border/20 disabled:cursor-not-allowed" />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" disabled={!!isLoading} className={mainButtonClasses}>
              {isLoading === 'email' ? (<><Spinner /><span>Processing...</span></>) : (<span>Sign In / Sign Up</span>)}
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