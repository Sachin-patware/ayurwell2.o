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
    lastAppointment?: {
        date: string;
        status: string;
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

                // Fetch doctor-specific patients (only confirmed/completed appointments)
                const patientsResponse = await api.get('/appointments/doctor/patients');
                const patients = patientsResponse.data.patients || [];

                // Fetch appointments
                const appointmentsResponse = await api.get('/appointments/');
                const appointments = appointmentsResponse.data;

                // Calculate stats
                const now = new Date();
                const upcomingAppointments = appointments.filter(
                    (a: Appointment) => a.status === 'confirmed' && new Date(a.startTimestamp) > now
                );

                const todayStr = format(now, 'yyyy-MM-dd');
                const todaysAppointments = appointments.filter(
                    (a: Appointment) => {
                        const apptDate = new Date(a.startTimestamp);
                        return format(apptDate, 'yyyy-MM-dd') === todayStr && a.status === 'confirmed';
                    }
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
                <div className="bg-gradient-to-r from-[#E9F7EF] to-white p-6 rounded-2xl border border-[#A2B38B]/20">
                    <h2 className="text-3xl font-bold text-[#1B5E20]">Dashboard</h2>
                    <p className="text-[#2E7D32] mt-2 font-medium">Welcome back, Dr. {user?.name}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link href="/practitioner/patients">
                        <div className="transition-transform hover:scale-105 cursor-pointer">
                            <StatsCard
                                title="Active Patients"
                                value={stats.activePatients}
                                icon={Users}
                                color="blue"
                                description="Total registered"
                            />
                        </div>
                    </Link>
                    <Link href="/practitioner/appointments">
                        <div className="transition-transform hover:scale-105 cursor-pointer">
                            <StatsCard
                                title="Appointments"
                                value={stats.upcomingAppointments}
                                icon={Calendar}
                                color="green"
                                description="Upcoming confirmed"
                            />
                        </div>
                    </Link>
                    <Link href="/practitioner/diet-plans">
                        <div className="transition-transform hover:scale-105 cursor-pointer">
                            <StatsCard
                                title="Diet Plans"
                                value={stats.pendingDietPlans}
                                icon={FileText}
                                color="orange"
                                description="Manage plans"
                            />
                        </div>
                    </Link>
                    <Link href="/practitioner/appointments">
                        <div className="transition-transform hover:scale-105 cursor-pointer">
                            <StatsCard
                                title="Consultations"
                                value={stats.totalConsultations}
                                icon={Activity}
                                color="purple"
                                description="Completed total"
                            />
                        </div>
                    </Link>
                </div>

                {/* Recent Activity & Appointments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Patients */}
                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="border-b bg-gray-50/50">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-gray-800">Recent Patients</CardTitle>
                                <Link href="/practitioner/patients">
                                    <Button variant="ghost" size="sm" className="text-[#2E7D32] hover:text-[#1B5E20]">
                                        View All
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentPatients.length > 0 ? (
                                <div className="divide-y">
                                    {recentPatients.map((patient) => (
                                        <Link
                                            key={patient.id}
                                            href={`/practitioner/patients/${patient.patientId}`}
                                            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="h-10 w-10 rounded-full bg-[#E9F7EF] text-[#2E7D32] flex items-center justify-center font-bold group-hover:bg-[#2E7D32] group-hover:text-white transition-colors">
                                                    {patient.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 group-hover:text-[#2E7D32] transition-colors">{patient.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        ID: {patient.patientId.substring(0, 8)}...
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                {patient.lastAppointment && (
                                                    <>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${patient.lastAppointment.status === 'confirmed'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {patient.lastAppointment.status}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {new Intl.DateTimeFormat('en-IN', {
                                                                dateStyle: 'medium',
                                                                timeZone: 'Asia/Kolkata'
                                                            }).format(new Date(patient.lastAppointment.date))}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <Users className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                                    <p>No recent patients found</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Today's Appointments */}
                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="border-b bg-gray-50/50">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-gray-800">Today's Appointments</CardTitle>
                                <Link href="/practitioner/appointments">
                                    <Button variant="ghost" size="sm" className="text-[#2E7D32] hover:text-[#1B5E20]">
                                        View Calendar
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {todayAppointments.length > 0 ? (
                                <div className="divide-y">
                                    {todayAppointments.map((appointment) => (
                                        <div
                                            key={appointment.id}
                                            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{appointment.patientName}</p>
                                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(appointment.startTimestamp), 'h:mm a')}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                                Confirmed
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <Calendar className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                                    <p>No appointments scheduled for today</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PractitionerLayout>
    );
}
