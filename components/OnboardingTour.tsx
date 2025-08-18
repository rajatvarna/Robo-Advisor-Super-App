
import * as React from 'react';
import Joyride, { Step } from 'react-joyride';
import { useTheme } from '../contexts/ThemeContext';

interface OnboardingTourProps {
    run: boolean;
    onTourEnd: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ run, onTourEnd }) => {
    const { theme } = useTheme();

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
            target: '#ai-tools-dropdown',
            content: "Explore our AI Tools, like the AI Advisor and Chatbot, to get personalized guidance and answers to your financial questions.",
            placement: 'bottom',
        },
    ];

    const tourStyles = {
        options: {
            arrowColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            overlayColor: theme === 'dark' ? 'rgba(13, 17, 23, 0.8)' : 'rgba(0, 0, 0, 0.5)',
            primaryColor: theme === 'dark' ? '#38BDF8' : '#2563EB',
            textColor: theme === 'dark' ? '#F9FAFB' : '#111827',
            zIndex: 1000,
        },
        tooltip: {
            border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
            borderRadius: '8px',
        },
        buttonClose: {
            color: '#9CA3AF',
        },
        buttonNext: {
            backgroundColor: theme === 'dark' ? '#38BDF8' : '#2563EB',
            borderRadius: '6px',
            fontSize: '14px',
            padding: '8px 16px',
        },
        buttonBack: {
            color: '#9CA3AF',
        },
        buttonSkip: {
            color: '#9CA3AF',
            fontSize: '14px'
        }
    };


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
            styles={tourStyles}
        />
    );
};

export default OnboardingTour;
