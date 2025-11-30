'use client';

import { useEffect, useState } from 'react';
import PractitionerLayout from '@/components/layouts/PractitionerLayout';
import { StatsCard } from '@/components/ui/stats-card';
import { Users, Calendar, FileText, Activity, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { format } from 'date-fns';

interface RecentPatient {
    id: string;
    patientId: string;
    name: string;
    assessment?: {
        prakriti?: string;
    };
}

interface Appointment {
    id: string;
    patientName: string;
    startTimestamp: string;
    status: string;
}

export default function PractitionerDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activePatients: 0,
        upcomingAppointments: 0,
        pendingDietPlans: 0,
        totalConsultations: 0
    });
    const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // Fetch patients
                const patientsResponse = await api.get('/patients');
                const patients = patientsResponse.data;

                // Fetch appointments
                const appointmentsResponse = await api.get('/appointments/');
                const appointments = appointmentsResponse.data;

                // Calculate stats
                const upcomingAppointments = appointments.filter(
                    (a: Appointment) => a.status === 'upcoming'
                );

                const today = new Date().toISOString().split('T')[0];
                const todaysAppointments = upcomingAppointments.filter(
                    (a: Appointment) => a.startTimestamp.startsWith(today)
                );

                setStats({
                    activePatients: patients.length,
                    upcomingAppointments: upcomingAppointments.length,
                    pendingDietPlans: 0, // This would need a specific endpoint
                    totalConsultations: appointments.filter((a: Appointment) => a.status === 'completed').length
                });

                // Set recent patients (last 5 added, reversed to show newest first)
                setRecentPatients([...patients].reverse().slice(0, 5));

                // Set today's appointments
                setTodayAppointments(todaysAppointments);

            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <PractitionerLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="h-12 w-12 animate-spin text-[#2E7D32]" />
                </div>
            </PractitionerLayout>
        );
    }

    return (
        <PractitionerLayout>
            <div className="space-y-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Dashboard (Updated)</h2>
                    <p className="text-gray-500 mt-2">Welcome back, Dr. {user?.name}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Active Patients"
                        value={stats.activePatients}
                        icon={Users}
                        color="blue"
                        description="Total registered"
                    />
                    <StatsCard
                        title="Appointments"
                        value={stats.upcomingAppointments}
                        icon={Calendar}
                        color="green"
                        description="Upcoming"
                    />
                    <StatsCard
                        title="Pending Diets"
                        value={stats.pendingDietPlans}
                        icon={FileText}
                        color="orange"
                        description="Needs review"
                    />
                    <StatsCard
                        title="Consultations"
                        value={stats.totalConsultations}
                        icon={Activity}
                        color="purple"
                        description="Completed"
                    />
                </div>

                {/* Quick Actions */}
                <div className="flex space-x-4">

                    <Link href="/practitioner/diet-plans/create">
                        <Button variant="outline" className="border-[#2E7D32] text-[#2E7D32] hover:bg-[#E9F7EF]">
                            <FileText className="mr-2 h-4 w-4" /> Generate Diet Plan
                        </Button>
                    </Link>
                </div>

                {/* Recent Activity & Appointments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Patients */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Patients</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentPatients.length > 0 ? (
                                <div className="space-y-3">
                                    {recentPatients.map((patient) => (
                                        <Link
                                            key={patient.id}
                                            href={`/practitioner/patients/${patient.patientId}`}
                                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="h-10 w-10 rounded-full bg-[#E9F7EF] text-[#2E7D32] flex items-center justify-center font-semibold">
                                                    {patient.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{patient.name}</p>
                                                    <p className="text-sm text-gray-500" title={patient.patientId}>
                                                        ID: {patient.patientId.substring(0, 8)}...
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {patient.assessment?.prakriti || 'N/A'}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No patients yet</p>
                                    <Link href="/practitioner/patients">
                                        <Button variant="link" className="text-[#2E7D32] mt-2">
                                            Add your first patient
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Today's Appointments */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Today's Appointments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {todayAppointments.length > 0 ? (
                                <div className="space-y-3">
                                    {todayAppointments.map((appointment) => (
                                        <div
                                            key={appointment.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">{appointment.patientName}</p>
                                                <p className="text-sm text-gray-500">
                                                    {format(new Date(appointment.startTimestamp), 'h:mm a')}
                                                </p>
                                            </div>
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                {appointment.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No appointments for today</p>
                                    <Link href="/practitioner/appointments">
                                        <Button variant="link" className="text-[#2E7D32] mt-2">
                                            View all appointments
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PractitionerLayout>
    );
}
