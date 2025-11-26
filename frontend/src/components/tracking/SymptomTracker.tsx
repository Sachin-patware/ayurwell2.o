'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface SymptomProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
}

function SymptomSlider({ label, value, onChange }: SymptomProps) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between">
                <Label className="text-sm font-medium text-gray-700">{label}</Label>
                <span className="text-sm font-bold text-[#E07A5F]">{value}/10</span>
            </div>
            <Slider
                defaultValue={[value]}
                max={10}
                step={1}
                onValueChange={(vals) => onChange(vals[0])}
                className="py-2"
            />
        </div>
    );
}

export function SymptomTracker() {
    const [symptoms, setSymptoms] = useState({
        energy: 6,
        appetite: 7,
        sleep: 5,
        digestion: 8
    });

    const updateSymptom = (key: string, value: number) => {
        setSymptoms(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6">
            <SymptomSlider
                label="Energy Level"
                value={symptoms.energy}
                onChange={(v) => updateSymptom('energy', v)}
            />
            <SymptomSlider
                label="Appetite"
                value={symptoms.appetite}
                onChange={(v) => updateSymptom('appetite', v)}
            />
            <SymptomSlider
                label="Sleep Quality"
                value={symptoms.sleep}
                onChange={(v) => updateSymptom('sleep', v)}
            />
            <SymptomSlider
                label="Digestion"
                value={symptoms.digestion}
                onChange={(v) => updateSymptom('digestion', v)}
            />
        </div>
    );
}
