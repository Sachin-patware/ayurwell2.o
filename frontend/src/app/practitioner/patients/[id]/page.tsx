'use client';

import { useState, useEffect } from 'react';
import PractitionerLayout from '@/components/layouts/PractitionerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DoshaWheel } from '@/components/charts/DoshaWheel';
import { PrakritiGraph } from '@/components/charts/PrakritiGraph';
import { FileText, Calendar, MessageSquare, Activity, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function PatientDetailPage() {
    const params = useParams();
    const [activeTab, setActiveTab] = useState('overview');
    const [patient, setPatient] = useState<any>(null);

    return (
        <PractitionerLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">{patient.name}</h2>
                        <p className="text-gray-500">{patient.age} years • {patient.gender} • {patient.email}</p>
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
                        <TabsTrigger value="history">History</TabsTrigger>
                        <TabsTrigger value="diet">Diet Plans</TabsTrigger>
                        <TabsTrigger value="reports">Lab Reports</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Prakriti Analysis */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Prakriti Analysis (Constitution)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <DoshaWheel
                                        vata={patient.prakriti.vata}
                                        pitta={patient.prakriti.pitta}
                                        kapha={patient.prakriti.kapha}
                                    />
                                    <div className="text-center mt-4">
                                        <span className="inline-block px-3 py-1 rounded-full bg-[#E07A5F] text-white text-sm font-medium">
                                            Dominant: Pitta
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Vikriti Analysis */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Vikriti (Current Imbalance)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <PrakritiGraph data={patient.vikriti} />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Medical History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                                        {patient.conditions.map((c: string, i: number) => (
                                            <li key={i}>{c}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Allergies</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                                        {patient.allergies.map((a: string, i: number) => (
                                            <li key={i}>{a}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Vitals</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Weight</span>
                                        <span className="font-medium">72 kg</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Height</span>
                                        <span className="font-medium">175 cm</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">BMI</span>
                                        <span className="font-medium">23.5</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Consultation History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {patient.history.map((item: any, i: number) => (
                                        <div key={i} className="flex items-start border-b pb-4 last:border-0">
                                            <div className="bg-[#E9F7EF] p-2 rounded-lg mr-4">
                                                <Calendar className="h-5 w-5 text-[#2E7D32]" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">{item.type}</h4>
                                                <p className="text-sm text-gray-500">{item.date}</p>
                                                <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                                            </div>
                                        </div>
                                    ))}
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
