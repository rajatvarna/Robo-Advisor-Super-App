
import * as React from 'react';
import type { ApiMode } from '../types';
import { API_KEY } from '../process.env.js';

interface ApiContextType {
    apiMode: ApiMode;
    setApiMode: React.Dispatch<React.SetStateAction<ApiMode>>;
    isFallbackMode: boolean;
}

const ApiContext = React.createContext<ApiContextType | undefined>(undefined);

const isValidGeminiKey = API_KEY && (API_KEY as string) !== 'YOUR_GEMINI_API_KEY_HERE' && (API_KEY as string) !== 'DEMO_API_KEY';

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [apiMode, setApiMode] = React.useState<ApiMode>(isValidGeminiKey ? 'gemini' : 'opensource');
    const isFallbackMode = apiMode === 'opensource';

    // This effect ensures that if the user tries to switch to 'gemini' mode (e.g., via a "Retry" button)
    // but the key is still invalid, it will revert back to 'opensource' mode.
    React.useEffect(() => {
        if (!isValidGeminiKey && apiMode === 'gemini') {
            setApiMode('opensource');
        }
    }, [apiMode]);
    
    return (
        <ApiContext.Provider value={{ apiMode, setApiMode, isFallbackMode }}>
            {children}
        </ApiContext.Provider>
    );
};

export const useApi = (): ApiContextType => {
    const context = React.useContext(ApiContext);
    if (context === undefined) {
        throw new Error('useApi must be used within an ApiProvider');
    }
    return context;
};
