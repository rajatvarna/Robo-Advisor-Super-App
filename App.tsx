
import * as React from 'react';
import Header from './components/Header';
import RoboAdvisor from './components/RoboAdvisor';
import ResearchPage from './components/ResearchPage';
import EducationHub from './components/EducationHub';
import Chatbot from './components/Chatbot';
import Home from './components/Home';
import Screener from './components/Screener';
import DashboardPage from './components/DashboardPage';
import PortfolioPage from './components/PortfolioPage';
import BriefingsPage from './components/BriefingsPage';
import AnalyticsPage from './components/AnalyticsPage';
import AddHoldingModal from './components/AddHoldingModal';
import AchievementToast from './components/AchievementToast';
import Spinner from './components/icons/Spinner';
import { generateDashboardData, fetchStockDetailsForPortfolio, fetchUpdatedPrices, generatePersonalizedNews, calculatePortfolioScore, checkForAchievements } from './services/geminiService';
import type { View, DashboardData, Holding, Transaction, UserHolding, Achievement } from './types';
import { ApiProvider, useApi } from './contexts/ApiContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ApiStatusBanner from './components/ApiStatusBanner';
import DonationPage from './components/DonationPage';
import { ALL_ACHIEVEMENTS } from './services/fallbackData';
import OnboardingTour from './components/OnboardingTour';


const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [view, setView] = React.useState<View>('dashboard');
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  const [watchlist, setWatchlist] = React.useState<string[]>([]);
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [lastUnlockedAchievement, setLastUnlockedAchievement] = React.useState<Achievement | null>(null);
  const [runTour, setRunTour] = React.useState(false);

  const { apiMode, setApiMode, isFallbackMode } = useApi();

  // --- PERSISTENCE ---
  React.useEffect(() => {
    const savedAuth = localStorage.getItem('robo-advisor-authenticated');
    if (savedAuth === 'true') {
      const savedData = localStorage.getItem('robo-advisor-data');
      const savedWatchlist = localStorage.getItem('robo-advisor-watchlist');
      const savedAchievements = localStorage.getItem('robo-advisor-achievements');
      if (savedData) {
        setDashboardData(JSON.parse(savedData));
      }
      if (savedWatchlist) {
        setWatchlist(JSON.parse(savedWatchlist));
      }
      if (savedAchievements) {
        setAchievements(JSON.parse(savedAchievements));
      }
      setIsAuthenticated(true);
    }
  }, []);

  const saveDataToLocalStorage = React.useCallback((data: DashboardData | null, wl: string[], ach: Achievement[]) => {
    if(data) localStorage.setItem('robo-advisor-data', JSON.stringify(data));
    localStorage.setItem('robo-advisor-watchlist', JSON.stringify(wl));
    localStorage.setItem('robo-advisor-achievements', JSON.stringify(ach));
  }, []);

  // --- REAL-TIME PRICE SIMULATION ---
  React.useEffect(() => {
    const interval = setInterval(async () => {
      if (isAuthenticated && dashboardData && dashboardData.holdings.length > 0) {
        try {
            const holdingsToUpdate = [...dashboardData.holdings, ...(dashboardData.watchlist || [])];
            if (holdingsToUpdate.length === 0) return;
            
            const updatedPrices = await fetchUpdatedPrices(holdingsToUpdate.map(h => ({ ticker: h.ticker, currentPrice: h.currentPrice })), apiMode);
            
            setDashboardData(prevData => {
                if (!prevData) return null;

                const updateItem = (item: Holding): Holding => {
                    const update = updatedPrices.find(p => p.ticker === item.ticker);
                    if (update && update.currentPrice !== item.currentPrice) {
                        const previousClose = item.currentPrice - item.dayChange;
                        const newDayChange = update.currentPrice - previousClose;
                        const newDayChangePercent = previousClose !== 0 ? (newDayChange / previousClose) * 100 : 0;
                        
                        return { 
                            ...item,
                            currentPrice: update.currentPrice,
                            dayChange: newDayChange,
                            dayChangePercent: newDayChangePercent,
                            totalValue: update.currentPrice * (item.shares || 0), // Watchlist items have 0 shares
                            isUpdating: true,
                        };
                    }
                    return {...item, isUpdating: false};
                };

                const updatedHoldings = prevData.holdings.map(updateItem);
                const updatedWatchlist = (prevData.watchlist || []).map(updateItem);
                const newNetWorth = updatedHoldings.reduce((sum, h) => sum + h.totalValue, 0);

                return {
                    ...prevData,
                    netWorth: newNetWorth,
                    holdings: updatedHoldings,
                    watchlist: updatedWatchlist,
                };
            });

        } catch(err: any) {
            console.error("Failed to fetch price updates:", err);
            if(err.message.includes('QUOTA_EXCEEDED')) setApiMode('opensource');
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, dashboardData, apiMode, setApiMode]);
  
  // --- USER ACTIONS ---
  const handleLogin = React.useCallback(() => {
    setIsAuthenticated(true);
    localStorage.setItem('robo-advisor-authenticated', 'true');
    setView('dashboard');
  }, []);
  
  const handleLogout = React.useCallback(() => {
    setIsAuthenticated(false);
    setDashboardData(null);
    setWatchlist([]);
    setAchievements([]);
    localStorage.clear();
    setView('dashboard');
  }, []);

  const checkAndUnlockAchievements = React.useCallback(async (action: string, data: any) => {
    const unlockedAchievementIds = achievements.filter(a => a.unlocked).map(a => a.id);
    try {
        const newAchievements = await checkForAchievements(action, data, unlockedAchievementIds, apiMode);
        if (newAchievements.length > 0) {
          setAchievements(prev => {
              const updatedAchievements = prev.map(pa => {
                  const found = newAchievements.find(na => na.id === pa.id);
                  return found ? { ...pa, unlocked: true, unlockedAt: new Date().toISOString() } : pa;
              });
              setLastUnlockedAchievement(updatedAchievements.find(a => a.id === newAchievements[0].id)!);
              saveDataToLocalStorage(dashboardData, watchlist, updatedAchievements);
              return updatedAchievements;
          });
        }
    } catch(err: any) {
         if(err.message.includes('QUOTA_EXCEEDED')) setApiMode('opensource');
         else console.error("Achievement check failed:", err.message);
    }
  }, [achievements, apiMode, setApiMode, dashboardData, watchlist, saveDataToLocalStorage]);

  const handleGenerateDemoData = React.useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const baseData = await generateDashboardData(apiMode);
        
        const netWorth = baseData.holdings.reduce((sum, h) => sum + h.totalValue, 0);

        const allocationMap = new Map<string, number>();
        baseData.holdings.forEach(h => {
            const sector = h.sector || 'Stocks';
            allocationMap.set(sector, (allocationMap.get(sector) || 0) + h.totalValue);
        });
        const allocation = netWorth > 0 ? Array.from(allocationMap.entries()).map(([name, value]) => ({
            name,
            value: (value / netWorth) * 100,
        })) : [];

        const initializedAchievements = ALL_ACHIEVEMENTS.map(a => 
            a.id === 'first_login' ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() } : a
        );

        const fullData: DashboardData = {
            ...baseData,
            netWorth,
            allocation,
            portfolioPerformance: [{ date: new Date().toISOString().split('T')[0], price: netWorth }],
            personalizedNews: [],
            portfolioScore: { score: 0, summary: "" },
            achievements: initializedAchievements,
        };

        setDashboardData(fullData);
        setWatchlist(fullData.watchlist?.map(w => w.ticker) || []);
        setAchievements(fullData.achievements);
        saveDataToLocalStorage(fullData, fullData.watchlist?.map(w => w.ticker) || [], fullData.achievements);

        const tourCompleted = localStorage.getItem('robo-advisor-tour-completed');
        if (!tourCompleted) {
          setTimeout(() => setRunTour(true), 500); // Delay to allow UI to render
        }

      } catch (err: any) {
        if (err.message.includes('QUOTA_EXCEEDED')) {
            setApiMode('opensource');
            setError('Live AI quota exceeded. Switched to offline fallback mode.');
        } else {
            setError(err.message || 'Failed to load demo data. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
  }, [apiMode, setApiMode, saveDataToLocalStorage]);

  const handleTourEnd = React.useCallback(() => {
    setRunTour(false);
    localStorage.setItem('robo-advisor-tour-completed', 'true');
  }, []);
  
  const handleAddHolding = React.useCallback(async (userHolding: UserHolding) => {
      const stockDetails = await fetchStockDetailsForPortfolio(userHolding.ticker, apiMode);

      const newHolding: Holding = {
          ...stockDetails,
          shares: userHolding.shares,
          totalValue: stockDetails.currentPrice * userHolding.shares,
      };

      const newTransaction: Transaction = {
           id: `txn-${Date.now()}`,
           date: new Date().toISOString().split('T')[0],
           type: 'Buy',
           ticker: newHolding.ticker,
           companyName: newHolding.companyName,
           shares: newHolding.shares,
           price: newHolding.currentPrice,
           totalValue: newHolding.totalValue,
      };

      let updatedData: DashboardData | undefined;
      setDashboardData(prevData => {
          if (!prevData) {
              const netWorth = newHolding.totalValue;
              updatedData = {
                  user: { name: isFallbackMode ? 'Demo User' : 'Valued User', email: 'user@example.com', memberSince: new Date().toISOString().split('T')[0] },
                  holdings: [newHolding],
                  transactions: [newTransaction],
                  netWorth: netWorth,
                  allocation: [{ name: newHolding.sector || 'Stocks', value: 100 }],
                  portfolioPerformance: [{ date: new Date().toISOString().split('T')[0], price: netWorth }],
                  watchlist: [],
                  personalizedNews: [],
                  portfolioScore: { score: 0, summary: ""},
                  achievements: ALL_ACHIEVEMENTS,
              };
               return updatedData;
          }

          const updatedHoldings = [...prevData.holdings, newHolding];
          const updatedNetWorth = updatedHoldings.reduce((sum, h) => sum + h.totalValue, 0);
          
          const allocationMap = new Map<string, number>();
          updatedHoldings.forEach(h => {
              const sector = h.sector || 'Stocks';
              allocationMap.set(sector, (allocationMap.get(sector) || 0) + h.totalValue);
          });
          const updatedAllocation = Array.from(allocationMap.entries()).map(([name, value]) => ({
              name,
              value: (value / updatedNetWorth) * 100,
          }));

          updatedData = {
              ...prevData,
              holdings: updatedHoldings,
              transactions: [newTransaction, ...prevData.transactions],
              netWorth: updatedNetWorth,
              allocation: updatedAllocation,
              portfolioPerformance: [...prevData.portfolioPerformance, {date: new Date().toISOString().split('T')[0], price: updatedNetWorth}]
          };
          return updatedData;
      });
      
      // Post-update: check for achievements and save
      await checkAndUnlockAchievements('add_holding', { holdingsCount: (dashboardData?.holdings.length || 0) + 1 });
      if(updatedData) saveDataToLocalStorage(updatedData, watchlist, achievements);
  }, [apiMode, isFallbackMode, checkAndUnlockAchievements, dashboardData, watchlist, achievements, saveDataToLocalStorage]);
  
  const updateWatchlistDetails = React.useCallback(async (tickers: string[]) => {
      if(!dashboardData) return;
      const newTickers = tickers.filter(t => !dashboardData.watchlist?.some(w => w.ticker === t));
      if (newTickers.length === 0) return;
      
      try {
        const newHoldingDetails = await Promise.all(newTickers.map(t => fetchStockDetailsForPortfolio(t, apiMode)));
        setDashboardData(prev => prev ? ({...prev, watchlist: [...(prev.watchlist || []), ...newHoldingDetails.map(h => ({...h, shares: 0, totalValue: 0}))] }) : null);
      } catch (err: any) {
          if(err.message.includes('QUOTA_EXCEEDED')) setApiMode('opensource');
          else console.error("Update watchlist failed", err.message);
      }
  }, [apiMode, setApiMode, dashboardData]);

  const handleToggleWatchlist = React.useCallback((ticker: string) => {
    setWatchlist(prev => {
        const newWatchlist = prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker];
        if (newWatchlist.length > prev.length) {
            updateWatchlistDetails(newWatchlist);
        } else {
             setDashboardData(d => d ? ({ ...d, watchlist: d.watchlist?.filter(w => w.ticker !== ticker) }) : null);
        }
        if(dashboardData) saveDataToLocalStorage(dashboardData, newWatchlist, achievements);
        return newWatchlist;
    });
  }, [dashboardData, achievements, updateWatchlistDetails, saveDataToLocalStorage]);
  
  const handleRunScreener = React.useCallback(() => {
      checkAndUnlockAchievements('run_screener', {});
  }, [checkAndUnlockAchievements]);

  // --- DATA REFRESHING ---
  React.useEffect(() => {
    if (isAuthenticated && dashboardData) {
        const refreshData = async () => {
          try {
            const [news, score] = await Promise.all([
                generatePersonalizedNews(dashboardData.holdings, dashboardData.watchlist || [], apiMode),
                calculatePortfolioScore(dashboardData.holdings, apiMode),
            ]);
            setDashboardData(d => d ? ({...d, personalizedNews: news, portfolioScore: score }) : null);
            checkAndUnlockAchievements('portfolio_score', { score: score.score });
          } catch(err: any) {
              if(err.message.includes('QUOTA_EXCEEDED')) setApiMode('opensource');
              else console.error("Data refresh failed", err.message);
          }
        };
        const timeoutId = setTimeout(refreshData, 500);
        return () => clearTimeout(timeoutId);
    }
  }, [dashboardData?.holdings.length, dashboardData?.watchlist?.length, isAuthenticated, apiMode, setApiMode, checkAndUnlockAchievements]);


  if (!isAuthenticated) {
    return <Home onLogin={handleLogin} />;
  }
  
  const renderView = () => {
    if (isLoading && !dashboardData) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <Spinner />
          <p className="mt-4 text-brand-text-secondary">Loading your financial universe...</p>
        </div>
      );
    }
    if (error && view !== 'dashboard') {
      return <div className="text-center my-8 text-red-400 p-4 bg-red-900/20 rounded-lg max-w-2xl mx-auto">{error}</div>;
    }

    switch (view) {
      case 'dashboard':
        return <DashboardPage data={dashboardData} onGenerateDemo={handleGenerateDemoData} onAddHolding={() => setIsModalOpen(true)} error={error} />;
      case 'portfolio':
        return <PortfolioPage data={dashboardData} onGenerateDemo={handleGenerateDemoData} onAddHolding={() => setIsModalOpen(true)} />;
      case 'research':
        return <ResearchPage watchlist={watchlist} onToggleWatchlist={handleToggleWatchlist} />;
      case 'screener':
        return <Screener onRunScreener={handleRunScreener} />;
      case 'advisor':
        return dashboardData?.holdings && dashboardData.holdings.length > 0 ? <RoboAdvisor currentAllocation={dashboardData.allocation} /> : <div className="text-center mt-12 text-brand-text-secondary">Please add holdings or generate demo data to use the AI Advisor.</div>;
      case 'chatbot':
        return <Chatbot />;
      case 'education':
        return <EducationHub />;
      case 'analytics':
        return <AnalyticsPage holdings={dashboardData?.holdings || []} />;
      case 'briefings':
        return <BriefingsPage holdings={dashboardData?.holdings || []} />;
      case 'support':
        return <DonationPage />;
      default:
        return <DashboardPage data={dashboardData} onGenerateDemo={handleGenerateDemoData} onAddHolding={() => setIsModalOpen(true)} error={error} />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-body-bg text-brand-text font-sans flex flex-col">
      <ApiStatusBanner />
      <Header currentView={view} setView={setView} onLogout={handleLogout} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-grow">
        {renderView()}
      </main>
      {isAuthenticated && dashboardData && <OnboardingTour run={runTour} onTourEnd={handleTourEnd} />}
      {isModalOpen && (
          <AddHoldingModal 
              onClose={() => setIsModalOpen(false)}
              onAddHolding={handleAddHolding}
          />
      )}
      {lastUnlockedAchievement && (
          <AchievementToast 
            achievement={lastUnlockedAchievement}
            onDismiss={() => setLastUnlockedAchievement(null)}
          />
      )}
       <footer className="text-center p-4 text-brand-text-secondary text-xs border-t border-brand-border mt-auto flex-shrink-0 bg-brand-primary">
          <p>Robo Advisor Super App. Financial data may be simulated by AI and should not be used for real investment decisions.</p>
        </footer>
    </div>
  );
};

const App: React.FC = () => (
    <ApiProvider>
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    </ApiProvider>
);

export default App;