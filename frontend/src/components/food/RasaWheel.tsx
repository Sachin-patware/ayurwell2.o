'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface RasaWheelProps {
    rasas: {
        sweet: number;
        sour: number;
        salty: number;
        pungent: number;
        bitter: number;
        astringent: number;
    };
}

export function RasaWheel({ rasas }: RasaWheelProps) {
    const data = [
        { name: 'Sweet (Madhura)', value: rasas.sweet, color: '#FFD700' }, // Gold
        { name: 'Sour (Amla)', value: rasas.sour, color: '#FFA500' }, // Orange
        { name: 'Salty (Lavana)', value: rasas.salty, color: '#87CEEB' }, // Light Blue
        { name: 'Pungent (Katu)', value: rasas.pungent, color: '#FF4500' }, // Red-Orange
        { name: 'Bitter (Tikta)', value: rasas.bitter, color: '#90EE90' }, // Light Green
        { name: 'Astringent (Kashaya)', value: rasas.astringent, color: '#D2B48C' }, // Tan
    ];

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="black" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
