



import * as React from 'react';
import { useTheme } from '../contexts/ThemeContext';

// This is a type assertion for the global TradingView object
declare const TradingView: any;

interface StockChartProps {
  ticker: string;
}

const StockChart: React.FC<StockChartProps> = ({ ticker }) => {
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const widgetInstanceRef = React.useRef<any>(null);
  const { theme } = useTheme();

  React.useEffect(() => {
    const createWidget = () => {
      if (!chartContainerRef.current || typeof TradingView === 'undefined') {
        return;
      }
      
      // Clear any existing widget before creating a new one
      chartContainerRef.current.innerHTML = '';
      
      const widgetOptions = {
        symbol: ticker,
        interval: 'D', // Daily
        timezone: 'Etc/UTC',
        theme: theme, // Dynamically set theme
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: false,
        container_id: chartContainerRef.current.id,
        autosize: true,
        details: true,
        hotlist: true,
        calendar: true,
      };

      // Create a new widget instance
      widgetInstanceRef.current = new TradingView.widget(widgetOptions);
    };

    if (ticker) {
      if (typeof TradingView !== 'undefined' && TradingView.widget) {
        createWidget();
      } else {
        // If the script isn't loaded yet, wait for it.
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = createWidget;
        document.head.appendChild(script);
      }
    }
    
    // Capture the container for cleanup check
    const container = chartContainerRef.current;

    return () => {
       if (widgetInstanceRef.current) {
          try {
             if (container && document.body.contains(container)) {
                widgetInstanceRef.current.remove();
             }
          } catch (error) {
             console.error("Error removing TradingView widget:", error);
          } finally {
             widgetInstanceRef.current = null;
          }
       }
    };
  }, [ticker, theme]); // Re-create widget when ticker or theme changes

  const chartId = `tradingview-chart-container-${React.useId()}`;
  
  return (
    <div className="bg-brand-secondary border border-brand-border rounded-lg shadow-lg h-[500px] p-1">
      <div id={chartId} ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};

export default React.memo(StockChart);