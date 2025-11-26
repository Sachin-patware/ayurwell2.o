'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PatientLayout from '@/components/layouts/PatientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, Edit } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function AssessmentPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [hasExistingAssessment, setHasExistingAssessment] = useState(false);
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [prakriti, setPrakriti] = useState('');
    const [vikriti, setVikriti] = useState('');
    const [healthHistory, setHealthHistory] = useState('');

    // Fetch existing assessment data
    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                const userId = user?.uid;
                if (!userId) return;

                const response = await api.get(`/patients/${userId}`);
                const patientData = response.data;

                // If assessment exists, populate the form
                if (patientData.assessment) {
                    const assessment = patientData.assessment;
                    setAge(assessment.age?.toString() || '');
                    setGender(assessment.gender || '');
                    setPrakriti(assessment.prakriti || '');
                    setVikriti(assessment.vikriti || '');
                    setHealthHistory(patientData.healthHistory || '');
                    setHasExistingAssessment(true);
                }
            } catch (error) {
                console.error('Error fetching assessment:', error);
            } finally {
                setFetchingData(false);
            }
        };

        if (user) {
            fetchAssessment();
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const userId = user?.uid;
            if (!userId) {
                alert('User not authenticated');
                return;
            }

            await api.put(`/patients/${userId}`, {
                assessment: {
                    age: parseInt(age),
                    gender,
                    prakriti,
                    vikriti
                },
                healthHistory
            });

            alert(hasExistingAssessment ? 'Assessment updated successfully!' : 'Assessment saved successfully!');
            router.push('/patient/dashboard');
        } catch (error) {
            console.error('Error saving assessment:', error);
            alert('Failed to save assessment');
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) {
        return (
            <PatientLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-[#2E7D32]" />
                </div>
            </PatientLayout>
        );
    }

    return (
        <PatientLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Health Assessment</h2>
                    <p className="text-gray-500 mt-1">
                        {hasExistingAssessment
                            ? 'Review and update your health assessment information.'
                            : 'Complete your profile so your doctor can generate a personalized diet plan.'}
                    </p>
                </div>

                {hasExistingAssessment && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-green-900">Assessment Completed</h3>
                            <p className="text-sm text-green-700 mt-1">
                                You can review and update your information below.
                            </p>
                        </div>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Personal Details</CardTitle>
                            {hasExistingAssessment && (
                                <div className="flex items-center text-sm text-gray-500">
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit Mode
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
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
                                        <SelectContent>
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
                                    <SelectContent>
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
                                    <SelectContent>
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
                                        hasExistingAssessment ? 'Update Assessment' : 'Save Assessment'
                                    )}
                                </Button>
                                {hasExistingAssessment && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.push('/patient/dashboard')}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PatientLayout>
    );
}
