'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface PrakritiGraphProps {
    data: {
        subject: string;
        A: number; // Current/Vikriti
        B: number; // Original/Prakriti
        fullMark: number;
    }[];
}

export function PrakritiGraph({ data }: PrakritiGraphProps) {
    // Example data structure:
    // [
    //   { subject: 'Vata', A: 120, B: 110, fullMark: 150 },
    //   { subject: 'Pitta', A: 98, B: 130, fullMark: 150 },
    //   { subject: 'Kapha', A: 86, B: 130, fullMark: 150 },
    // ]

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} />
                    <Radar
                        name="Vikriti (Current)"
                        dataKey="A"
                        stroke="#E07A5F"
                        fill="#E07A5F"
                        fillOpacity={0.6}
                    />
                    <Radar
                        name="Prakriti (Original)"
                        dataKey="B"
                        stroke="#A2B38B"
                        fill="#A2B38B"
                        fillOpacity={0.6}
                    />
                    <Tooltip />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
