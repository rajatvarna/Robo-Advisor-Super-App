
import * as React from 'react';
import type { View } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import NewspaperIcon from './icons/NewspaperIcon';
import AnalyticsIcon from './icons/AnalyticsIcon';
import HeartIcon from './icons/HeartIcon';
import CryptoIcon from './icons/CryptoIcon';
import SettingsIcon from './icons/SettingsIcon';
import CrownIcon from './icons/CrownIcon';

const MagnifyingGlassIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const Dropdown: React.FC<{ title: string; children: React.ReactNode; id?: string; }> = ({ title, children, id }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    return (
        <div className="relative" ref={ref} id={id}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-brand-text-secondary hover:text-brand-text hover:bg-brand-secondary rounded-md"
            >
                {title}
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div className="absolute z-30 mt-2 w-56 origin-top-right bg-brand-primary border border-brand-border rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 animate-fade-in-up-fast">
                    <div className="py-1">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const NavLink: React.FC<{ view: View, currentView: View, setView: (view: View) => void, children: React.ReactNode, id?: string }> = ({ view, currentView, setView, children, id }) => (
    <a
        href="#"
        id={id}
        onClick={(e) => { e.preventDefault(); setView(view); }}
        className={`block px-4 py-2 text-sm ${currentView === view ? 'bg-brand-accent/10 text-brand-accent' : 'text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text'}`}
    >
        {children}
    </a>
);

interface HeaderProps {
    currentView: View;
    setView: (view: View) => void;
    onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, onSignOut }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="bg-brand-primary border-b border-brand-border sticky top-0 z-20 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <a href="#" onClick={(e) => { e.preventDefault(); setView('dashboard'); }} className="flex items-center gap-2 text-xl font-bold text-brand-text">
                             <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="logo-gradient-header" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="var(--color-brand-accent)"/>
                                        <stop offset="1" stopColor="var(--color-brand-accent-hover)"/>
                                    </linearGradient>
                                </defs>
                                <path d="M16 4L4 28H28L16 4Z" fill="url(#logo-gradient-header)"/>
                                <path d="M16 4L10 18H22L16 4Z" fill="white" opacity="0.3"/>
                            </svg>
                            <span>RoboAdvisor</span>
                        </a>
                        <nav className="hidden md:flex items-center gap-2">
                            <a id="dashboard-nav-link" href="#" onClick={(e) => { e.preventDefault(); setView('dashboard'); }} className={`px-3 py-2 text-sm font-semibold rounded-md ${currentView === 'dashboard' ? 'text-brand-accent' : 'text-brand-text-secondary hover:text-brand-text'}`}>Dashboard</a>
                            <a id="portfolio-nav-link" href="#" onClick={(e) => { e.preventDefault(); setView('portfolio'); }} className={`px-3 py-2 text-sm font-semibold rounded-md ${currentView === 'portfolio' ? 'text-brand-accent' : 'text-brand-text-secondary hover:text-brand-text'}`}>Portfolio</a>
                            <a id="research-nav-link" href="#" onClick={(e) => { e.preventDefault(); setView('research'); }} className={`px-3 py-2 text-sm font-semibold rounded-md ${currentView === 'research' ? 'text-brand-accent' : 'text-brand-text-secondary hover:text-brand-text'}`}>Research</a>
                            <a id="screener-nav-link" href="#" onClick={(e) => { e.preventDefault(); setView('screener'); }} className={`px-3 py-2 text-sm font-semibold rounded-md ${currentView === 'screener' ? 'text-brand-accent' : 'text-brand-text-secondary hover:text-brand-text'}`}>Screener</a>
                            
                             <Dropdown title="Markets">
                                <NavLink view="news" currentView={currentView} setView={setView}><NewspaperIcon className="inline w-4 h-4 mr-2" /> Top News</NavLink>
                                <NavLink view="crypto" currentView={currentView} setView={setView}><CryptoIcon className="inline w-4 h-4 mr-2" /> Crypto</NavLink>
                            </Dropdown>

                            <Dropdown title="More">
                                <NavLink view="analytics" currentView={currentView} setView={setView}><AnalyticsIcon className="inline w-4 h-4 mr-2" /> Analytics</NavLink>
                                <NavLink view="integrations" currentView={currentView} setView={setView}><SettingsIcon className="inline w-4 h-4 mr-2" /> Integrations</NavLink>
                                <NavLink view="subscription" currentView={currentView} setView={setView}><CrownIcon className="inline w-4 h-4 mr-2" /> Subscription</NavLink>
                                <NavLink view="support" currentView={currentView} setView={setView}><HeartIcon className="inline w-4 h-4 mr-2" /> Support Us</NavLink>
                            </Dropdown>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={toggleTheme} className="p-2 text-brand-text-secondary hover:text-brand-text hover:bg-brand-secondary rounded-full">
                            {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                        </button>
                        <button onClick={onSignOut} className="text-sm font-semibold text-brand-text-secondary hover:text-brand-text">Sign Out</button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
