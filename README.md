# Robo Advisor Super App

Welcome to the Robo Advisor Super App, a feature-rich, AI-powered financial dashboard designed to provide comprehensive portfolio analysis, deep-dive stock research, and personalized, actionable insights. This application leverages the power of the Google Gemini API to transform raw financial data into an intelligent, proactive co-pilot for your investment journey.

![Robo Advisor Super App Screenshot](https://storage.googleapis.com/maker-suite-media/projects/project-examples/finance-dashboard-hero.png)

## ✨ Core Features

This application is packed with features that cater to both novice and experienced investors:

*   **🤖 AI-Powered Dashboard:** At the heart of the app, the dashboard provides a dynamic overview of your financial health.
    *   **AI Daily Briefing:** Proactively generated insights on your portfolio's performance, concentration, and goal progress.
    *   **Portfolio Score:** An AI-calculated score (1-100) evaluating your portfolio's diversification and quality.
    *   **Personalized News ("For You"):** A curated news feed based on your holdings and watchlists, updated throughout the day.
    *   **Goal Tracking:** Set financial goals and visualize your progress.

*   **📈 Comprehensive Portfolio Management:**
    *   **Guest Mode with Local Persistence:** The app operates in a seamless guest mode. All your data (portfolio, watchlists, etc.) is saved directly to your browser's local storage, ensuring a persistent experience across sessions without needing an account.
    *   Track holdings, transactions, and overall net worth.
    *   Visualize sector allocation with interactive pie charts.
    *   Manually add new holdings and transactions.

*   **🔍 In-depth Stock Research:**
    *   Analyze any stock with an AI-generated overview, bull/bear cases, and financial health score.
    *   View interactive historical price charts via the TradingView integration.
    *   Access 10 years of AI-summarized financial statements (Income, Balance Sheet, Cash Flow).
    *   Review recent SEC filings and earnings call transcripts.
    *   Compare up to 5 stocks side-by-side with a detailed, AI-generated analysis.

*   **🧠 AI-Driven Tools:**
    *   **AI Robo Advisor (Premium):** Answer a simple questionnaire to receive a personalized asset allocation suggestion and rationale.
    *   **AI Chatbot:** An interactive assistant that can answer financial questions and even analyze uploaded images of charts or portfolios.
    *   **"What-If" Scenario Tool:** Simulate a trade to see its potential impact on your portfolio score before you act.

*   **🌐 Market & Analytics Suite:**
    *   **Stock Screener:** Find new investment opportunities using a powerful, AI-driven screener with multiple criteria.
    *   **Crypto Dashboard:** Track the top 25 cryptocurrencies and stay updated with the latest crypto news.
    *   **Advanced Analytics:**
        *   Compare your portfolio's performance against the S&P 500 benchmark.
        *   Forecast upcoming dividend income.
        *   Identify potential tax-loss harvesting opportunities.
    *   **Smart Alerts:** Receive AI-generated notifications for significant price movements, news events, or portfolio changes.

*   **⚙️ Modern UX & Integrations:**
    *   **Monetization Ready:** Built-in freemium model with a subscription page and premium feature gating.
    *   **Brokerage Sync (Simulated):** "Connect" to Interactive Brokers to sync your portfolio automatically.
    *   **Light/Dark Mode:** A sleek, modern interface with theme support.
    *   **Gamification:** Unlock achievements for reaching financial milestones.
    *   **Onboarding Tour:** A guided tour for new users to discover key features.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Tailwind CSS
*   **Charting:** Recharts, TradingView Lightweight Charts API
*   **Primary AI:** **Google Gemini API** (`@google/genai`)
*   **Financial Data:** **Finnhub API** (for real-time quotes and historical prices)
*   **Module Management:** ES Modules with `importmap` (via esm.sh CDN)

## 🚀 Getting Started

This project is a static web application and does not require a complex build process. You can run it with any local web server.

### Prerequisites

To run the application in live mode with AI features, you will need API keys from two services:

1.  **Google Gemini API Key:** Get your key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  **Finnhub API Key:** Get a free key from [Finnhub.io](https://finnhub.io/).

> The app will function in a robust offline "fallback mode" with simulated data if keys are not provided.

### Installation & Configuration

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/robo-advisor-super-app.git
    cd robo-advisor-super-app
    ```

2.  **Configure API Keys:**
    *   Open the `process.env.js` file in the root directory.
    *   Replace the placeholder values for `API_KEY` (Gemini) and `FINNHUB_API_KEY` with your actual keys.
    ```javascript
    // process.env.js
    
    // Replace with your Google Gemini API Key
    export const API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
        
    // Replace with your Finnhub API Key
    export const FINNHUB_API_KEY = 'YOUR_FINNHUB_API_KEY_HERE';
    ```

3.  **Run the application:**
    Use a simple local server to host the files. A popular choice is the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension for Visual Studio Code.
    *   Install the extension.
    *   Right-click `index.html` and select "Open with Live Server".

The application should now be running in your browser!

## 🏛️ Architecture & Key Concepts

### Graceful Fallback Mode

A core architectural feature is the app's ability to function without live API keys.

*   **`ApiContext`:** A global context that tracks the current API mode (`gemini` or `opensource`).
*   **Error Handling:** Services like `geminiService` and `financialDataService` are designed to catch specific API errors (e.g., `QUOTA_EXCEEDED`).
*   **Automatic Switch:** Upon detecting a quota error, the `ApiContext` is updated to `'opensource'` mode.
*   **`fallbackData.ts`:** This service provides realistic, simulated data for every API call in the application. When in `opensource` mode, components receive this mock data instead of making live API requests.
*   **`ApiStatusBanner`:** A banner appears at the top of the app to inform the user they are in fallback mode and allows them to retry the live connection.

This ensures a seamless user experience for demos and development, and provides resilience against API service interruptions.

### Service-Oriented Architecture

The application logic is cleanly separated into a `services` directory, abstracting away the data-fetching and AI processing from the UI components.

*   **`geminiService.ts`:** The AI brain of the app. It handles all prompt engineering, API calls to Gemini, and JSON parsing for qualitative data.
*   **`financialDataService.ts`:** Fetches quantitative market data (prices, history) from Finnhub.
*   **`cacheService.ts`:** A simple in-memory cache with a Time-to-Live (TTL) reduces redundant API calls for data that doesn't change frequently (e.g., news, stock analysis), improving performance and saving costs.

### Data Flow & Polling

The app stays up-to-date with two primary polling mechanisms initiated in `App.tsx`:

1.  **Price Updates (Tiered):** A smart polling system fetches prices more frequently for the user's active portfolio (every 30 seconds) than for their watchlist (every 2 minutes).
2.  **AI Data Refresh:** A main refresh loop fetches new personalized news, dashboard insights, portfolio alerts, and recalculates the portfolio score.

## 📁 File Structure

```
.
├── components/
│   ├── icons/              # SVG icon components
│   ├── App.tsx             # Core application logic and state management
│   ├── Chatbot.tsx         # AI chat interface
│   ├── DashboardPage.tsx   # Main user dashboard
│   ├── Header.tsx          # Top navigation bar
│   ├── ...                 # Other UI components
├── contexts/
│   ├── ApiContext.tsx      # Manages API mode (live vs. fallback)
│   └── ThemeContext.tsx    # Manages light/dark theme
├── services/
│   ├── geminiService.ts    # All calls to the Google Gemini API
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

This project is licensed under the MIT License. See the `LICENSE` file for details.