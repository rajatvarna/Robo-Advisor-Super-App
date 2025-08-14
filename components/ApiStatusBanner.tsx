
import * as React from 'react';
import { useApi } from '../contexts/ApiContext';

const ApiStatusBanner: React.FC = () => {
    const { isFallbackMode, setApiMode } = useApi();

    if (!isFallbackMode) {
        return null;
    }

    const handleRetry = () => {
        setApiMode('gemini');
    };

    return (
        <div className="bg-yellow-500 text-yellow-900 text-sm font-semibold p-2 text-center flex items-center justify-center gap-4 z-20">
            <span>⚠️ You are in Offline Fallback Mode due to API limits. Data is simulated.</span>
            <button
                onClick={handleRetry}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded-md text-white transition-colors"
            >
                Retry Live AI
            </button>
        </div>
    );
};

export default ApiStatusBanner;
