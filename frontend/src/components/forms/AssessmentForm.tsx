'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle } from 'lucide-react';
import api from '@/services/api';

interface AssessmentFormProps {
    patientId: string;
    initialData?: any;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function AssessmentForm({ patientId, initialData, onSuccess, onCancel }: AssessmentFormProps) {
    const [loading, setLoading] = useState(false);
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [prakriti, setPrakriti] = useState('');
    const [vikriti, setVikriti] = useState('');
    const [healthHistory, setHealthHistory] = useState('');

    useEffect(() => {
        if (initialData) {
            if (initialData.assessment) {
                setAge(initialData.assessment.age?.toString() || '');
                setGender(initialData.assessment.gender || '');
                setPrakriti(initialData.assessment.prakriti || '');
                setVikriti(initialData.assessment.vikriti || '');
            }
            setHealthHistory(initialData.healthHistory || '');
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.put(`/patients/${patientId}`, {
                assessment: {
                    age: parseInt(age),
                    gender,
                    prakriti,
                    vikriti
                },
                healthHistory
            });

            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error saving assessment:', error);
            alert('Failed to save assessment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Age</label>
                    <Input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        required
                        placeholder="e.g., 30"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Gender</label>
                    <Select value={gender} onValueChange={setGender} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Prakriti (Body Constitution)</label>
                <Select value={prakriti} onValueChange={setPrakriti} required>
                    <SelectTrigger>
                        <SelectValue placeholder="Select your constitution" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="Vata">Vata (Air/Ether)</SelectItem>
                        <SelectItem value="Pitta">Pitta (Fire/Water)</SelectItem>
                        <SelectItem value="Kapha">Kapha (Earth/Water)</SelectItem>
                        <SelectItem value="Vata-Pitta">Vata-Pitta</SelectItem>
                        <SelectItem value="Pitta-Kapha">Pitta-Kapha</SelectItem>
                        <SelectItem value="Vata-Kapha">Vata-Kapha</SelectItem>
                        <SelectItem value="Tridosha">Tridosha (Balanced)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Vikriti (Current Imbalance)</label>
                <Select value={vikriti} onValueChange={setVikriti} required>
                    <SelectTrigger>
                        <SelectValue placeholder="Select current imbalance" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="Vata">Vata (Anxiety, Dryness, Bloating)</SelectItem>
                        <SelectItem value="Pitta">Pitta (Acidity, Heat, Anger)</SelectItem>
                        <SelectItem value="Kapha">Kapha (Lethargy, Weight Gain, Congestion)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Health History / Notes</label>
                <textarea
                    className="w-full min-h-[100px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                    placeholder="Any existing conditions, allergies, or concerns..."
                    value={healthHistory}
                    onChange={(e) => setHealthHistory(e.target.value)}
                />
            </div>

            <div className="flex gap-3">
                <Button
                    type="submit"
                    className="flex-1 bg-[#2E7D32] hover:bg-[#1B5E20]"
                    disabled={loading}
                >
                    {loading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                        'Save Assessment'
                    )}
                </Button>
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
}
