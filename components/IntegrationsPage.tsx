

import * as React from 'react';
import type { DashboardData } from '../types';
import Spinner from './icons/Spinner';

interface IntegrationsPageProps {
    data: DashboardData | null;
    onSync: (brokerage: 'Interactive Brokers') => Promise<void>;
    onDisconnect: (brokerage: 'Interactive Brokers') => void;
}

const InteractiveBrokersCard: React.FC<IntegrationsPageProps> = ({ data, onSync, onDisconnect }) => {
    const [isSyncing, setIsSyncing] = React.useState(false);
    const integrationData = data?.integrations?.interactiveBrokers;

    const handleSync = async () => {
        setIsSyncing(true);
        await onSync('Interactive Brokers');
        setIsSyncing(false);
    };

    return (
        <div className="bg-brand-secondary p-6 rounded-lg border border-brand-border shadow-lg">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Interactive_Brokers_logo.svg/2560px-Interactive_Brokers_logo.svg.png" alt="Interactive Brokers Logo" className="h-8" />
                    <h3 className="text-xl font-bold text-brand-text">Interactive Brokers</h3>
                </div>
                {integrationData?.connected && (
                     <span className="text-xs font-semibold px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Connected</span>
                )}
            </div>
            <p className="text-sm text-brand-text-secondary mt-4">
                Automatically sync your holdings and transactions from your Interactive Brokers account. Your portfolio will be overwritten with the data from your brokerage.
            </p>
            <div className="mt-6 pt-4 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4">
                {integrationData?.connected ? (
                    <>
                        <p className="text-xs text-brand-text-secondary">
                            Last synced: {integrationData.lastSync ? new Date(integrationData.lastSync).toLocaleString() : 'Never'}
                        </p>
                        <div className="flex gap-2">
                             <button
                                onClick={() => onDisconnect('Interactive Brokers')}
                                disabled={isSyncing}
                                className="px-4 py-2 text-sm font-semibold rounded-md bg-brand-primary text-red-500 hover:bg-red-500/10 border border-brand-border transition-colors"
                            >
                                Disconnect
                            </button>
                             <button
                                onClick={handleSync}
                                disabled={isSyncing}
                                className="px-4 py-2 text-sm font-semibold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors flex items-center gap-2 disabled:bg-brand-accent/50"
                            >
                                {isSyncing && <Spinner />}
                                Sync Now
                            </button>
                        </div>
                    </>
                ) : (
                     <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="w-full sm:w-auto px-6 py-2 text-sm font-semibold rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors flex items-center justify-center gap-2 disabled:bg-brand-accent/50"
                    >
                        {isSyncing && <Spinner />}
                        Connect Account
                    </button>
                )}
            </div>
        </div>
    );
};


const IntegrationsPage: React.FC<IntegrationsPageProps> = (props) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-brand-text">Brokerage Integrations</h1>
                <p className="mt-2 text-brand-text-secondary">Connect your brokerage accounts to automatically sync your portfolio.</p>
            </div>
            <div className="space-y-6">
                <InteractiveBrokersCard {...props} />
                {/* Future brokerages can be added here as new cards */}
            </div>
        </div>
    );
};

export default IntegrationsPage;