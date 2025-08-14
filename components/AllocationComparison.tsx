import * as React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import type { PortfolioAllocation } from '../types';

interface AllocationComparisonProps {
    current: { name: string; value: number }[];
    recommended: PortfolioAllocation;
}

const AllocationComparison: React.FC<AllocationComparisonProps> = ({ current, recommended }) => {
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                        <XAxis type="number" stroke="#8B949E" tickFormatter={(value) => `${value}%`} />
                        <YAxis type="category" dataKey="name" stroke="#8B949E" width={110} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value) => `${(value as number).toFixed(1)}%`}
                          cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                          contentStyle={{
                              backgroundColor: '#161B22',
                              borderColor: '#30363D',
                              borderRadius: '0.5rem',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Current" fill="#8B949E" />
                        <Bar dataKey="Recommended" fill="#0088FE" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AllocationComparison;
