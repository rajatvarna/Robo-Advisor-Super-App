
import * as React from 'react';
import type { ApiMode } from '../types';

interface ApiContextType {
    apiMode: ApiMode;
    setApiMode: React.Dispatch<React.SetStateAction<ApiMode>>;
    isFallbackMode: boolean;
}

const ApiContext = React.createContext<ApiContextType | undefined>(undefined);

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [apiMode, setApiMode] = React.useState<ApiMode>('gemini');
    const isFallbackMode = apiMode === 'opensource';
    
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
