
import * as React from 'react';
import type { Achievement } from '../types';
import TrophyIcon from './icons/TrophyIcon';

interface AchievementsListProps {
    achievements: Achievement[];
}

const AchievementBadge: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
    const isUnlocked = achievement.unlocked;
    return (
        <div 
            className={`text-center p-2 rounded-lg transition-all duration-300 ${isUnlocked ? 'bg-yellow-500/10' : 'bg-brand-primary/50'}`}
            title={`${achievement.title}: ${achievement.description}${isUnlocked ? ` (Unlocked on ${new Date(achievement.unlockedAt!).toLocaleDateString()})` : ''}`}
        >
            <TrophyIcon className={`w-10 h-10 mx-auto ${isUnlocked ? 'text-yellow-400' : 'text-brand-text-secondary opacity-30'}`} />
            <p className={`text-xs mt-1 font-semibold ${isUnlocked ? 'text-yellow-300' : 'text-brand-text-secondary'}`}>{achievement.title}</p>
        </div>
    )
}

const AchievementsList: React.FC<AchievementsListProps> = ({ achievements }) => {
    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border shadow-lg transition-shadow duration-300 hover:shadow-xl">
            <div className="flex justify-between items-baseline mb-3">
                <h3 className="text-lg font-bold text-brand-text">Achievements</h3>
                <p className="text-sm text-brand-text-secondary">{unlockedCount} / {achievements.length} Unlocked</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {achievements.map(ach => <AchievementBadge key={ach.id} achievement={ach} />)}
            </div>
        </div>
    );
};

export default React.memo(AchievementsList);