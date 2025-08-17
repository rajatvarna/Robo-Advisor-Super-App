

import * as React from 'react';
import Joyride, { Step } from 'react-joyride';

interface OnboardingTourProps {
    run: boolean;
    onTourEnd: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ run, onTourEnd }) => {
    const steps: Step[] = [
        {
            target: '#dashboard-nav-link',
            content: 'Welcome to your Robo Advisor! This is your Dashboard, the command center for your financial journey.',
            placement: 'bottom',
        },
        {
            target: '#net-worth-card',
            content: 'Here you can see a high-level overview of your finances, including your Net Worth and daily performance.',
            placement: 'bottom',
        },
        {
            target: '#portfolio-score-card',
            content: 'Our AI analyzes your portfolio and gives it a score based on diversification and other factors. Keep an eye on it!',
            placement: 'bottom',
        },
        {
            target: '#personalized-news-feed',
            content: 'Stay informed with a personalized news feed, curated by AI based on your holdings and watchlist.',
            placement: 'top',
        },
        {
            target: '#achievements-list',
            content: 'Track your progress and unlock achievements as you reach new financial milestones!',
            placement: 'top',
        },
        {
            target: '#portfolio-nav-link',
            content: 'The Portfolio page gives you a detailed breakdown of your holdings and sector allocation.',
            placement: 'bottom',
        },
        {
            target: '#research-nav-link',
            content: 'Ready to find your next investment? Use our powerful Research page to analyze any stock with AI.',
            placement: 'bottom',
        },
        {
            target: '#advisor-nav-link',
            content: "Need guidance? The AI Advisor asks a few questions to suggest a personalized investment plan for you.",
            placement: 'bottom',
        },
        {
            target: '#chatbot-nav-link',
            content: "Have any questions? Our AI Chatbot is available 24/7 to help you with financial concepts or app features.",
            placement: 'bottom',
        },
    ];

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showProgress
            showSkipButton
            callback={({ status }) => {
                if (['finished', 'skipped'].includes(status as string)) {
                    onTourEnd();
                }
            }}
            styles={{
                options: {
                    arrowColor: '#161B22',
                    backgroundColor: '#161B22',
                    overlayColor: 'rgba(13, 17, 23, 0.8)',
                    primaryColor: '#2F81F7',
                    textColor: '#E6EDF3',
                    zIndex: 1000,
                },
                tooltip: {
                    border: '1px solid #30363D',
                    borderRadius: '8px',
                },
                buttonClose: {
                    color: '#8B949E',
                },
                buttonNext: {
                    backgroundColor: '#2F81F7',
                    borderRadius: '6px',
                    fontSize: '14px',
                    padding: '8px 16px',
                },
                buttonBack: {
                    color: '#8B949E',
                },
                buttonSkip: {
                    color: '#8B949E',
                    fontSize: '14px'
                }
            }}
        />
    );
};

export default OnboardingTour;