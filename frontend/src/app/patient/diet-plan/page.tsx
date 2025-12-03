'use client';

import { useEffect, useState } from 'react';
import PatientLayout from '@/components/layouts/PatientLayout';
import { DietPlanViewer } from '@/components/diet/DietPlanViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Share2, Loader2, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';


export default function PatientDietPlanPage() {
    const { user } = useAuth();
    const [plan, setPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDietPlan();
    }, []);

    const fetchDietPlan = async () => {
        try {
            setLoading(true);
            const userId = user?.uid;

            if (!userId) {
                setError('User not logged in');
                return;
            }

            // Fetch diet plans for this patient
            const response = await api.get(`/diet-plans/${userId}`);

            if (response.data && response.data.length > 0) {
                // Get the most recent plan
                const latestPlan = response.data[0];
                setPlan({
                    ...latestPlan.content,
                    publishedAt: latestPlan.publishedAt,
                    id: latestPlan.id
                });
            } else {
                setError('No diet plan assigned yet. Please contact your doctor.');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load diet plan');
            console.error('Error fetching diet plan:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        // TODO: Implement PDF generation
        toast.success('PDF download feature coming soon!');
    };

    const handleShare = () => {
        // TODO: Implement sharing
        toast.success('Sharing feature coming soon!');
    };

    return (
        <PatientLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">My Diet Plan</h2>
                        <p className="text-gray-500 mt-1">Personalized Ayurvedic meal schedule</p>
                        {plan && (
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                {plan.publishedAt && (
                                    <span>Published: {new Date(plan.publishedAt).toLocaleDateString()}</span>
                                )}
                                {plan.status === 'active' && <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active Plan</span>}
                                {plan.status === 'completed' && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Completed</span>}
                                {plan.status === 'cancelled' && <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">Cancelled</span>}
                            </div>
                        )}
                    </div>
                    {plan && (
                        <div className="flex space-x-3">
                            <Button variant="outline" onClick={handleShare}>
                                <Share2 className="mr-2 h-4 w-4" /> Share
                            </Button>
                            <Button className="bg-[#2E7D32] hover:bg-[#1B5E20]" onClick={handleDownloadPDF}>
                                <Download className="mr-2 h-4 w-4" /> Download PDF
                            </Button>
                        </div>
                    )}
                </div>

                {loading && (
                    <Card>
                        <CardContent className="p-12 flex flex-col items-center justify-center">
                            <Loader2 className="h-12 w-12 animate-spin text-[#2E7D32] mb-4" />
                            <p className="text-gray-600">Loading your diet plan...</p>
                        </CardContent>
                    </Card>
                )}

                {error && !loading && (
                    <Card className="border-amber-300 bg-amber-50">
                        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                            <AlertCircle className="h-12 w-12 text-amber-600 mb-4" />
                            <h3 className="text-lg font-semibold text-amber-900 mb-2">No Diet Plan Available</h3>
                            <p className="text-amber-700 mb-6">{error}</p>
                            <p className="text-sm text-amber-600">
                                Your practitioner will create a personalized plan based on your assessment.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {plan && !loading && (
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <DietPlanViewer plan={plan} />
                    </div>
                )}
            </div>
        </PatientLayout>
    );
}
