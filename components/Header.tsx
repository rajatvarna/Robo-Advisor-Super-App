
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
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
);
const DotsHorizontalIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm.75 0a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.375 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm.75 0a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.375 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm.75 0a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
    </svg>
);


// --- Dropdown Components ---
const Dropdown: React.FC<{ title: React.ReactNode; children: React.ReactNode; id?: string }> = ({ title, children, id }) => {
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
        <div className="relative" ref={dropdownRef} id={id}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={(e) => {
                    // Small delay to allow moving mouse to dropdown content
                    setTimeout(() => {
                        if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget as Node)) {
                           setIsOpen(false);
                        }
                    }, 100);
                }}
                className="px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors duration-200 whitespace-nowrap flex items-center gap-1 text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text"
            >
                {title}
                <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div 
                    onClick={() => setIsOpen(false)}
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                    className="absolute right-0 mt-2 w-56 origin-top-right bg-brand-primary border border-brand-border rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 animate-fade-in-up-fast"
                >
                    <div className="py-1">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const DropdownLink: React.FC<{ onClick: () => void; children: React.ReactNode; isActive: boolean }> = ({ onClick, children, isActive }) => (
    <a
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-2 text-sm cursor-pointer ${
            isActive 
            ? 'bg-brand-accent text-white' 
            : 'text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text'
        }`}
    >
        {children}
    </a>
);


interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
  onLogout: () => void;
  unreadAlertsCount?: number;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, onLogout, unreadAlertsCount = 0 }) => {
  const { theme, toggleTheme } = useTheme();

  const navLinkClasses = (view: View) =>
    `px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors duration-200 whitespace-nowrap flex items-center gap-2 ${
      currentView === view
        ? 'bg-brand-accent text-white'
        : 'text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text'
    }`;

  return (
    <header className="bg-brand-primary border-b border-brand-border sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
               <svg className="h-9 w-9 text-brand-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15l3-3m-3 3l-3-3m3-3v6" />
              </svg>
            </div>
            <span className="ml-3 text-xl font-extrabold text-brand-text hidden sm:inline">Robo Advisor</span>
          </div>
          <div className="flex items-center">
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <a id="dashboard-nav-link" onClick={() => setView('dashboard')} className={navLinkClasses('dashboard')}>Dashboard</a>
              <a id="portfolio-nav-link" onClick={() => setView('portfolio')} className={navLinkClasses('portfolio')}>Portfolio</a>
              <a id="research-nav-link" onClick={() => setView('research')} className={navLinkClasses('research')}>Research</a>
              
              <Dropdown title={<div className="flex items-center gap-1"><TrendingUpIcon className="w-4 h-4" /> Markets</div>}>
                  <DropdownLink onClick={() => setView('news')} isActive={currentView === 'news'}><NewspaperIcon className="w-5 h-5"/> Top News</DropdownLink>
                  <DropdownLink onClick={() => setView('crypto')} isActive={currentView === 'crypto'}><CryptoIcon className="w-5 h-5"/> Crypto</DropdownLink>
                  <DropdownLink onClick={() => setView('screener')} isActive={currentView === 'screener'}><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1v-6z" /></svg> Screener</DropdownLink>
              </Dropdown>

              <Dropdown id="ai-tools-dropdown" title={<div className="flex items-center gap-1"><SparklesIcon className="w-4 h-4" /> AI Tools</div>}>
                  <DropdownLink onClick={() => setView('advisor')} isActive={currentView === 'advisor'}><BotIcon className="w-5 h-5"/> AI Advisor</DropdownLink>
                  <DropdownLink onClick={() => setView('analytics')} isActive={currentView === 'analytics'}><AnalyticsIcon className="w-5 h-5"/> Analytics</DropdownLink>
                  <DropdownLink onClick={() => setView('chatbot')} isActive={currentView === 'chatbot'}><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> Chatbot</DropdownLink>
              </Dropdown>
              
              <Dropdown title={<DotsHorizontalIcon className="w-5 h-5" />}>
                 <DropdownLink onClick={() => setView('education')} isActive={currentView === 'education'}><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg> Education Hub</DropdownLink>
                 <DropdownLink onClick={() => setView('integrations')} isActive={currentView === 'integrations'}><SettingsIcon className="w-5 h-5"/> Integrations</DropdownLink>
                 <DropdownLink onClick={() => setView('support')} isActive={currentView === 'support'}><HeartIcon className="w-5 h-5"/> Support</DropdownLink>
              </Dropdown>

            </nav>
            <button
                onClick={() => setView('alerts')}
                className="ml-4 p-2 rounded-full text-brand-text-secondary hover:bg-brand-secondary transition-colors relative"
                aria-label="View alerts"
            >
                <BellIcon className="w-5 h-5" />
                {unreadAlertsCount > 0 && (
                    <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-brand-primary" />
                )}
            </button>
            <button
                onClick={toggleTheme}
                className="ml-1 p-2 rounded-full text-brand-text-secondary hover:bg-brand-secondary transition-colors"
                aria-label="Toggle theme"
            >
                {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <button
              onClick={onLogout}
              className="ml-2 px-3 py-2 rounded-lg text-sm font-semibold border border-transparent text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text transition-colors duration-200 whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
