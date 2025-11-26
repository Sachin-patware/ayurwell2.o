'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Droplets } from 'lucide-react';

export function WaterTracker() {
    const [cups, setCups] = useState(0);
    const goal = 8;

    const percentage = Math.min((cups / goal) * 100, 100);

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="relative h-40 w-40">
                {/* Background Circle */}
                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                        className="text-gray-200"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                    />
                    {/* Progress Circle */}
                    <circle
                        className="text-blue-500 transition-all duration-500 ease-in-out"
                        strokeWidth="8"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * percentage) / 100}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Droplets className="h-6 w-6 text-blue-500 mb-1" />
                    <span className="text-2xl font-bold text-gray-900">{cups}</span>
                    <span className="text-xs text-gray-500">of {goal} cups</span>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCups(Math.max(0, cups - 1))}
                    className="h-10 w-10 rounded-full border-gray-300"
                >
                    <Minus className="h-4 w-4" />
                </Button>
                <Button
                    onClick={() => setCups(cups + 1)}
                    className="h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
