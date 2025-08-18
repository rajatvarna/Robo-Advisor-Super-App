
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
import TopNewsPage from './components/TopNewsPage';
import AnalyticsPage from './components/AnalyticsPage';
import CryptoPage from './components/CryptoPage';
import IntegrationsPage from './components/IntegrationsPage';
import AlertsPage from './components/AlertsPage';
import AddHoldingModal from './components/AddHoldingModal';
import AchievementToast from './components/AchievementToast';
import Spinner from './components/icons/Spinner';
import { fetchStockDetailsForPortfolio, generatePersonalizedNews, calculatePortfolioScore, checkForAchievements, generateDashboardInsights, generatePortfolioAlerts } from './services/geminiService';
import * as financialDataService from './services/financialDataService';
import * as brokerageService from './services/brokerageService';
import type { View, DashboardData, Holding, Transaction, AddHoldingData, Achievement, UserWatchlist, InvestmentGoal, Quote, BaseDashboardData } from './types';
import { ApiProvider, useApi } from './contexts/ApiContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ApiStatusBanner from './components/ApiStatusBanner';
import DonationPage from './components/DonationPage';
import { ALL_ACHIEVEMENTS } from './services/fallbackData';
import OnboardingTour from './components/OnboardingTour';
import * as FallbackData from './services/fallbackData';
import GoalSettingModal from './components/GoalSettingModal';

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [view, setView] = React.useState<View>('dashboard');
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null);
  const [quotes, setQuotes] = React.useState<Record<string, Quote>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [lastUnlockedAchievement, setLastUnlockedAchievement] = React.useState<Achievement | null>(null);
  const [runTour, setRunTour] = React.useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = React.useState(false);

  const { apiMode, setApiMode } = useApi();

  const recalculateHoldings = React.useCallback((transactions: Transaction[], currentQuotes: Record<string, Quote>): Holding[] => {
    const holdingsMap = new Map<string, { shares: number; totalCost: number; companyName: string; sector?: string }>();

    transactions.forEach(tx => {
      let holding = holdingsMap.get(tx.ticker);
      if (!holding) {
        holding = { shares: 0, totalCost: 0, companyName: tx.companyName, sector: tx.sector };
        holdingsMap.set(tx.ticker, holding);
      }

      if (tx.type === 'Buy') {
        holding.shares += tx.shares;
        holding.totalCost += tx.totalValue;
      } else { // Sell
        const costOfSoldShares = (holding.totalCost / holding.shares) * tx.shares;
        holding.shares -= tx.shares;
        holding.totalCost -= costOfSoldShares;
      }
      // Assuming company name from last transaction is most recent
      holding.companyName = tx.companyName;
      holding.sector = tx.sector;
    });

    return Array.from(holdingsMap.entries())
      .filter(([, data]) => data.shares > 0.0001) // Filter out fully sold stocks
      .map(([ticker, data]) => {
        const quote = currentQuotes[ticker] || FallbackData.getFallbackQuote(ticker);
        const totalValue = data.shares * quote.currentPrice;
        const unrealizedGain = totalValue - data.totalCost;
        const unrealizedGainPercent = data.totalCost > 0 ? (unrealizedGain / data.totalCost) * 100 : 0;
        return {
          ...quote,
          companyName: data.companyName,
          sector: data.sector,
          shares: data.shares,
          totalValue,
          costBasis: data.totalCost,
          unrealizedGain,
          unrealizedGainPercent,
        };
      });
  }, []);

  const saveDataToLocalStorage = React.useCallback((data: DashboardData | null) => {
    if(data) localStorage.setItem('robo-advisor-data', JSON.stringify(data));
  }, []);

  // --- PERSISTENCE ---
  React.useEffect(() => {
    const savedAuth = localStorage.getItem('robo-advisor-authenticated');
    if (savedAuth === 'true') {
      const savedData = localStorage.getItem('robo-advisor-data');
      if (savedData) {
        const parsedData: DashboardData = JSON.parse(savedData);
        setDashboardData(parsedData);
        setAchievements(parsedData.achievements || ALL_ACHIEVEMENTS);
      }
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);
  
  // --- REAL-TIME PRICE UPDATES ---
  React.useEffect(() => {
    const updatePrices = async () => {
      if (isAuthenticated && dashboardData) {
        const allTickers = [
          ...dashboardData.holdings.map(h => h.ticker),
          ...dashboardData.watchlists.flatMap(wl => wl.tickers)
        ];
        if (allTickers.length === 0) return;
        
        try {
            const newQuotes = await financialDataService.fetchQuotes(allTickers, apiMode);
            setQuotes(prevQuotes => {
                const updatedQuotes: Record<string, Quote> = {};
                for (const ticker in newQuotes) {
                    const oldPrice = prevQuotes[ticker]?.currentPrice;
                    const newPrice = newQuotes[ticker].currentPrice;
                    updatedQuotes[ticker] = { ...newQuotes[ticker], isUpdating: oldPrice !== newPrice };
                }
                return { ...prevQuotes, ...updatedQuotes };
            });
        } catch(err: any) {
             console.error("Failed to fetch price updates:", err);
             if(err.message.includes('QUOTA_EXCEEDED')) setApiMode('opensource');
        }
      }
    };
    
    updatePrices(); // Initial fetch
    const interval = setInterval(updatePrices, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, dashboardData?.holdings.length, dashboardData?.watchlists, apiMode, setApiMode]);

  // --- PORTFOLIO RECALCULATION ---
  React.useEffect(() => {
    if (dashboardData && Object.keys(quotes).length > 0) {
      setDashboardData(prevData => {
        if (!prevData) return null;
        const newHoldings = recalculateHoldings(prevData.transactions, quotes);
        const newNetWorth = newHoldings.reduce((sum, h) => sum + h.totalValue, 0);

        const allocationMap = new Map<string, number>();
        newHoldings.forEach(h => {
            const sector = h.sector || 'Other';
            allocationMap.set(sector, (allocationMap.get(sector) || 0) + h.totalValue);
        });
        const newAllocation = newNetWorth > 0 ? Array.from(allocationMap.entries()).map(([name, value]) => ({
            name,
            value: (value / newNetWorth) * 100,
        })) : [];

        return {
          ...prevData,
          holdings: newHoldings,
          netWorth: newNetWorth,
          allocation: newAllocation,
        };
      });
    }
  }, [quotes, recalculateHoldings, dashboardData?.transactions]);

  
  // --- USER ACTIONS ---
  const handleLogin = React.useCallback(() => {
    setIsAuthenticated(true);
    localStorage.setItem('robo-advisor-authenticated', 'true');
    setView('dashboard');
  }, []);
  
  const handleLogout = React.useCallback(() => {
    setIsAuthenticated(false);
    setDashboardData(null);
    setAchievements([]);
    setQuotes({});
    localStorage.clear();
    setView('dashboard');
  }, []);

  const checkAndUnlockAchievements = React.useCallback(async (action: string, data: any) => {
    if (!dashboardData) return;
    const unlockedAchievementIds = dashboardData.achievements.filter(a => a.unlocked).map(a => a.id);
    try {
        const newAchievements = await checkForAchievements(action, data, unlockedAchievementIds, apiMode);
        if (newAchievements.length > 0) {
            setDashboardData(prev => {
                if(!prev) return null;
                const updatedAchievements = prev.achievements.map(pa => {
                    const found = newAchievements.find(na => na.id === pa.id);
                    return found ? { ...pa, unlocked: true, unlockedAt: new Date().toISOString() } : pa;
                });
                setLastUnlockedAchievement(updatedAchievements.find(a => a.id === newAchievements[0].id)!);
                const newData = {...prev, achievements: updatedAchievements};
                saveDataToLocalStorage(newData);
                return newData;
            });
        }
    } catch(err: any) {
         if(err.message.includes('QUOTA_EXCEEDED')) setApiMode('opensource');
         else console.error("Achievement check failed:", err.message);
    }
  }, [apiMode, setApiMode, dashboardData, saveDataToLocalStorage]);

  const handleGenerateDemoData = React.useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const baseData = await FallbackData.generateDashboardData();
        const allTickers = baseData.holdings.map(h => h.ticker);
        const liveQuotes = await financialDataService.fetchQuotes(allTickers, apiMode);
        
        const liveHoldings = recalculateHoldings(baseData.transactions, liveQuotes);
        const netWorth = liveHoldings.reduce((sum, h) => sum + h.totalValue, 0);

        const allocationMap = new Map<string, number>();
        liveHoldings.forEach(h => {
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
            holdings: liveHoldings,
            portfolioPerformance: [{ date: new Date().toISOString().split('T')[0], price: netWorth }],
            personalizedNews: [],
            dashboardInsights: FallbackData.generateDashboardInsights(),
            portfolioScore: { score: 78, summary: "A well-diversified portfolio with solid holdings." },
            achievements: initializedAchievements,
            alerts: FallbackData.generatePortfolioAlerts({ holdings: liveHoldings } as DashboardData),
        };

        setDashboardData(fullData);
        setQuotes(liveQuotes);
        saveDataToLocalStorage(fullData);

        const tourCompleted = localStorage.getItem('robo-advisor-tour-completed');
        if (!tourCompleted) {
          setTimeout(() => setRunTour(true), 500);
        }
        
        const goalSet = localStorage.getItem('robo-advisor-goal-set');
        if (!goalSet) {
           setTimeout(() => setIsGoalModalOpen(true), 600);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load demo data. Please try again.');
        handleApiError(err);
      } finally {
        setIsLoading(false);
      }
  }, [saveDataToLocalStorage, apiMode]);

  const handleTourEnd = React.useCallback(() => {
    setRunTour(false);
    localStorage.setItem('robo-advisor-tour-completed', 'true');
  }, []);
  
  const handleAddHolding = React.useCallback(async (holdingData: AddHoldingData) => {
      // Fetch latest quote and details for the new stock
      const newQuote = await financialDataService.fetchQuotes([holdingData.ticker], apiMode);
      setQuotes(q => ({...q, ...newQuote}));
      const stockDetails = await fetchStockDetailsForPortfolio(holdingData.ticker, apiMode);

      const newTransaction: Transaction = {
           id: `txn-${Date.now()}`,
           date: holdingData.purchaseDate,
           type: 'Buy',
           ticker: holdingData.ticker,
           companyName: stockDetails.companyName,
           sector: stockDetails.sector,
           shares: holdingData.shares,
           price: holdingData.purchasePrice,
           totalValue: holdingData.shares * holdingData.purchasePrice,
      };

      setDashboardData(prevData => {
          if (!prevData) return null; // Should not happen if modal is open

          const updatedTransactions = [newTransaction, ...prevData.transactions];
          const updatedHoldings = recalculateHoldings(updatedTransactions, { ...quotes, ...newQuote });
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

          const newData = {
              ...prevData,
              holdings: updatedHoldings,
              transactions: updatedTransactions,
              netWorth: updatedNetWorth,
              allocation: updatedAllocation,
              portfolioPerformance: [...prevData.portfolioPerformance, {date: new Date().toISOString().split('T')[0], price: updatedNetWorth}]
          };
          saveDataToLocalStorage(newData);
          checkAndUnlockAchievements('add_holding', { holdingsCount: newData.holdings.length });
          return newData;
      });

  }, [apiMode, quotes, recalculateHoldings, checkAndUnlockAchievements, saveDataToLocalStorage]);
  
  const handleRunScreener = React.useCallback(() => {
      checkAndUnlockAchievements('run_screener', {});
  }, [checkAndUnlockAchievements]);

  const handleSetGoal = React.useCallback((goal: InvestmentGoal) => {
    setDashboardData(prev => {
        if(!prev) return null;
        const newData = { ...prev, goal };
        saveDataToLocalStorage(newData);
        return newData;
    });
    localStorage.setItem('robo-advisor-goal-set', 'true');
    setIsGoalModalOpen(false);
  }, [saveDataToLocalStorage]);

  const handleSyncBrokerage = React.useCallback(async (brokerage: 'Interactive Brokers') => {
      setIsLoading(true);
      setError(null);
      try {
          let brokeragePortfolio: BaseDashboardData;
          if (brokerage === 'Interactive Brokers') {
              brokeragePortfolio = await brokerageService.syncInteractiveBrokersPortfolio(apiMode);
          } else {
              throw new Error("Unsupported brokerage.");
          }

          const allTickers = brokeragePortfolio.holdings.map(h => h.ticker);
          const liveQuotes = await financialDataService.fetchQuotes(allTickers, apiMode);
          setQuotes(liveQuotes);
          
          const liveHoldings = recalculateHoldings(brokeragePortfolio.transactions, liveQuotes);
          const netWorth = liveHoldings.reduce((sum, h) => sum + h.totalValue, 0);

          const allocationMap = new Map<string, number>();
          liveHoldings.forEach(h => {
              const sector = h.sector || 'Stocks';
              allocationMap.set(sector, (allocationMap.get(sector) || 0) + h.totalValue);
          });
          const allocation = netWorth > 0 ? Array.from(allocationMap.entries()).map(([name, value]) => ({
              name,
              value: (value / netWorth) * 100,
          })) : [];

          setDashboardData(prevData => {
              if (!prevData) return null;
              const newData: DashboardData = {
                  ...prevData,
                  holdings: liveHoldings,
                  transactions: brokeragePortfolio.transactions,
                  netWorth,
                  allocation,
                  integrations: {
                      ...prevData.integrations,
                      interactiveBrokers: {
                          connected: true,
                          lastSync: new Date().toISOString(),
                      },
                  },
              };
              saveDataToLocalStorage(newData);
              return newData;
          });
      } catch (err: any) {
          handleApiError(err);
      } finally {
          setIsLoading(false);
      }
  }, [apiMode, recalculateHoldings, saveDataToLocalStorage]);

  const handleDisconnectBrokerage = React.useCallback((brokerage: 'Interactive Brokers') => {
    setDashboardData(prev => {
        if (!prev) return null;
        const newData = {
            ...prev,
            integrations: {
                ...prev.integrations,
                interactiveBrokers: {
                    connected: false,
                },
            },
        };
        saveDataToLocalStorage(newData);
        return newData;
    });
  }, [saveDataToLocalStorage]);

    // --- WATCHLIST ACTIONS ---
  const handleAddWatchlist = (name: string) => {
      setDashboardData(prev => {
          if (!prev) return null;
          const newWatchlist: UserWatchlist = { id: `wl-${Date.now()}`, name, tickers: [] };
          const newData = { ...prev, watchlists: [...prev.watchlists, newWatchlist] };
          saveDataToLocalStorage(newData);
          return newData;
      });
  };

  const handleRenameWatchlist = (id: string, newName: string) => {
      setDashboardData(prev => {
          if (!prev) return null;
          const updatedWatchlists = prev.watchlists.map(wl => wl.id === id ? { ...wl, name: newName } : wl);
          const newData = { ...prev, watchlists: updatedWatchlists };
          saveDataToLocalStorage(newData);
          return newData;
      });
  };

  const handleDeleteWatchlist = (id: string) => {
      setDashboardData(prev => {
          if (!prev) return null;
          const updatedWatchlists = prev.watchlists.filter(wl => wl.id !== id);
          const newData = { ...prev, watchlists: updatedWatchlists };
          saveDataToLocalStorage(newData);
          return newData;
      });
  };

  const handleUpdateWatchlistTickers = (id: string, tickers: string[]) => {
      setDashboardData(prev => {
          if (!prev) return null;
          const updatedWatchlists = prev.watchlists.map(wl => wl.id === id ? { ...wl, tickers: tickers } : wl);
          const newData = { ...prev, watchlists: updatedWatchlists };
          saveDataToLocalStorage(newData);
          return newData;
      });
  };

  const handleMarkAllAlertsRead = React.useCallback(() => {
    setDashboardData(prev => {
        if (!prev) return null;
        const updatedAlerts = prev.alerts.map(a => ({ ...a, read: true }));
        const newData = { ...prev, alerts: updatedAlerts };
        saveDataToLocalStorage(newData);
        return newData;
    });
  }, [saveDataToLocalStorage]);

  const handleApiError = (err: any) => {
        if (err.message.includes('QUOTA_EXCEEDED')) {
            setApiMode('opensource');
            setError("Live AI quota exceeded. Switched to offline fallback mode for this feature.");
        } else {
            setError(err.message || "An unexpected error occurred.");
        }
    };
  
  // --- DATA REFRESHING & POLLING ---
  React.useEffect(() => {
    if (isAuthenticated && dashboardData) {
        const refreshData = async () => {
          try {
            // Fetch portfolio-dependent data
            const allWatchlistTickers = dashboardData.watchlists.flatMap(wl => wl.tickers);
            const [news, score, insights, alerts] = await Promise.all([
                generatePersonalizedNews(dashboardData.holdings, allWatchlistTickers, apiMode),
                calculatePortfolioScore(dashboardData.holdings, apiMode),
                generateDashboardInsights(dashboardData, apiMode),
                generatePortfolioAlerts(dashboardData, apiMode),
            ]);

            setDashboardData(d => {
                if(!d) return null;
                const existingAlertIds = new Set(d.alerts.map(a => a.id));
                const newUniqueAlerts = alerts.filter(a => !existingAlertIds.has(a.id));
                const updatedAlerts = [...d.alerts, ...newUniqueAlerts];

                const newData = {...d, personalizedNews: news, portfolioScore: score, dashboardInsights: insights, alerts: updatedAlerts };
                saveDataToLocalStorage(newData);
                return newData;
            });
            checkAndUnlockAchievements('portfolio_score', { score: score.score });

          } catch(err: any) {
              console.error("Data refresh failed", err);
              if(err.message.includes('QUOTA_EXCEEDED')) setApiMode('opensource');
          }
        };

        refreshData(); // Initial call
        const intervalId = setInterval(refreshData, 15 * 60 * 1000); // Refresh every 15 minutes

        return () => clearInterval(intervalId);
    }
  }, [dashboardData?.holdings.length, dashboardData?.watchlists.length, isAuthenticated, apiMode, setApiMode, checkAndUnlockAchievements, saveDataToLocalStorage]);


  if (!isAuthenticated) {
    return <Home onLogin={handleLogin} />;
  }
  
  const unreadAlertsCount = dashboardData?.alerts?.filter(a => !a.read).length ?? 0;

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
        return <DashboardPage data={dashboardData} quotes={quotes} onGenerateDemo={handleGenerateDemoData} onAddHolding={() => setIsModalOpen(true)} error={error} onAddWatchlist={handleAddWatchlist} onRenameWatchlist={handleRenameWatchlist} onDeleteWatchlist={handleDeleteWatchlist} onUpdateWatchlistTickers={handleUpdateWatchlistTickers} />;
      case 'portfolio':
        return <PortfolioPage data={dashboardData} onGenerateDemo={handleGenerateDemoData} onAddHolding={() => setIsModalOpen(true)} />;
      case 'research':
        return <ResearchPage watchlists={dashboardData?.watchlists || []} onUpdateWatchlistTickers={handleUpdateWatchlistTickers} onAddWatchlist={handleAddWatchlist} />;
      case 'screener':
        return <Screener onRunScreener={handleRunScreener} />;
      case 'advisor':
        return dashboardData?.holdings && dashboardData.holdings.length > 0 ? <RoboAdvisor currentAllocation={dashboardData.allocation} /> : <div className="text-center mt-12 text-brand-text-secondary">Please add holdings or generate demo data to use the AI Advisor.</div>;
      case 'chatbot':
        return <Chatbot />;
      case 'education':
        return <EducationHub />;
      case 'analytics':
        return <AnalyticsPage data={dashboardData} />;
      case 'news':
        return <TopNewsPage />;
      case 'crypto':
        return <CryptoPage />;
       case 'integrations':
        return <IntegrationsPage data={dashboardData} onSync={handleSyncBrokerage} onDisconnect={handleDisconnectBrokerage} />;
       case 'alerts':
        return <AlertsPage alerts={dashboardData?.alerts || []} onMarkAllRead={handleMarkAllAlertsRead} />;
      case 'support':
        return <DonationPage />;
      default:
        return <DashboardPage data={dashboardData} quotes={quotes} onGenerateDemo={handleGenerateDemoData} onAddHolding={() => setIsModalOpen(true)} error={error} onAddWatchlist={handleAddWatchlist} onRenameWatchlist={handleRenameWatchlist} onDeleteWatchlist={handleDeleteWatchlist} onUpdateWatchlistTickers={handleUpdateWatchlistTickers}/>;
    }
  };

  return (
    <div className="min-h-screen bg-brand-body-bg text-brand-text font-sans flex flex-col">
      <ApiStatusBanner />
      <Header currentView={view} setView={setView} onLogout={handleLogout} unreadAlertsCount={unreadAlertsCount} />
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
      {isGoalModalOpen && (
          <GoalSettingModal
              onClose={() => {
                  setIsGoalModalOpen(false);
                  localStorage.setItem('robo-advisor-goal-set', 'true'); // User dismissed it
              }}
              onSetGoal={handleSetGoal}
          />
      )}
      {lastUnlockedAchievement && (
          <AchievementToast 
            achievement={lastUnlockedAchievement}
            onDismiss={() => setLastUnlockedAchievement(null)}
          />
      )}
       <footer className="text-center p-4 text-brand-text-secondary text-xs border-t border-brand-border mt-auto flex-shrink-0 bg-brand-primary">
          <p>Robo Advisor Super App. Financial data is provided by financial APIs, but use for informational purposes only and should not be used for real investment decisions.</p>
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
