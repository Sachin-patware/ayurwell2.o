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
                const response = await api.get('/patients');
                setPatients(response.data);
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
                                        <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                                            <div className="flex items-center space-x-4">
                                                <div className="h-12 w-12 rounded-full bg-[#E9F7EF] text-[#2E7D32] flex items-center justify-center font-bold text-lg group-hover:bg-[#2E7D32] group-hover:text-white transition-colors">
                                                    {patient.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                                                    <p className="text-sm text-gray-500">ID: {patient.patientId}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                                                <div>
                                                    <span className="text-gray-500">Prakriti:</span>
                                                    <span className="ml-1 font-medium text-[#E07A5F]">
                                                        {patient.assessment?.prakriti || 'N/A'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Age:</span>
                                                    <span className="ml-1 font-medium">
                                                        {patient.assessment?.age || 'N/A'}
                                                    </span>
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
