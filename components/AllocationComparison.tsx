import * as React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
// FIX: Imported missing PortfolioAllocation type.
import type { PortfolioAllocation } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface AllocationComparisonProps {
    current: { name: string; value: number }[];
    recommended: PortfolioAllocation;
}

const AllocationComparison: React.FC<AllocationComparisonProps> = ({ current, recommended }) => {
    const { theme } = useTheme();

    const gridColor = theme === 'dark' ? '#374151' : '#E5E7EB';
    const textColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';
    const tooltipBg = theme === 'dark' ? '#1F2937' : '#FFFFFF';
    const tooltipBorder = theme === 'dark' ? '#374151' : '#E5E7EB';
    const currentBarColor = theme === 'dark' ? '#6B7280' : '#A0AEC0';
    const recommendedBarColor = theme === 'dark' ? '#38BDF8' : '#2563EB';

    const processData = () => {
        const recommendedFormatted = Object.entries(recommended).map(([key, value]) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'), // Add space before capital letters for names like 'realEstate'
            value: value,
        }));

        const allKeys = [...new Set([
            ...current.map(item => item.name), 
            ...recommendedFormatted.map(item => item.name)
        ])];

        return allKeys.map(key => {
            const currentItem = current.find(item => item.name === key);
            const recommendedItem = recommendedFormatted.find(item => item.name === key);
            return {
                name: key,
                Current: currentItem ? currentItem.value : 0,
                Recommended: recommendedItem ? recommendedItem.value : 0,
            };
        });
    };

    const data = processData();

    return (
        <div>
            <h3 className="text-xl font-bold mb-4 text-brand-text">Allocation Strategy: Current vs. Recommended</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis type="number" stroke={textColor} tickFormatter={(value) => `${value}%`} />
                        <YAxis type="category" dataKey="name" stroke={textColor} width={110} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value) => `${(value as number).toFixed(1)}%`}
                          cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
                          contentStyle={{
                              backgroundColor: tooltipBg,
                              borderColor: tooltipBorder,
                              borderRadius: '0.5rem',
                              color: textColor
                          }}
                        />
                        <Legend wrapperStyle={{ color: textColor }} />
                        <Bar dataKey="Current" fill={currentBarColor} />
                        <Bar dataKey="Recommended" fill={recommendedBarColor} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default React.memo(AllocationComparison);