'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    UserCheck,
    UserX,
    Activity,
    Shield,
    Trash2,
    CheckCircle,
    Loader2,
    LogOut,
    Calendar,
    TrendingUp
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

type Stats = {
    totalPatients: number;
    totalDoctors: number;
    verifiedDoctors: number;
    pendingDoctors: number;
    totalAppointments: number;
};

type Patient = {
    patientId: string;
    name: string;
    phone: string;
    email: string;
    createdAt: string;
};

type Doctor = {
    doctorId: string;
    name: string;
    email: string;
    specialization: string;
    status: string;
    createdAt: string;
};

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats | null>(null);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [activeTab, setActiveTab] = useState<'patients' | 'doctors'>('patients');

    useEffect(() => {
        checkAuth();
        fetchData();
    }, []);

    const checkAuth = () => {
        const user = localStorage.getItem('user');
        if (!user) {
            router.push('/admin');
            return;
        }
        const userData = JSON.parse(user);
        if (userData.role !== 'admin') {
            toast.error('Unauthorized access');
            router.push('/admin');
        }
    };

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    };

    const fetchData = async () => {
        try {
            const [statsRes, patientsRes, doctorsRes] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, getAuthHeaders()),
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/patients`, getAuthHeaders()),
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/doctors`, getAuthHeaders())
            ]);

            setStats(statsRes.data);
            setPatients(patientsRes.data);
            setDoctors(doctorsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (uid: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            return;
        }

        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/user/${uid}`,
                getAuthHeaders()
            );
            toast.success(`User ${name} deleted successfully`);
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Failed to delete user');
        }
    };

    const handleVerifyDoctor = async (doctorId: string, name: string) => {
        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/doctor/verify/${doctorId}`,
                {},
                getAuthHeaders()
            );
            toast.success(`Doctor ${name} verified successfully`);
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error verifying doctor:', error);
            toast.error('Failed to verify doctor');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('Logged out successfully');
        router.push('/admin');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                            <p className="text-slate-400">System Management & Analytics</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Total Patients</p>
                                <p className="text-3xl font-bold text-white mt-1">{stats?.totalPatients || 0}</p>
                            </div>
                            <Users className="w-10 h-10 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Total Doctors</p>
                                <p className="text-3xl font-bold text-white mt-1">{stats?.totalDoctors || 0}</p>
                            </div>
                            <UserCheck className="w-10 h-10 text-green-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Verified Doctors</p>
                                <p className="text-3xl font-bold text-white mt-1">{stats?.verifiedDoctors || 0}</p>
                            </div>
                            <CheckCircle className="w-10 h-10 text-purple-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Pending Doctors</p>
                                <p className="text-3xl font-bold text-white mt-1">{stats?.pendingDoctors || 0}</p>
                            </div>
                            <UserX className="w-10 h-10 text-orange-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Appointments</p>
                                <p className="text-3xl font-bold text-white mt-1">{stats?.totalAppointments || 0}</p>
                            </div>
                            <Calendar className="w-10 h-10 text-pink-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto">
                <div className="flex gap-4 mb-6">
                    <Button
                        onClick={() => setActiveTab('patients')}
                        className={activeTab === 'patients'
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}
                    >
                        <Users className="mr-2 h-4 w-4" />
                        Patients ({patients.length})
                    </Button>
                    <Button
                        onClick={() => setActiveTab('doctors')}
                        className={activeTab === 'doctors'
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}
                    >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Doctors ({doctors.length})
                    </Button>
                </div>

                {/* Patients Table */}
                {activeTab === 'patients' && (
                    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-white">Patient Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-700">
                                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Patient ID</th>
                                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Name</th>
                                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Phone</th>
                                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Email</th>
                                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Joined</th>
                                            <th className="text-right py-3 px-4 text-slate-400 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {patients.map((patient) => (
                                            <tr key={patient.patientId} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                                <td className="py-3 px-4 text-slate-300 font-mono text-sm">{patient.patientId}</td>
                                                <td className="py-3 px-4 text-white font-medium">{patient.name}</td>
                                                <td className="py-3 px-4 text-slate-300">{patient.phone || 'N/A'}</td>
                                                <td className="py-3 px-4 text-slate-300">{patient.email}</td>
                                                <td className="py-3 px-4 text-slate-400 text-sm">
                                                    {new Date(patient.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDeleteUser(patient.patientId, patient.name)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Doctors Table */}
                {activeTab === 'doctors' && (
                    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-white">Doctor Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-700">
                                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Doctor ID</th>
                                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Name</th>
                                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Email</th>
                                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Specialization</th>
                                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Joined</th>
                                            <th className="text-right py-3 px-4 text-slate-400 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {doctors.map((doctor) => (
                                            <tr key={doctor.doctorId} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                                <td className="py-3 px-4 text-slate-300 font-mono text-sm">{doctor.doctorId}</td>
                                                <td className="py-3 px-4 text-white font-medium">{doctor.name}</td>
                                                <td className="py-3 px-4 text-slate-300">{doctor.email}</td>
                                                <td className="py-3 px-4 text-slate-300">{doctor.specialization || 'N/A'}</td>
                                                <td className="py-3 px-4">
                                                    <Badge
                                                        variant={doctor.status === 'verified' ? 'default' : 'secondary'}
                                                        className={doctor.status === 'verified' ? 'bg-green-600' : 'bg-orange-600'}
                                                    >
                                                        {doctor.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-slate-400 text-sm">
                                                    {new Date(doctor.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        {doctor.status !== 'verified' && (
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700"
                                                                onClick={() => handleVerifyDoctor(doctor.doctorId, doctor.name)}
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                                Verify
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleDeleteUser(doctor.doctorId, doctor.name)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
