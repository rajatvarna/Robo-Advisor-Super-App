

import * as React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const TradingViewCryptoList: React.FC = React.memo(() => {
    const { theme } = useTheme();
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!containerRef.current) return;
        
        const script = document.createElement('script');
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
        script.async = true;
        script.innerHTML = JSON.stringify({
             "colorTheme": theme,
             "dateRange": "12M",
             "showChart": true,
             "locale": "en",
             "largeChartUrl": "",
             "isTransparent": true,
             "showSymbolLogo": true,
             "showFloatingTooltip": false,
             "width": "100%",
             "height": "660",
             "plotLineColorGrowing": "rgba(41, 98, 255, 1)",
             "plotLineColorFalling": "rgba(255, 6, 6, 1)",
             "gridLineColor": "rgba(240, 243, 250, 0)",
             "scaleFontColor": "rgba(120, 123, 134, 1)",
             "belowLineFillColorGrowing": "rgba(41, 98, 255, 0.12)",
             "belowLineFillColorFalling": "rgba(255, 6, 6, 0.12)",
             "belowLineFillColorGrowingBottom": "rgba(41, 98, 255, 0)",
             "belowLineFillColorFallingBottom": "rgba(41, 98, 255, 0)",
             "symbolActiveColor": "rgba(41, 98, 255, 0.12)",
              "tabs": [
                {
                  "title": "Cryptocurrencies",
                  "symbols": [
                    { "s": "CRYPTOCAP:TOTAL", "d": "Total Market Cap" },
                    { "s": "BITSTAMP:BTCUSD", "d": "Bitcoin" },
                    { "s": "BITSTAMP:ETHUSD", "d": "Ethereum" },
                    { "s": "COINBASE:SOLUSD", "d": "Solana" },
                    { "s": "BINANCE:BNBUSD", "d": "BNB" },
                    { "s": "BITSTAMP:XRPUSD", "d": "XRP" },
                    { "s": "COINBASE:ADAUSD", "d": "Cardano" }
                  ],
                   "originalTitle": "Cryptocurrencies"
                }
              ]
        });
        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        };

    }, [theme]);

    return (
        <div className="tradingview-widget-container" ref={containerRef} style={{ height: '660px', width: '100%' }}>
            <div className="tradingview-widget-container__widget"></div>
        </div>
    );
});

const TradingViewCryptoNews: React.FC = React.memo(() => {
    const { theme } = useTheme();
    const containerRef = React.useRef<HTMLDivElement>(null);
    
    React.useEffect(() => {
        if (!containerRef.current) return;
        const script = document.createElement('script');
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "feedMode": "market",
            "market": "crypto",
            "isTransparent": true,
            "displayMode": "regular",
            "width": "100%",
            "height": 600,
            "colorTheme": theme,
            "locale": "en"
        });
        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        };
    }, [theme]);

    return (
        <div className="tradingview-widget-container" ref={containerRef} style={{ height: '600px', width: '100%' }}>
            <div className="tradingview-widget-container__widget"></div>
        </div>
    );
});


const CryptoPage: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-brand-text">Crypto Dashboard</h1>
                <p className="mt-2 text-brand-text-secondary">Live market data and news for the crypto world, powered by TradingView.</p>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-brand-secondary rounded-lg border border-brand-border shadow-lg p-2">
                    <TradingViewCryptoList />
                </div>
                <div className="bg-brand-secondary rounded-lg border border-brand-border shadow-lg">
                     <h3 className="text-lg font-bold text-brand-text p-4">Crypto News</h3>
                     <div className="p-2">
                        <TradingViewCryptoNews />
                     </div>
                </div>
            </div>
        </div>
    );
};

export default CryptoPage;
