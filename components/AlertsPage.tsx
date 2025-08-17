

import * as React from 'react';
import type { Alert } from '../types';
import BellIcon from './icons/BellIcon';

interface AlertsPageProps {
    alerts: Alert[];
    onMarkAllRead: () => void;
}

const formatTimeAgo = (isoDate: string | null): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const AlertIcon: React.FC<{ type: Alert['type'], severity: Alert['severity'] }> = ({ type, severity }) => {
    const colorClasses: Record<Alert['severity'], string> = {
        'Info': 'text-blue-400',
        'Warning': 'text-yellow-400',
        'Critical': 'text-red-400',
    };
    const baseClass = `w-6 h-6 flex-shrink-0 ${colorClasses[severity]}`;

    switch(type) {
        case 'Price': return <svg xmlns="http://www.w3.org/2000/svg" className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
        case 'News': return <svg xmlns="http://www.w3.org/2000/svg" className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h9M7 16h6M7 8h6v4H7V8z" /></svg>;
        case 'Portfolio': return <svg xmlns="http://www.w3.org/2000/svg" className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
        case 'Goal': return <svg xmlns="http://www.w3.org/2000/svg" className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        default: return <BellIcon className={baseClass} />;
    }
}


const AlertsPage: React.FC<AlertsPageProps> = ({ alerts, onMarkAllRead }) => {

    const sortedAlerts = React.useMemo(() => {
        return [...alerts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [alerts]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-brand-text">Smart Alerts</h1>
                    <p className="mt-2 text-brand-text-secondary">AI-powered notifications about your portfolio and the market.</p>
                </div>
                <button 
                    onClick={onMarkAllRead}
                    disabled={alerts.every(a => a.read)}
                    className="px-4 py-2 text-sm font-semibold rounded-md bg-brand-secondary text-brand-text hover:bg-brand-border disabled:opacity-50 transition-colors"
                >
                    Mark All as Read
                </button>
            </div>

            <div className="bg-brand-secondary rounded-lg border border-brand-border shadow-lg">
                <div className="divide-y divide-brand-border">
                    {sortedAlerts.length > 0 ? sortedAlerts.map(alert => (
                        <div key={alert.id} className={`p-4 flex items-start gap-4 ${alert.read ? 'opacity-60' : 'bg-brand-primary'}`}>
                            <AlertIcon type={alert.type} severity={alert.severity} />
                            <div className="flex-grow">
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-bold text-brand-text">{alert.title}</h3>
                                    <span className="text-xs text-brand-text-secondary">{formatTimeAgo(alert.timestamp)}</span>
                                </div>
                                <p className="text-sm text-brand-text-secondary mt-1">{alert.description}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center p-12 text-brand-text-secondary">
                            <BellIcon className="w-16 h-16 mx-auto opacity-20" />
                            <h3 className="mt-4 text-xl font-bold text-brand-text">All Clear!</h3>
                            <p>You have no new alerts. We'll notify you when something important happens.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlertsPage;
