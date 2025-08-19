

import * as React from 'react';
import type { View } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import BellIcon from './icons/BellIcon';
import BotIcon from './icons/BotIcon';
import NewspaperIcon from './icons/NewspaperIcon';
import AnalyticsIcon from './icons/AnalyticsIcon';
import HeartIcon from './icons/HeartIcon';
import CryptoIcon from './icons/CryptoIcon';
import SettingsIcon from './icons/SettingsIcon';

// --- Helper Icons for Dropdowns ---
const TrendingUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
  </svg>
);
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.25 12h3.375a.375.375 0 0 1 .375.375v3.375a.375.375 0 0 1-.375.375h-3.375a.375.375 0 0 1-.375-.375v-3.375a.375.375 0 0 1 .375-.375ZM16.5 3.75h3.375a.375.375 0 0 1 .375.375v3.375a.375.375 0 0 1-.375.375h-3.375a.375.375 0 0 1-.375-.375V4.125a.375.375 0 0 1 .375-.375Z" />
  </svg>
);
const MoreIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
);
const ChartPieIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
  </svg>
);
const MagnifyingGlassIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);
const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);
const FilterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.572a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
  </svg>
);


// --- Main Header Components ---
interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
  onLogout: () => void;
  unreadAlertsCount: number;
}

const NavButton: React.FC<{
  view: View;
  currentView: View;
  setView: (view: View) => void;
  children: React.ReactNode;
  id?: string;
}> = ({ view, currentView, setView, children, id }) => (
  <button
    id={id}
    onClick={() => setView(view)}
    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      currentView === view
        ? 'bg-brand-accent text-white'
        : 'text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text'
    }`}
  >
    {children}
  </button>
);

const Dropdown: React.FC<{
    buttonContent: React.ReactNode;
    children: React.ReactNode;
    id?: string;
}> = ({ buttonContent, children, id }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                id={id}
                onClick={() => setIsOpen(!isOpen)}
                className="px-3 py-2 text-sm font-medium rounded-md transition-colors text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text flex items-center gap-1"
            >
                {buttonContent}
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
            {isOpen && (
                <div className="absolute mt-2 w-56 bg-brand-primary border border-brand-border rounded-lg shadow-lg z-20 animate-fade-in-up-fast">
                    <div className="p-2 space-y-1">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const DropdownLink: React.FC<{
    view: View;
    setView: (view: View) => void;
    icon: React.ReactNode;
    children: React.ReactNode;
}> = ({ view, setView, icon, children }) => (
    <button
        onClick={() => setView(view)}
        className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md text-brand-text hover:bg-brand-secondary"
    >
        <span className="text-brand-text-secondary">{icon}</span>
        <span>{children}</span>
    </button>
);


const Header: React.FC<HeaderProps> = ({ currentView, setView, onLogout, unreadAlertsCount }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="bg-brand-primary border-b border-brand-border sticky top-0 z-10 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left side: Logo and main navigation */}
                    <div className="flex items-center">
                        <div className="flex items-center flex-shrink-0 cursor-pointer" onClick={() => setView('dashboard')}>
                            <svg className="h-8 w-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="logo-gradient" x1="12" y1="2" x2="12" y2="23" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="var(--color-brand-accent)"/>
                                        <stop offset="1" stopColor="var(--color-brand-accent-hover)"/>
                                    </linearGradient>
                                </defs>
                                <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z" fill="url(#logo-gradient)"/>
                                <path d="M10.5 14.5l-3-3 1.41-1.41L10.5 11.67l4.59-4.59L16.5 8.5l-6 6z" fill="white" opacity="0.9"/>
                            </svg>
                            <span className="ml-2 text-xl font-bold tracking-tight text-brand-text">RoboAdvisor</span>
                        </div>
                        <nav className="hidden md:flex items-baseline ml-10 space-x-2">
                            <NavButton view="dashboard" currentView={currentView} setView={setView} id="dashboard-nav-link">Dashboard</NavButton>
                            <NavButton view="portfolio" currentView={currentView} setView={setView} id="portfolio-nav-link">Portfolio</NavButton>
                            <NavButton view="research" currentView={currentView} setView={setView} id="research-nav-link">Research</NavButton>
                            
                            <Dropdown buttonContent="Markets">
                               <DropdownLink view="news" setView={setView} icon={<NewspaperIcon className="w-5 h-5"/>}>Top News</DropdownLink>
                               <DropdownLink view="crypto" setView={setView} icon={<CryptoIcon className="w-5 h-5"/>}>Crypto</DropdownLink>
                            </Dropdown>

                             <Dropdown buttonContent="AI Tools" id="ai-tools-dropdown">
                               <DropdownLink view="advisor" setView={setView} icon={<SparklesIcon className="w-5 h-5"/>}>AI Advisor</DropdownLink>
                               <DropdownLink view="chatbot" setView={setView} icon={<BotIcon className="w-5 h-5"/>}>Chatbot</DropdownLink>
                               <DropdownLink view="screener" setView={setView} icon={<FilterIcon className="w-5 h-5"/>}>Stock Screener</DropdownLink>
                            </Dropdown>

                             <Dropdown buttonContent="More">
                                <DropdownLink view="analytics" setView={setView} icon={<AnalyticsIcon className="w-5 h-5"/>}>Analytics</DropdownLink>
                                <DropdownLink view="education" setView={setView} icon={<BookOpenIcon className="w-5 h-5"/>}>Education Hub</DropdownLink>
                                <DropdownLink view="integrations" setView={setView} icon={<SettingsIcon className="w-5 h-5"/>}>Integrations</DropdownLink>
                                <DropdownLink view="support" setView={setView} icon={<HeartIcon className="w-5 h-5"/>}>Support Us</DropdownLink>
                            </Dropdown>
                        </nav>
                    </div>

                    {/* Right side: Actions */}
                    <div className="flex items-center gap-3">
                        <button onClick={() => setView('alerts')} className="relative p-2 rounded-full text-brand-text-secondary hover:text-brand-text hover:bg-brand-secondary transition-colors" aria-label="View Alerts">
                            <BellIcon className="h-6 w-6" />
                            {unreadAlertsCount > 0 && (
                                <span className="absolute top-1 right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">{unreadAlertsCount}</span>
                                </span>
                            )}
                        </button>
                        <button onClick={toggleTheme} className="p-2 rounded-full text-brand-text-secondary hover:text-brand-text hover:bg-brand-secondary transition-colors" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                            {theme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
                        </button>
                        <button onClick={onLogout} className="text-sm font-medium text-brand-text-secondary hover:text-brand-text">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;