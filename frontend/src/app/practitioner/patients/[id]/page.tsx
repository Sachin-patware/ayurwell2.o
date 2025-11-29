'use client';

import { useState, useEffect } from 'react';
import PractitionerLayout from '@/components/layouts/PractitionerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DoshaWheel } from '@/components/charts/DoshaWheel';
import { PrakritiGraph } from '@/components/charts/PrakritiGraph';
import { FileText, Calendar, MessageSquare, Activity, Plus, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import AssessmentForm from '@/components/forms/AssessmentForm';
import api from '@/services/api';

export default function PatientDetailPage() {
    const params = useParams();
    const [activeTab, setActiveTab] = useState('overview');
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchPatient = async () => {
        try {
            const response = await api.get(`/patients/${params.id}`);
            setPatient(response.data);
        } catch (error) {
            console.error('Error fetching patient:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchPatient();
        }
    }, [params.id]);

    if (loading) {
        return (
            <PractitionerLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="h-12 w-12 animate-spin text-[#2E7D32]" />
                </div>
            </PractitionerLayout>
        );
    }

    if (!patient) {
        return (
            <PractitionerLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Patient not found</h2>
                </div>
            </PractitionerLayout>
        );
    }

    return (
        <PractitionerLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">{patient.name}</h2>
                        <p className="text-gray-500">
                            {patient.assessment?.age || 'N/A'} years • {patient.assessment?.gender || 'N/A'} • {patient.patientId}
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <Button variant="outline">
                            <MessageSquare className="mr-2 h-4 w-4" /> Message
                        </Button>
                        <Button className="bg-[#2E7D32] hover:bg-[#1B5E20]">
                            <FileText className="mr-2 h-4 w-4" /> Generate Diet
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-white border p-1 rounded-lg">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="assessment">Assessment</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                        <TabsTrigger value="diet">Diet Plans</TabsTrigger>
                        <TabsTrigger value="reports">Lab Reports</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {patient.assessment?.prakriti ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Prakriti Analysis */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Prakriti Analysis (Constitution)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-8">
                                            <h3 className="text-2xl font-bold text-[#2E7D32]">{patient.assessment.prakriti}</h3>
                                            <p className="text-gray-500 mt-2">Dominant Dosha</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Vikriti Analysis */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Vikriti (Current Imbalance)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-8">
                                            <h3 className="text-2xl font-bold text-[#E07A5F]">{patient.assessment.vikriti || 'None'}</h3>
                                            <p className="text-gray-500 mt-2">Current Imbalance</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <p className="text-gray-500 mb-4">No assessment data available.</p>
                                    <Button onClick={() => setActiveTab('assessment')}>Go to Assessment</Button>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Medical History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                        {patient.healthHistory || 'No medical history recorded.'}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="assessment">
                        <Card>
                            <CardHeader>
                                <CardTitle>Patient Assessment</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <AssessmentForm
                                    patientId={patient.patientId}
                                    initialData={patient}
                                    onSuccess={() => {
                                        fetchPatient();
                                        alert('Assessment updated successfully');
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Consultation History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-gray-500">
                                    No consultation history available.
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="diet">
                        <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">No Diet Plans Yet</h3>
                            <p className="text-gray-500 mb-4">Create a personalized diet plan for this patient.</p>
                            <Button className="bg-[#2E7D32] hover:bg-[#1B5E20]">
                                <Plus className="mr-2 h-4 w-4" /> Create Diet Plan
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="reports">
                        <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                            <Activity className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">No Reports Uploaded</h3>
                            <Button variant="outline" className="mt-4">
                                Upload Report
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </PractitionerLayout>
    );
}
