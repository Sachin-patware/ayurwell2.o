'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProgressData {
    date: string;
    waterIntake: number;
    mealAdherence: number;
    weight?: number;
}

interface ProgressChartProps {
    data: ProgressData[];
    type: 'adherence' | 'water' | 'weight';
}

export function ProgressChart({ data, type }: ProgressChartProps) {
    // Format data for charts
    const chartData = data.map(d => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        waterIntake: d.waterIntake || 0,
        mealAdherence: d.mealAdherence || 0,
        weight: d.weight || 0
    })).reverse(); // Show oldest to newest

    const renderChart = () => {
        switch (type) {
            case 'adherence':
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis
                                dataKey="date"
                                stroke="#6B7280"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke="#6B7280"
                                style={{ fontSize: '12px' }}
                                domain={[0, 100]}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="mealAdherence"
                                stroke="#2E7D32"
                                strokeWidth={3}
                                name="Meal Adherence (%)"
                                dot={{ fill: '#2E7D32', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'water':
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis
                                dataKey="date"
                                stroke="#6B7280"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke="#6B7280"
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            <Bar
                                dataKey="waterIntake"
                                fill="#3B82F6"
                                name="Water Intake (glasses)"
                                radius={[8, 8, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'weight':
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis
                                dataKey="date"
                                stroke="#6B7280"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke="#6B7280"
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="weight"
                                stroke="#E07A5F"
                                strokeWidth={3}
                                name="Weight (kg)"
                                dot={{ fill: '#E07A5F', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'adherence': return 'Meal Adherence Trend';
            case 'water': return 'Daily Water Intake';
            case 'weight': return 'Weight Progress';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">{getTitle()}</CardTitle>
            </CardHeader>
            <CardContent>
                {chartData.length > 0 ? (
                    renderChart()
                ) : (
                    <div className="h-[250px] flex items-center justify-center text-gray-400">
                        <p>No data available yet. Start tracking your progress!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
