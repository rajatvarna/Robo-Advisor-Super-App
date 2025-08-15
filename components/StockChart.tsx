

import * as React from 'react';

// This is a type assertion for the global TradingView object
declare const TradingView: any;

interface StockChartProps {
  ticker: string;
}

const StockChart: React.FC<StockChartProps> = ({ ticker }) => {
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const widgetInstanceRef = React.useRef<any>(null);

  React.useEffect(() => {
    const createWidget = () => {
      if (!chartContainerRef.current || typeof TradingView === 'undefined') {
        return;
      }
      
      const widgetOptions = {
        symbol: ticker,
        interval: 'D', // Daily
        timezone: 'Etc/UTC',
        theme: 'dark',
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
      // The TradingView script should be loaded, but this is a safe check.
      if (typeof TradingView !== 'undefined' && TradingView.widget) {
        createWidget();
      } else {
        window.addEventListener('load', createWidget);
      }
    }
    
    // Capture the container for cleanup check
    const container = chartContainerRef.current;

    return () => {
       window.removeEventListener('load', createWidget);
       if (widgetInstanceRef.current) {
          try {
             // Only try to remove if the container is still mounted in the DOM
             if (container && document.body.contains(container)) {
                widgetInstanceRef.current.remove();
             }
          } catch (error) {
             // The error from the user log is caught here. We can just log it.
             console.error("Error removing TradingView widget:", error);
          } finally {
             // Always clear the ref to prevent memory leaks
             widgetInstanceRef.current = null;
          }
       }
    };
  }, [ticker]);

  const chartId = `tradingview-chart-container-${React.useId()}`;
  
  return (
    <div className="bg-brand-secondary border border-brand-border rounded-lg shadow-lg h-[500px] p-1">
      <div id={chartId} ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};

export default StockChart;