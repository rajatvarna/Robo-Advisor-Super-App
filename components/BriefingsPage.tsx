

import * as React from 'react';
import { generateVideoBriefing, getVideoOperationStatus } from '../services/geminiService';
import type { Holding, ApiMode } from '../types';
import Spinner from './icons/Spinner';
import VideoIcon from './icons/VideoIcon';
import { useApi } from '../contexts/ApiContext';

interface BriefingsPageProps {
    holdings: Holding[];
}

const API_KEY = process.env.API_KEY;

const BriefingsPage: React.FC<BriefingsPageProps> = ({ holdings }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = React.useState('');
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
    const { apiMode, setApiMode, isFallbackMode } = useApi();

    const loadingMessages = [
        "AI is analyzing the market...",
        "Writing the briefing script...",
        "Gathering visual assets...",
        "Rendering video frames... (this can take a minute)",
        "Applying finishing touches...",
        "Almost there! Preparing your video..."
    ];

    React.useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const handleApiError = (err: any) => {
        if (err.message.includes('QUOTA_EXCEEDED')) {
            setApiMode('opensource');
            setError("Live AI quota exceeded. Switched to offline fallback mode for this feature.");
        } else {
            setError(err.message || "An unexpected error occurred.");
        }
        setIsLoading(false);
    };

    const pollOperation = (operation: any, currentApiMode: ApiMode) => {
        let messageIndex = 0;
        setLoadingMessage(loadingMessages[messageIndex]);

        intervalRef.current = setInterval(async () => {
            try {
                const updatedOperation = await getVideoOperationStatus(operation, currentApiMode);
                if (updatedOperation.done) {
                    clearInterval(intervalRef.current!);
                    const downloadLink = updatedOperation.response?.generatedVideos?.[0]?.video?.uri;
                    if (downloadLink) {
                        setVideoUrl(`${downloadLink}&key=${API_KEY}`);
                    } else if (isFallbackMode) {
                        setVideoUrl('https://storage.googleapis.com/generative-ai-vision/veo-demo-videos/prompt-with-video/a_cinematic_shot_of_a_woman_walking_through_a_paddy_field_in_the_paddy_field.mp4');
                    }
                    else {
                        setError("Video generation completed, but no video URL was returned.");
                    }
                    setIsLoading(false);
                } else {
                    messageIndex = (messageIndex + 1) % loadingMessages.length;
                    setLoadingMessage(loadingMessages[messageIndex]);
                }
            } catch (err: any) {
                clearInterval(intervalRef.current!);
                handleApiError(err);
            }
        }, 10000);
    };

    const handleGenerateVideo = async (type: 'daily' | 'weekly') => {
        setIsLoading(true);
        setError(null);
        setVideoUrl(null);

        let prompt = '';
        if (type === 'daily') {
            prompt = `Create a 60-second daily market briefing video for today. Cover the main indices (S&P 500, Nasdaq, Dow Jones), highlight key market-moving news, and mention one or two top-performing sectors. Use a professional, news-anchor style. Use dynamic charts and graphics.`;
        } else {
            const holdingTickers = holdings.map(h => h.ticker).join(', ');
            prompt = `Create a 60-second personalized weekly portfolio review video. The portfolio consists of these stocks: ${holdingTickers}. Summarize the overall weekly performance of this specific portfolio, highlight the best and worst performing stocks within it, and mention one key news item that affected one of the holdings. Use a friendly and encouraging tone.`;
        }
        
        try {
            const initialOperation = await generateVideoBriefing(prompt, apiMode);
            pollOperation(initialOperation, apiMode);
        } catch (err: any) {
            handleApiError(err);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center">
                    <Spinner />
                    <p className="mt-4 text-brand-text-secondary">{loadingMessage}</p>
                </div>
            );
        }
        if (error) {
            return <div className="text-center text-red-400 p-4 bg-red-900/20 rounded-lg">{error}</div>;
        }
        if (videoUrl) {
            return (
                <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-brand-border">
                    <video src={videoUrl} controls autoPlay className="w-full h-full" />
                </div>
            );
        }
        return (
            <div className="text-center text-brand-text-secondary">
                <VideoIcon className="w-24 h-24 mx-auto opacity-20" />
                <p className="mt-4 text-lg">Select a briefing type to get started.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-brand-text">AI Video Briefings</h1>
                <p className="mt-2 text-brand-text-secondary">Your personalized market news, generated on-demand by AI.</p>
            </div>
            <div className="bg-brand-secondary p-6 rounded-lg border border-brand-border shadow-lg">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => handleGenerateVideo('daily')}
                        disabled={isLoading}
                        className="px-6 py-3 font-semibold rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors flex items-center justify-center disabled:bg-brand-accent/50 disabled:cursor-not-allowed"
                    >
                        Generate Daily Market Summary
                    </button>
                    <button
                        onClick={() => handleGenerateVideo('weekly')}
                        disabled={isLoading || holdings.length === 0}
                        className="px-6 py-3 font-semibold rounded-lg bg-brand-secondary border border-brand-border text-brand-text hover:bg-brand-border transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Generate My Weekly Portfolio Review
                    </button>
                </div>
                {holdings.length === 0 && <p className="text-center text-xs text-brand-text-secondary mt-2">Add holdings to your portfolio to enable weekly reviews.</p>}
            </div>

            <div className="bg-brand-secondary p-6 rounded-lg border border-brand-border min-h-[400px] flex items-center justify-center">
                {renderContent()}
            </div>
        </div>
    );
};

export default BriefingsPage;
