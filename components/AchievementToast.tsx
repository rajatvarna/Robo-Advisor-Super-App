
import * as React from 'react';
import type { Achievement } from '../types';
import TrophyIcon from './icons/TrophyIcon';

interface AchievementToastProps {
    achievement: Achievement;
    onDismiss: () => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onDismiss }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [achievement, onDismiss]);

    return (
        <div 
            className="fixed bottom-5 right-5 z-50 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-lg shadow-2xl p-4 flex items-center gap-4 animate-fade-in-up"
            role="alert"
        >
            <TrophyIcon className="w-10 h-10 flex-shrink-0" />
            <div>
                <p className="font-bold">Achievement Unlocked!</p>
                <p className="text-sm">{achievement.title}</p>
            </div>
            <button onClick={onDismiss} className="text-white/70 hover:text-white">&times;</button>
        </div>
    );
};

export default AchievementToast;
