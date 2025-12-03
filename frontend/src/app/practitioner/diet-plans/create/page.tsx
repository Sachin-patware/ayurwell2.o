'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PractitionerLayout from '@/components/layouts/PractitionerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DietPlanViewer } from '@/components/diet/DietPlanViewer';
import { MealEditor } from '@/components/diet/MealEditor';
import { Loader2, Sparkles, Save, Send, ArrowLeft, Clock, Edit, AlertCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { formatDateIST } from '@/lib/dateUtils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'react-toastify';

interface Patient {
    id: string;
    patientId: string;
    name: string;
    assessment: {
        prakriti?: string;
        vikriti?: string;
        age?: number;
        gender?: string;
    };
}

function CreateDietPlanContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editPlanId = searchParams.get('edit');
    const initialPatientId = searchParams.get('patientId');

    const [patients, setPatients] = useState<Patient[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedPatientData, setSelectedPatientData] = useState<Patient | null>(null);
    const [latestAssessment, setLatestAssessment] = useState<any>(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [generatedPlan, setGeneratedPlan] = useState<any>(null);
    const [planId, setPlanId] = useState<string | null>(null);
    const [planStatus, setPlanStatus] = useState<string>('draft');

    const [activeTab, setActiveTab] = useState('preview');
    const [error, setError] = useState('');
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);
    const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Mode: 'view' (read-only), 'edit' (manual changes), 'create' (new plan)
    const [mode, setMode] = useState<'view' | 'edit' | 'create'>('create');

    // Initial meals for editor
    const [editorMeals, setEditorMeals] = useState([
        { id: 'breakfast', name: 'Breakfast', items: [], time: '08:00 AM' },
        { id: 'lunch', name: 'Lunch', items: [], time: '01:00 PM' },
        { id: 'snack', name: 'Afternoon Snack', items: [], time: '04:00 PM' },
        { id: 'dinner', name: 'Dinner', items: [], time: '07:00 PM' },
    ]);

    // Fetch patients on mount
    useEffect(() => {
        fetchPatients();
    }, []);

    // Handle initial load with params
    useEffect(() => {
        if (patients.length > 0) {
            if (editPlanId) {
                loadSpecificPlan(editPlanId);
            } else if (initialPatientId) {
                handlePatientChange(initialPatientId);
            }
        }
    }, [patients, editPlanId, initialPatientId]);

    const fetchPatients = async () => {
        try {
            setLoadingPatients(true);
            const response = await api.get('/appointments/doctor/patients');
            setPatients(response.data.patients || []);
        } catch (err: any) {
            setError('Failed to load patients');
            console.error(err);
        } finally {
            setLoadingPatients(false);
        }
    };

    const loadSpecificPlan = async (id: string) => {
        try {
            setLoadingPlan(true);
            // Try to get plan directly first (more robust)
            try {
                const response = await api.get(`/diet-plans/single/${id}`);
                const plan = response.data;

                if (plan) {
                    setSelectedPatient(plan.patientId);

                    // Fetch patient details and assessment in parallel (faster!)
                    const promises = [];

                    // Only fetch patients if not already loaded
                    if (patients.length === 0) {
                        promises.push(api.get('/appointments/doctor/patients'));
                    }

                    // Always fetch assessment for this patient
                    promises.push(api.get(`/appointments/assessments/patient/${plan.patientId}`));

                    const results = await Promise.all(promises);

                    // Process patient data if we fetched it
                    if (patients.length === 0 && results[0]) {
                        const allPatients = results[0].data.patients || [];
                        setPatients(allPatients);
                        const patient = allPatients.find((p: any) => p.patientId === plan.patientId);
                        setSelectedPatientData(patient || null);
                    } else {
                        // Use already loaded patients
                        const patient = patients.find(p => p.patientId === plan.patientId);
                        setSelectedPatientData(patient || null);
                    }

                    // Process assessment data
                    const assessmentResult = patients.length === 0 ? results[1] : results[0];
                    if (assessmentResult?.data.assessments && assessmentResult.data.assessments.length > 0) {
                        setLatestAssessment(assessmentResult.data.assessments[0]);
                    }

                    setGeneratedPlan(plan.content);
                    setPlanId(plan.id);
                    setPlanStatus(plan.status);
                    setLastSaved(new Date(plan.lastModified || plan.generatedAt));
                    setMode('view');

                    if (plan.content.mealPlan && plan.content.mealPlan.length > 0) {
                        const firstDay = plan.content.mealPlan[0];
                        const mappedMeals = firstDay.meals.map((m: any) => ({
                            id: m.type,
                            name: m.type.charAt(0).toUpperCase() + m.type.slice(1),
                            items: m.items.map((i: string) => ({ name: i })),
                            time: m.time
                        }));
                        setEditorMeals(prev => prev.map(p => {
                            const found = mappedMeals.find((m: any) => m.id === p.id);
                            return found || p;
                        }));
                    }
                    return;
                }
            } catch (singlePlanErr) {
                console.warn("Could not fetch single plan directly, trying fallback...", singlePlanErr);
            }

            // Fallback: Get all plans for the patient if we have patientId
            const pId = initialPatientId || selectedPatient;
            if (!pId) return;

            const response = await api.get(`/diet-plans/${pId}`);
            const plan = response.data.find((p: any) => p.id === id);

            if (plan) {
                // ... existing logic ...
                setSelectedPatient(plan.patientId);
                const patient = patients.find(p => p.patientId === plan.patientId);
                setSelectedPatientData(patient || null);

                setGeneratedPlan(plan.content);
                setPlanId(plan.id);
                setPlanStatus(plan.status);
                setLastSaved(new Date(plan.lastModified || plan.generatedAt));
                setMode('view');
                // ...
            }
        } catch (err) {
            console.error("Error loading plan:", err);
            setError("Failed to load the requested plan.");
        } finally {
            setLoadingPlan(false);
        }
    };

    const fetchAssessment = async (pId: string) => {
        try {
            const response = await api.get(`/appointments/assessments/patient/${pId}`);
            if (response.data.assessments && response.data.assessments.length > 0) {
                setLatestAssessment(response.data.assessments[0]);
            } else {
                setLatestAssessment(null);
            }
        } catch (error) {
            console.error('Error fetching assessment:', error);
            setLatestAssessment(null);
        }
    };

    const handlePatientChange = async (value: string) => {
        setSelectedPatient(value);
        const patient = patients.find(p => p.patientId === value);
        setSelectedPatientData(patient || null);
        fetchAssessment(value);

        if (!editPlanId) {
            setGeneratedPlan(null);
            setPlanId(null);
            setLastSaved(null);
            setMode('create');
            setEditorMeals([
                { id: 'breakfast', name: 'Breakfast', items: [], time: '08:00 AM' },
                { id: 'lunch', name: 'Lunch', items: [], time: '01:00 PM' },
                { id: 'snack', name: 'Afternoon Snack', items: [], time: '04:00 PM' },
                { id: 'dinner', name: 'Dinner', items: [], time: '07:00 PM' },
            ]);
        }
    };

    const handleGenerate = async () => {
        if (!selectedPatient) return;

        setIsGenerating(true);
        setError('');
        setRegenerateDialogOpen(false);

        try {
            const response = await api.post('/generate-diet', {
                patient_id: selectedPatient,
                assessment_data: latestAssessment
            });

            // Don't auto-save - let doctor decide to save or publish
            setGeneratedPlan(response.data.diet_plan);
            // Don't set planId yet - will be set when saved
            setPlanId(null);
            setPlanStatus('draft');
            setLastSaved(null);
            setActiveTab('preview');
            setMode('edit');

            if (response.data.diet_plan.mealPlan && response.data.diet_plan.mealPlan.length > 0) {
                const firstDay = response.data.diet_plan.mealPlan[0];
                const mappedMeals = firstDay.meals.map((m: any) => ({
                    id: m.type,
                    name: m.type.charAt(0).toUpperCase() + m.type.slice(1),
                    items: m.items.map((i: string) => ({ name: i })),
                    time: m.time
                }));
                setEditorMeals(prev => prev.map(p => {
                    const found = mappedMeals.find((m: any) => m.id === p.id);
                    return found || p;
                }));
            }

        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to generate diet plan');
            console.error('Error generating diet plan:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!generatedPlan || !selectedPatient) return;

        setIsSaving(true);
        setError('');

        try {
            const payload = {
                patient_id: selectedPatient,
                content: generatedPlan,
                plan_id: planId
            };

            const response = await api.post('/diet-plans/save-draft', payload);

            setPlanId(response.data.plan_id);
            setLastSaved(new Date());
            setPlanStatus('draft');

            if (mode === 'create') setMode('edit');

            toast.success('Diet plan saved as draft successfully!');

        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save plan');
            toast.error('Failed to save diet plan');
            console.error('Error saving plan:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        // If no planId, save first then publish
        if (!planId) {
            await handleSave();
            // Wait a bit for save to complete
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!planId && !generatedPlan) {
            toast.error('Please save the plan first');
            return;
        }

        setIsPublishing(true);

        try {
            // Use the planId from state or the one just saved
            const idToPublish = planId;
            if (!idToPublish) {
                throw new Error('No plan ID available');
            }

            await api.put(`/diet-plans/${idToPublish}/publish`);
            setPublishDialogOpen(false);
            toast.success('Diet plan published successfully!');
            router.push('/practitioner/diet-plans');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to publish diet plan');
            toast.error('Failed to publish diet plan');
            console.error('Error publishing plan:', err);
            setPublishDialogOpen(false);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleDelete = async () => {
        if (!planId) return;

        setIsDeleting(true);

        try {
            await api.delete(`/diet-plans/${planId}`);
            setDeleteDialogOpen(false);
            toast.success('Diet plan deleted successfully!');
            router.push('/practitioner/diet-plans');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to delete diet plan');
            toast.error('Failed to delete diet plan');
            console.error('Error deleting plan:', err);
            setDeleteDialogOpen(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleMealsChange = (newMeals: any[]) => {
        setEditorMeals(newMeals);

        if (generatedPlan) {
            const updatedPlan = JSON.parse(JSON.stringify(generatedPlan));

            if (updatedPlan.mealPlan && updatedPlan.mealPlan.length > 0) {
                updatedPlan.mealPlan.forEach((day: any) => {
                    day.meals = newMeals.map(m => ({
                        type: m.id,
                        time: m.time,
                        items: m.items.map((i: any) => {
                            if (typeof i === 'string') return { name: i };
                            return i;
                        })
                    }));
                });
            }

            setGeneratedPlan(updatedPlan);
        }
    };

    // Show loading state
    if (loadingPatients || loadingPlan) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-[#2E7D32]" />
                <p className="text-gray-600 text-lg">
                    {loadingPlan ? 'Loading diet plan...' : 'Loading patients...'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/practitioner/diet-plans">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">
                            {mode === 'create' ? 'Create Diet Plan' : mode === 'edit' ? 'Edit Diet Plan' : 'View Diet Plan'}
                        </h2>
                        <p className="text-gray-500">
                            {mode === 'view' ? 'Viewing existing plan' : 'Generate, customize, and publish'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Delete Button - only show when editing/viewing existing plan */}
                    {planId && (
                        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Plan
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Diet Plan?</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete this diet plan? This action cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                                    <Button
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
                                        ) : (
                                            'Delete'
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    {mode === 'view' ? (
                        <Button
                            onClick={() => setMode('edit')}
                            className="bg-[#2E7D32] hover:bg-[#1B5E20]"
                        >
                            <Edit className="mr-2 h-4 w-4" /> Edit Plan
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleSave}
                                disabled={!generatedPlan || isSaving}
                                className="border-[#2E7D32] text-[#2E7D32] hover:bg-[#E9F7EF]"
                            >
                                {isSaving ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="mr-2 h-4 w-4" /> Save as Draft</>
                                )}
                            </Button>

                            <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        className="bg-[#2E7D32] hover:bg-[#1B5E20]"
                                        disabled={!generatedPlan}
                                    >
                                        <Send className="mr-2 h-4 w-4" /> Publish to Patient
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Publish Diet Plan?</DialogTitle>
                                        <DialogDescription>
                                            This will make the diet plan visible to <strong>{selectedPatientData?.name}</strong> immediately.
                                            They will be able to view it in their dashboard.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
                                        <Button
                                            className="bg-[#2E7D32] hover:bg-[#1B5E20]"
                                            onClick={handlePublish}
                                            disabled={isPublishing}
                                        >
                                            {isPublishing ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</>
                                            ) : (
                                                'Confirm Publish'
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <Card className="border-red-300 bg-red-50">
                    <CardContent className="p-4 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <p className="text-red-700 text-sm">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Patient Information Card */}
            {selectedPatientData && (
                <Card className="border-2 border-[#2E7D32]/20 bg-gradient-to-br from-white to-green-50/30">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2 text-[#2E7D32]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Patient Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Patient Name & ID */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{selectedPatientData.name}</h3>
                                <p className="text-sm text-gray-500 font-mono mt-1">ID: {selectedPatientData.patientId}</p>
                            </div>
                            {latestAssessment && (
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Latest Assessment</p>
                                    <p className="text-sm font-medium text-[#2E7D32]">
                                        {formatDateIST(latestAssessment.createdAt, 'MMM d, yyyy')}

                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Assessment Data */}
                        {latestAssessment?.assessment && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-4 rounded-lg border border-green-200">
                                    <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Prakriti</p>
                                    <p className="text-lg font-bold text-green-900">{latestAssessment.assessment.prakriti || 'N/A'}</p>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 rounded-lg border border-orange-200">
                                    <p className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Vikriti</p>
                                    <p className="text-lg font-bold text-orange-900">{latestAssessment.assessment.vikriti || 'N/A'}</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-lg border border-blue-200">
                                    <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Age</p>
                                    <p className="text-lg font-bold text-blue-900">{latestAssessment.assessment.age || 'N/A'}</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-lg border border-purple-200">
                                    <p className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Gender</p>
                                    <p className="text-lg font-bold text-purple-900">{latestAssessment.assessment.gender || 'N/A'}</p>
                                </div>
                            </div>
                        )}

                        {/* Generate Button */}
                        {mode !== 'view' && (
                            <div className="pt-2">
                                <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            className="w-full bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] hover:from-[#1B5E20] hover:to-[#0D4A14] text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                            disabled={!selectedPatient || isGenerating || loadingPatients}
                                            size="lg"
                                        >
                                            {isGenerating ? (
                                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating AI-Powered Diet Plan...</>
                                            ) : (
                                                <><Sparkles className="mr-2 h-5 w-5" /> {generatedPlan ? 'Regenerate AI Diet Plan' : 'Generate AI-Powered Diet Plan'}</>
                                            )}
                                        </Button>
                                    </DialogTrigger>
                                    {generatedPlan ? (
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Regenerate Diet Plan?</DialogTitle>
                                                <DialogDescription>
                                                    This will create a new AI-generated plan and replace the current one. Any unsaved changes will be lost. Are you sure?
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setRegenerateDialogOpen(false)}>Cancel</Button>
                                                <Button className="bg-[#2E7D32] hover:bg-[#1B5E20]" onClick={handleGenerate}>Yes, Regenerate</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    ) : (
                                        <div className="hidden" ref={(el) => { if (el && !generatedPlan && regenerateDialogOpen) handleGenerate(); }}></div>
                                    )}
                                </Dialog>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {generatedPlan && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-white border p-1 rounded-lg">
                        <TabsTrigger value="preview">Preview Plan</TabsTrigger>
                        <TabsTrigger value="editor" disabled={mode === 'view'}>
                            Manual Editor {mode === 'view' && '(Enable Edit Mode)'}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="preview">
                        <Card>
                            <CardHeader className="bg-gradient-to-r from-[#E9F7EF] to-white">
                                <CardTitle className="text-[#2E7D32] flex items-center">
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    Diet Plan Preview
                                </CardTitle>
                                <p className="text-sm text-gray-600">
                                    {mode === 'view'
                                        ? "You are viewing the plan as the patient sees it."
                                        : "This is what the patient will see. Switch to 'Manual Editor' to make changes."}
                                </p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <DietPlanViewer plan={generatedPlan} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="editor">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Manual Meal Editor</CardTitle>
                                        <p className="text-sm text-gray-600">Drag and drop to customize the plan. Changes are auto-synced to preview.</p>
                                    </CardHeader>
                                    <CardContent>
                                        <MealEditor meals={editorMeals} onChange={handleMealsChange} />
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="space-y-6">
                                <Card className="bg-[#E9F7EF] border-[#A2B38B]">
                                    <CardHeader>
                                        <CardTitle className="text-[#2E7D32]">Dosha Balance</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-600 mb-4">Based on patient&apos;s Prakriti: {selectedPatientData?.assessment?.prakriti}</p>
                                        {/* Visual indicators would go here */}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}

export default function CreateDietPlanPage() {
    return (
        <PractitionerLayout>
            <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <CreateDietPlanContent />
            </Suspense>
        </PractitionerLayout>
    );
}
