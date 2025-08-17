

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
    
    const pollingTimeoutRef = React.useRef<number | null>(null);
    const messageIndexRef = React.useRef(0);

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
            if (pollingTimeoutRef.current) {
                clearTimeout(pollingTimeoutRef.current);
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

    const pollOperation = async (operation: any) => {
        // Rotate and set the loading message
        messageIndexRef.current = (messageIndexRef.current + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndexRef.current]);

        try {
            const updatedOperation = await getVideoOperationStatus(operation, apiMode);

            if (updatedOperation.done) {
                const downloadLink = updatedOperation.response?.generatedVideos?.[0]?.video?.uri;
                if (downloadLink) {
                    setVideoUrl(`${downloadLink}&key=${API_KEY}`);
                } else if (isFallbackMode) {
                    setVideoUrl('https://storage.googleapis.com/generative-ai-vision/veo-demo-videos/prompt-with-video/a_cinematic_shot_of_a_woman_walking_through_a_paddy_field_in_the_paddy_field.mp4');
                } else {
                    setError("Video generation completed, but no video URL was returned.");
                }
                setIsLoading(false);
            } else {
                // Not done, schedule the next poll with the *updated* operation object
                pollingTimeoutRef.current = window.setTimeout(() => pollOperation(updatedOperation), 10000);
            }
        } catch (err: any) {
            if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
            handleApiError(err);
        }
    };


    const handleGenerateVideo = async (type: 'daily' | 'weekly') => {
        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        
        // Clear any existing polling timeout before starting a new one
        if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
        }

        messageIndexRef.current = 0;
        setLoadingMessage(loadingMessages[0]);

        let prompt = '';
        if (type === 'daily') {
            prompt = `Create a simulated 60-second "daily market briefing" style video for a fictional news channel. Cover the general performance of major US indices like the S&P 500 and Nasdaq, highlight one or two key fictional market-moving news events, and mention a top-performing sector. Use a professional, news-anchor style with dynamic charts and graphics.`;
        } else {
            const holdingTickers = holdings.map(h => h.ticker).join(', ');
            prompt = `Create a 60-second, friendly, and encouraging video that simulates a personalized weekly portfolio review. The video should be styled like a financial update for a user. Base the simulation on a fictional portfolio containing these stocks: ${holdingTickers}. The script should invent a plausible summary of the portfolio's weekly performance, highlighting one or two fictional best and worst performers. It can also mention a fictional key news item that might have affected one of the holdings. The goal is to create an illustrative, engaging video, not real-time financial advice.`;
        }
        
        try {
            const initialOperation = await generateVideoBriefing(prompt, apiMode);
            pollOperation(initialOperation);
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
