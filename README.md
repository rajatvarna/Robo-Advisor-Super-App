
# Robo Advisor Super App

Welcome to the Robo Advisor Super App, a feature-rich financial dashboard designed to provide comprehensive portfolio analysis and deep-dive stock research using leading financial data APIs.

![Robo Advisor Super App Screenshot](https://storage.googleapis.com/maker-suite-media/projects/project-examples/finance-dashboard-hero.png)

## ✨ Core Features

This application is packed with features that cater to both novice and experienced investors:

*   **📊 Interactive Dashboard:** The dashboard provides a dynamic overview of your financial health.
    *   Track key metrics like Net Worth, Day's Gain/Loss, and Total Gain.
    *   View a "For You" news feed with the latest stories related to your top holdings.
    *   Set financial goals and visualize your progress towards them.

*   **📈 Comprehensive Portfolio Management:**
    *   **Local Persistence:** The app uses a mock user session by default. All portfolio data is saved to your browser's local storage, ensuring a persistent experience across sessions.
    *   Track holdings, transactions, and overall net worth.
    *   Visualize sector allocation with interactive pie charts.
    *   Manually add new holdings and transactions.

*   **🔍 In-depth Stock Research:**
    *   Analyze any stock to view key metrics like P/E ratio, market cap, and 52-week range.
    *   View interactive historical price charts via the TradingView integration.
    *   Access 10 years of financial statements (Income, Balance Sheet, Cash Flow).
    *   Review recent SEC filings.
    *   Compare up to 5 stocks side-by-side with a detailed quantitative analysis.

*   **🌐 Market & Analytics Suite:**
    *   **Stock Screener:** Find new investment opportunities using a powerful, interactive screener widget from TradingView.
    *   **Crypto Dashboard:** Track the cryptocurrency market and stay updated with the latest crypto news using TradingView widgets.
    *   **Advanced Analytics:**
        *   Compare your portfolio's performance against the S&P 500 benchmark.
        *   Forecast upcoming dividend income for your holdings.
    *   **Brokerage Sync (Simulated):** "Connect" to Interactive Brokers to sync your portfolio automatically.

*   **⚙️ Modern UX & Other Features:**
    *   **Light/Dark Mode:** A sleek, modern interface with theme support.
    *   **Gamification:** Unlock achievements for reaching financial milestones.
    *   **Onboarding Tour:** A guided tour for new users to discover key features.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Tailwind CSS
*   **Charting & Widgets:** Recharts, TradingView Widgets
*   **Financial Data:**
    *   **Alpha Vantage API:** Quotes, historical data, company profiles, financials, news, and key metrics.
    *   **SEC EDGAR API:** Official SEC filings data.
*   **Module Management:** ES Modules with `importmap` (via esm.sh CDN)

## 🚀 Getting Started

This project is a static web application and does not require a complex build process. You can run it with any local web server.

### Prerequisites

To run the application with live data, you will need a free API key from Alpha Vantage.

1.  **Alpha Vantage API Key:** Get a free key from [Alpha Vantage](https://www.alphavantage.co/).

> The app will function in a robust offline "fallback mode" with simulated data if a key is not provided.

### Installation & Configuration

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/robo-advisor-super-app.git
    cd robo-advisor-super-app
    ```

2.  **Configure API Key:**
    *   Open the `process.env.js` file in the root directory.
    *   Replace the placeholder value for `ALPHAVANTAGE_API_KEY` with your actual key.
    ```javascript
    // process.env.js
    
    // Replace with your Alpha Vantage API Key
    export const ALPHAVANTAGE_API_KEY = 'YOUR_ALPHAVANTAGE_API_KEY_HERE';
    ```

3.  **Run the application:**
    Use a simple local server to host the files. A popular choice is the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension for Visual Studio Code.
    *   Install the extension.
    *   Right-click `index.html` and select "Open with Live Server".

The application should now be running in your browser!

## 🏛️ Architecture & Key Concepts

### Service-Oriented Architecture

The application logic is cleanly separated into a `services` directory, abstracting away the data-fetching from the UI components.

*   **`financialDataService.ts`:** The data hub of the app. It handles all API calls to Alpha Vantage and the SEC for fetching market data.
*   **`fallbackData.ts`:** This service provides realistic, simulated data for every API call in the application. It is used automatically if an API key is not provided, ensuring a seamless user experience for demos and development.
*   **`cacheService.ts`:** A simple in-memory cache with a Time-to-Live (TTL) reduces redundant API calls for data that doesn't change frequently (e.g., news, stock analysis), improving performance and saving API quota.

### Data Flow & Polling

The app stays up-to-date with a smart polling mechanism initiated in `App.tsx` which fetches prices more frequently for the user's active portfolio (every 30 seconds) than for their watchlist (every 2 minutes).

## 📁 File Structure

```
.
├── components/
│   ├── icons/              # SVG icon components
│   ├── App.tsx             # Core application logic and state management
│   ├── DashboardPage.tsx   # Main user dashboard
│   ├── Header.tsx          # Top navigation bar
│   ├── ...                 # Other UI components
├── contexts/
│ └── ThemeContext.tsx    # Manages light/dark theme
├── services/
│   ├── financialDataService.ts # All calls to Alpha Vantage & SEC
│   ├── ...                 # Other data and utility services
├── types.ts                # All TypeScript interfaces and type definitions
├── process.env.js          # API key configuration (user-provided)
├── index.html              # Main HTML entry point
├── index.tsx               # React application entry point
└── README.md               # This file
```

## 🤝 Contributing

Contributions are welcome! Please feel free to fork the repository, make changes, and submit a pull request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📜 License

This project is licensed under the MIT License.
