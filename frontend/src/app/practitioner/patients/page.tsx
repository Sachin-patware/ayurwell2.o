'use client';

import { useState, useEffect } from 'react';
import PractitionerLayout from '@/components/layouts/PractitionerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Filter, Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface Patient {
    id: string;
    patientId: string;
    name: string;
    email?: string;
    phone?: string;
    assessment?: {
        age?: number;
        gender?: string;
        prakriti?: string;
        vikriti?: string;
    };
    healthHistory?: string;
}

export default function PatientsPage() {
    const { user } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                setLoading(true);
                const response = await api.get('/appointments/doctor/patients');
                setPatients(response.data.patients || []);
            } catch (error) {
                console.error('Error fetching patients:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, []);

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patientId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <PractitionerLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Patients</h2>
                        <p className="text-gray-500 mt-1">Manage your patient records</p>
                    </div>


                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Search patients by name or ID..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-[#2E7D32]" />
                            </div>
                        ) : filteredPatients.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p className="font-medium">No patients found</p>
                                <p className="text-sm mt-1">
                                    {searchTerm ? 'Try a different search term' : 'Add your first patient to get started'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredPatients.map((patient) => (
                                    <Link key={patient.id} href={`/practitioner/patients/${patient.patientId}`}>
                                        <div className="border rounded-xl p-5 hover:shadow-lg hover:border-[#2E7D32] transition-all cursor-pointer group bg-white">
                                            <div className="flex items-start space-x-4">
                                                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#E9F7EF] to-[#2E7D32]/20 text-[#2E7D32] flex items-center justify-center font-bold text-xl group-hover:from-[#2E7D32] group-hover:to-[#1B5E20] group-hover:text-white transition-all shadow-sm">
                                                    {patient.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-lg text-gray-900 truncate group-hover:text-[#2E7D32] transition-colors">
                                                        {patient.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 font-mono mt-0.5">
                                                        {patient.patientId}
                                                    </p>
                                                    {(patient.email || patient.phone) && (
                                                        <div className="mt-3 space-y-1">
                                                            {patient.email && (
                                                                <p className="text-xs text-gray-600 truncate flex items-center gap-1.5">
                                                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                    </svg>
                                                                    {patient.email}
                                                                </p>
                                                            )}
                                                            {patient.phone && (
                                                                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                    </svg>
                                                                    {patient.phone}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <svg className="w-5 h-5 text-[#2E7D32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PractitionerLayout>
    );
}
