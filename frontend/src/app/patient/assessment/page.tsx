'use client';

import { useState, useEffect } from 'react';
import PatientLayout from '@/components/layouts/PatientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssessmentCard } from '@/components/assessments/AssessmentCard';
import { FileText, Loader2, Info } from 'lucide-react';
import api from '@/services/api';

export default function PatientAssessmentPage() {
    const [assessments, setAssessments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [patientId, setPatientId] = useState<string>('');

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                // First get current user's patient ID
                const userResponse = await api.get('/auth/me');
                const userId = userResponse.data.uid;
                setPatientId(userId);

                // Then fetch all assessments for this patient
                const response = await api.get(`/appointments/assessments/patient/${userId}`);
                setAssessments(response.data.assessments || []);
            } catch (error) {
                console.error('Error fetching assessments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssessments();
    }, []);

    if (loading) {
        return (
            <PatientLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="h-12 w-12 animate-spin text-[#2E7D32]" />
                </div>
            </PatientLayout>
        );
    }

    return (
        <PatientLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8" />
                        <div>
                            <h2 className="text-3xl font-bold">My Assessments</h2>
                            <p className="text-green-50 mt-1">
                                View your health assessment history
                            </p>
                        </div>
                    </div>
                </div>

                {/* Assessments List */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Assessment History</CardTitle>
                            <span className="text-sm text-gray-500">
                                {assessments.length} {assessments.length === 1 ? 'assessment' : 'assessments'}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {assessments.length > 0 ? (
                            <div className="space-y-4">
                                {assessments.map((assessment) => (
                                    <AssessmentCard
                                        key={assessment.assessmentId}
                                        assessment={assessment}
                                        showPatientName={false}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="bg-blue-50 p-4 rounded-full inline-flex mb-4">
                                    <Info className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    No Assessments Yet
                                </h3>
                                <p className="text-gray-600 max-w-md mx-auto">
                                    Your health assessments will appear here after your doctor completes them during your consultation.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PatientLayout>
    );
}
