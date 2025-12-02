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
import { AssessmentCard } from '@/components/assessments/AssessmentCard';
import api from '@/services/api';
import { toast } from 'react-toastify';
import Link from 'next/link';



export default function PatientDetailPage() {
    const params = useParams();
    const [activeTab, setActiveTab] = useState('overview');
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [assessments, setAssessments] = useState<any[]>([]);
    const [loadingAssessments, setLoadingAssessments] = useState(false);
    const [dietPlans, setDietPlans] = useState<any[]>([]);
    const [loadingDietPlans, setLoadingDietPlans] = useState(false);

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

    const fetchAssessments = async () => {
        if (!params.id) return;

        try {
            setLoadingAssessments(true);
            const response = await api.get(`/appointments/assessments/patient/${params.id}`);
            setAssessments(response.data.assessments || []);
        } catch (error) {
            console.error('Error fetching assessments:', error);
        } finally {
            setLoadingAssessments(false);
        }
    };

    const fetchDietPlans = async () => {
        if (!params.id) return;

        try {
            setLoadingDietPlans(true);
            const response = await api.get(`/diet-plans/${params.id}`);
            setDietPlans(response.data || []);
        } catch (error) {
            console.error('Error fetching diet plans:', error);
            setDietPlans([]);
        } finally {
            setLoadingDietPlans(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchPatient();
            fetchAssessments();
            fetchDietPlans();
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
                {/* Enhanced Header with Gradient Background */}
                <div className="bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-2xl border-2 border-white/30">
                                {patient.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold">{patient.name}</h2>
                                <div className="flex items-center gap-3 mt-1 text-white/90">
                                    {assessments.length > 0 && assessments[0].assessment?.age && (
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            {assessments[0].assessment.age} years
                                        </span>
                                    )}
                                    {assessments.length > 0 && assessments[0].assessment?.gender && (
                                        <span>• {assessments[0].assessment.gender}</span>
                                    )}
                                    <span className="font-mono text-sm">• {patient.patientId}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Link href={`/practitioner/diet-plans/create?patientId=${patient.patientId}`}>
                                <Button className="bg-white text-[#2E7D32] hover:bg-white/90">
                                    <FileText className="mr-2 h-4 w-4" /> Generate Diet
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Cards */}
                {assessments.length > 0 && assessments[0].assessment && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {assessments[0].assessment.prakriti && (
                            <Card className="border-l-4 border-l-[#2E7D32]">
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-500 mb-1">Prakriti</p>
                                    <p className="text-xl font-bold text-[#2E7D32]">{assessments[0].assessment.prakriti}</p>
                                </CardContent>
                            </Card>
                        )}
                        {assessments[0].assessment.vikriti && (
                            <Card className="border-l-4 border-l-[#E07A5F]">
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-500 mb-1">Vikriti</p>
                                    <p className="text-xl font-bold text-[#E07A5F]">{assessments[0].assessment.vikriti}</p>
                                </CardContent>
                            </Card>
                        )}
                        <Card className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                                <p className="text-sm text-gray-500 mb-1">Assessments</p>
                                <p className="text-xl font-bold text-blue-600">{assessments.length}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-purple-500">
                            <CardContent className="p-4">
                                <p className="text-sm text-gray-500 mb-1">Diet Plans</p>
                                <p className="text-xl font-bold text-purple-600">{dietPlans.length}</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-gray-100 p-1.5 rounded-xl inline-flex gap-1 w-full md:w-auto">
                        <TabsTrigger
                            value="overview"
                            className="data-[state=active]:bg-white data-[state=active]:text-[#2E7D32] data-[state=active]:shadow-sm px-6 py-2.5 rounded-lg font-medium transition-all data-[state=active]:font-semibold"
                        >
                            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="assessment"
                            className="data-[state=active]:bg-white data-[state=active]:text-[#2E7D32] data-[state=active]:shadow-sm px-6 py-2.5 rounded-lg font-medium transition-all data-[state=active]:font-semibold"
                        >
                            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            Assessment
                        </TabsTrigger>
                        <TabsTrigger
                            value="history"
                            className="data-[state=active]:bg-white data-[state=active]:text-[#2E7D32] data-[state=active]:shadow-sm px-6 py-2.5 rounded-lg font-medium transition-all data-[state=active]:font-semibold"
                        >
                            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            History
                        </TabsTrigger>
                        <TabsTrigger
                            value="diet"
                            className="data-[state=active]:bg-white data-[state=active]:text-[#2E7D32] data-[state=active]:shadow-sm px-6 py-2.5 rounded-lg font-medium transition-all data-[state=active]:font-semibold"
                        >
                            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Diet Plans
                        </TabsTrigger>
                        <TabsTrigger
                            value="reports"
                            className="data-[state=active]:bg-white data-[state=active]:text-[#2E7D32] data-[state=active]:shadow-sm px-6 py-2.5 rounded-lg font-medium transition-all data-[state=active]:font-semibold"
                        >
                            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Lab Reports
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {assessments.length > 0 && assessments[0].assessment ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Prakriti Card */}
                                <Card className="bg-gradient-to-br from-[#E9F7EF] to-white border-[#2E7D32]">
                                    <CardHeader>
                                        <CardTitle className="text-[#2E7D32] flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Prakriti (Constitution)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-4">
                                            <h3 className="text-3xl font-bold text-[#2E7D32]">{assessments[0].assessment.prakriti}</h3>
                                            <p className="text-sm text-gray-600 mt-2">Natural Body Constitution</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Vikriti Card */}
                                <Card className="bg-gradient-to-br from-[#FFF3E0] to-white border-[#E07A5F]">
                                    <CardHeader>
                                        <CardTitle className="text-[#E07A5F] flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Vikriti (Imbalance)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-4">
                                            <h3 className="text-3xl font-bold text-[#E07A5F]">{assessments[0].assessment.vikriti || 'Balanced'}</h3>
                                            <p className="text-sm text-gray-600 mt-2">Current Dosha State</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Demographics Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-gray-700 flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Demographics
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <span className="text-gray-500">Age</span>
                                            <span className="font-medium">{assessments[0].assessment.age} years</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <span className="text-gray-500">Gender</span>
                                            <span className="font-medium capitalize">{assessments[0].assessment.gender}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Last Assessment</span>
                                            <span className="font-medium text-sm">
                                                {new Date(assessments[0].createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
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

                        <div className="space-y-6">
                            {/* Contact Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2h-5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Contact Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
                                                <p className="font-medium text-gray-900">{patient.email || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-green-50 rounded-lg text-green-600">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</p>
                                                <p className="font-medium text-gray-900">{patient.phone || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-purple-50 rounded-lg text-purple-600">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                                </svg>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</p>
                                                <p className="font-medium text-gray-900 truncate font-mono text-sm" title={patient.patientId}>{patient.patientId}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Medical History */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Medical History & Clinical Notes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {(assessments[0].healthHistory || assessments[0].medicalConditions) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {assessments[0].healthHistory && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                        Health History
                                                    </h4>
                                                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{assessments[0].healthHistory}</p>
                                                </div>
                                            )}
                                            {assessments[0].medicalConditions && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                        Medical Conditions
                                                    </h4>
                                                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{assessments[0].medicalConditions}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {(assessments[0].lifestyle || assessments[0].dietaryHabits || assessments[0].symptoms) && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {assessments[0].lifestyle && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                        Lifestyle
                                                    </h4>
                                                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{assessments[0].lifestyle}</p>
                                                </div>
                                            )}
                                            {assessments[0].dietaryHabits && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                                        Dietary Habits
                                                    </h4>
                                                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{assessments[0].dietaryHabits}</p>
                                                </div>
                                            )}
                                            {assessments[0].symptoms && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                                        Symptoms
                                                    </h4>
                                                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{assessments[0].symptoms}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!assessments[0].healthHistory && !assessments[0].medicalConditions &&
                                        !assessments[0].lifestyle && !assessments[0].dietaryHabits && !assessments[0].symptoms && (
                                            <div className="text-center py-8 text-gray-500">
                                                No medical history recorded in the latest assessment.
                                            </div>
                                        )}
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
                                        fetchAssessments();

                                        setActiveTab('history');
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history">
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
                                {loadingAssessments ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-[#2E7D32]" />
                                    </div>
                                ) : assessments.length > 0 ? (
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
                                    <div className="text-center py-12 text-gray-500">
                                        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                        <p>No assessment history available.</p>
                                        <Button
                                            onClick={() => setActiveTab('assessment')}
                                            className="mt-4 bg-[#2E7D32] hover:bg-[#1B5E20]"
                                        >
                                            Create First Assessment
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="diet">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Diet Plans</CardTitle>
                                    <Link href={`/practitioner/diet-plans/create?patientId=${patient.patientId}`}>
                                        <Button className="bg-[#2E7D32] hover:bg-[#1B5E20]">
                                            <Plus className="mr-2 h-4 w-4" /> Create Diet Plan
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingDietPlans ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-[#2E7D32]" />
                                    </div>
                                ) : dietPlans.length > 0 ? (
                                    <div className="space-y-4">
                                        {dietPlans.map((plan: any) => (
                                            <Card key={plan.id} className="border-l-4 border-l-[#2E7D32]">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h4 className="font-semibold text-gray-900">
                                                                    Diet Plan
                                                                </h4>
                                                                <span className={`px-2 py-1 text-xs rounded-full ${plan.status === 'published'
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-yellow-100 text-yellow-700'
                                                                    }`}>
                                                                    {plan.status === 'published' ? 'Published' : 'Draft'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-2">
                                                                Created: {new Date(plan.generatedAt).toLocaleDateString('en-IN', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </p>
                                                            {plan.content?.summary && (
                                                                <p className="text-sm text-gray-700 line-clamp-2">
                                                                    {plan.content.summary}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <Link href={`/practitioner/diet-plans/create?edit=${plan.id}&patientId=${patient.patientId}`}>
                                                            <Button variant="outline" size="sm">
                                                                View Details
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Diet Plans Yet</h3>
                                        <p className="text-gray-500 mb-4">Create a personalized diet plan for this patient.</p>
                                        <Link href={`/practitioner/diet-plans/create?patientId=${patient.patientId}`}>
                                            <Button className="bg-[#2E7D32] hover:bg-[#1B5E20]">
                                                <Plus className="mr-2 h-4 w-4" /> Create Diet Plan
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
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
