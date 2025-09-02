

import * as React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ScreenerProps {
    onRunScreener: () => void;
}

const TradingViewScreener: React.FC = React.memo(() => {
    const { theme } = useTheme();
    const containerRef = React.useRef<HTMLDivElement>(null);
    const widgetLoaded = React.useRef(false);

    React.useEffect(() => {
        if (!containerRef.current || widgetLoaded.current) return;

        const script = document.createElement('script');
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "width": "100%",
            "height": "600",
            "defaultColumn": "overview",
            "screener_type": "stock",
            "displayCurrency": "USD",
            "colorTheme": theme,
            "locale": "en"
        });
        
        containerRef.current.appendChild(script);
        widgetLoaded.current = true;
        
        return () => {
             if (containerRef.current) {
                containerRef.current.innerHTML = "";
                widgetLoaded.current = false;
            }
        }

    }, [theme]);

    return (
        <div className="tradingview-widget-container" ref={containerRef} style={{ height: '600px', width: '100%' }}>
            <div className="tradingview-widget-container__widget"></div>
        </div>
    );
});


const Screener: React.FC<ScreenerProps> = ({ onRunScreener }) => {
    // Call onRunScreener once to trigger the achievement.
    React.useEffect(() => {
        onRunScreener();
    }, [onRunScreener]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-brand-text">Stock Screener</h1>
                <p className="mt-2 text-brand-text-secondary">
                    Discover investment opportunities using this powerful screener provided by TradingView.
                </p>
            </div>
            <div className="bg-brand-secondary p-2 rounded-lg border border-brand-border min-h-[620px]">
                <TradingViewScreener />
            </div>
        </div>
    );
};

export default Screener;
