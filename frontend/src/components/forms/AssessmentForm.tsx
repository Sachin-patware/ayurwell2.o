'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'react-toastify';

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
    const [activityLevel, setActivityLevel] = useState('');
    const [sleepPattern, setSleepPattern] = useState('');
    const [healthHistory, setHealthHistory] = useState('');
    const [medicalConditions, setMedicalConditions] = useState('');
    const [lifestyle, setLifestyle] = useState('');
    const [dietaryHabits, setDietaryHabits] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (initialData) {
            if (initialData.assessment) {
                setAge(initialData.assessment.age?.toString() || '');
                setGender(initialData.assessment.gender || '');
                setPrakriti(initialData.assessment.prakriti || '');
                setVikriti(initialData.assessment.vikriti || '');
                setActivityLevel(initialData.assessment.activityLevel || initialData.activityLevel || '');
                setSleepPattern(initialData.assessment.sleepPattern || initialData.sleepPattern || '');
            }
            setHealthHistory(initialData.healthHistory || '');
            setMedicalConditions(initialData.medicalConditions || '');
            setLifestyle(initialData.lifestyle || '');
            setDietaryHabits(initialData.dietaryHabits || '');
            setSymptoms(initialData.symptoms || '');
            setNotes(initialData.notes || '');
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Create new assessment using the new API
            await api.post('/appointments/assessments', {
                patientId,
                assessment: {
                    age: parseInt(age),
                    gender,
                    prakriti,
                    vikriti,
                    activityLevel,
                    sleepPattern
                },
                activityLevel,
                sleepPattern,
                healthHistory,
                medicalConditions,
                lifestyle,
                dietaryHabits,
                symptoms,
                notes
            });

            toast.success('Assessment saved successfully!');

            // Clear form
            setAge('');
            setGender('');
            setPrakriti('');
            setVikriti('');
            setHealthHistory('');
            setMedicalConditions('');
            setLifestyle('');
            setDietaryHabits('');
            setSymptoms('');
            setNotes('');

            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error('Error saving assessment:', error);
            toast.error('Failed to save assessment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border-2 border-blue-200">
                <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Age *</label>
                        <Input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            required
                            placeholder="e.g., 30"
                            className="border-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Gender *</label>
                        <Select value={gender} onValueChange={setGender} required>
                            <SelectTrigger className="border-2">
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
            </div>

            {/* Ayurvedic Assessment */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
                <h3 className="font-bold text-green-800 mb-4">Ayurvedic Assessment</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Prakriti (Body Constitution) *</label>
                        <Select value={prakriti} onValueChange={setPrakriti} required>
                            <SelectTrigger className="border-2">
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
                        <label className="text-sm font-medium text-gray-700">Vikriti (Current Imbalance) — Optional</label>
                        <Select value={vikriti} onValueChange={setVikriti}>
                            <SelectTrigger className="border-2">
                                <SelectValue placeholder="Select current imbalance" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="Auto Detect">Auto Detect (Recommended)</SelectItem>
                                <SelectItem value="Vata">Vata (Anxiety, Dryness, Bloating)</SelectItem>
                                <SelectItem value="Pitta">Pitta (Acidity, Heat, Anger)</SelectItem>
                                <SelectItem value="Kapha">Kapha (Lethargy, Weight Gain, Congestion)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Activity Level *</label>
                        <Select value={activityLevel} onValueChange={setActivityLevel} required>
                            <SelectTrigger className="border-2">
                                <SelectValue placeholder="Select activity level" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="Sedentary">Sedentary</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Moderate">Moderate</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Very High">Very High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Sleep Pattern *</label>
                        <Select value={sleepPattern} onValueChange={setSleepPattern} required>
                            <SelectTrigger className="border-2">
                                <SelectValue placeholder="Select sleep pattern" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="Regular">Regular</SelectItem>
                                <SelectItem value="Light Sleep">Light Sleep</SelectItem>
                                <SelectItem value="Disturbed Sleep">Disturbed Sleep</SelectItem>
                                <SelectItem value="Irregular Sleep">Irregular Sleep</SelectItem>
                                <SelectItem value="Insomnia">Insomnia</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Detailed Information */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Health History</label>
                    <textarea
                        className="w-full min-h-[80px] px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                        placeholder="Previous illnesses, surgeries, family history..."
                        value={healthHistory}
                        onChange={(e) => setHealthHistory(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Medical Conditions</label>
                    <textarea
                        className="w-full min-h-[80px] px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                        placeholder="Current medical conditions, allergies, medications..."
                        value={medicalConditions}
                        onChange={(e) => setMedicalConditions(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Lifestyle</label>
                    <textarea
                        className="w-full min-h-[80px] px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                        placeholder="Daily routine, sleep patterns, exercise, stress levels..."
                        value={lifestyle}
                        onChange={(e) => setLifestyle(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Dietary Habits</label>
                    <textarea
                        className="w-full min-h-[80px] px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                        placeholder="Eating patterns, food preferences, restrictions..."
                        value={dietaryHabits}
                        onChange={(e) => setDietaryHabits(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Current Symptoms</label>
                    <textarea
                        className="w-full min-h-[80px] px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                        placeholder="Current symptoms, complaints, concerns..."
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Doctor's Notes</label>
                    <textarea
                        className="w-full min-h-[80px] px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-yellow-50"
                        placeholder="Additional observations, recommendations..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
                <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg"
                    disabled={loading}
                >
                    {loading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                        <><CheckCircle className="mr-2 h-4 w-4" /> Save Assessment</>
                    )}
                </Button>
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="border-2"
                    >
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
}
