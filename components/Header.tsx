

import * as React from 'react';
import type { View } from '../types';
import NewspaperIcon from './icons/NewspaperIcon';
import AnalyticsIcon from './icons/AnalyticsIcon';
import HeartIcon from './icons/HeartIcon';
import { useTheme } from '../contexts/ThemeContext';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import VideoIcon from './icons/VideoIcon';


interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, onLogout }) => {
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
              <a id="dashboard-nav-link" onClick={() => setView('dashboard')} className={navLinkClasses('dashboard')}>
                Dashboard
              </a>
               <a id="portfolio-nav-link" onClick={() => setView('portfolio')} className={navLinkClasses('portfolio')}>
                Portfolio
              </a>
               <a id="news-nav-link" onClick={() => setView('news')} className={navLinkClasses('news')}>
                <NewspaperIcon className="w-5 h-5" /> Top News
              </a>
              <a id="briefings-nav-link" onClick={() => setView('briefings')} className={navLinkClasses('briefings')}>
                <VideoIcon className="w-5 h-5" /> Video Briefings
              </a>
               <a id="analytics-nav-link" onClick={() => setView('analytics')} className={navLinkClasses('analytics')}>
                <AnalyticsIcon className="w-4 h-4" /> Analytics
              </a>
              <a id="research-nav-link" onClick={() => setView('research')} className={navLinkClasses('research')}>
                Research
              </a>
               <a onClick={() => setView('screener')} className={navLinkClasses('screener')}>
                Screener
              </a>
              <a id="advisor-nav-link" onClick={() => setView('advisor')} className={navLinkClasses('advisor')}>
                AI Advisor
              </a>
              <a id="chatbot-nav-link" onClick={() => setView('chatbot')} className={navLinkClasses('chatbot')}>
                Chatbot
              </a>
              <a onClick={() => setView('education')} className={navLinkClasses('education')}>
                Education
              </a>
              <a onClick={() => setView('support')} className={navLinkClasses('support')}>
                <HeartIcon className="w-4 h-4" /> Support
              </a>
            </nav>
            <button
                onClick={toggleTheme}
                className="ml-4 p-2 rounded-full text-brand-text-secondary hover:bg-brand-secondary transition-colors"
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