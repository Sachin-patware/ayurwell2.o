'use client';

import { useState, useEffect } from 'react';
import PractitionerLayout from '@/components/layouts/PractitionerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Loader2, AlertCircle, CheckCircle, XCircle, CalendarClock, Filter } from 'lucide-react';
import { startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { formatDateIST } from '@/lib/dateUtils';
import api from '@/services/api';

interface Appointment {
    id: string;
    doctorId: string;
    patientId: string;
    doctorName: string;
    patientName: string;
    startTimestamp: string;
    endTimestamp?: string;
    status: string;
    notes?: string;
}

export default function PractitionerAppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all'); // 'all', 'today', 'upcoming', 'past'

    useEffect(() => {
        fetchAppointments();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [appointments, statusFilter, dateFilter]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/appointments/');
            // Sort by date (newest first)
            const sorted = response.data.sort((a: Appointment, b: Appointment) =>
                new Date(b.startTimestamp).getTime() - new Date(a.startTimestamp).getTime()
            );
            setAppointments(sorted);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load appointments');
            console.error('Error fetching appointments:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...appointments];

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(apt => apt.status === statusFilter);
        }

        // Date filter
        const now = new Date();
        const today = startOfDay(now);
        const todayEnd = endOfDay(now);

        if (dateFilter === 'today') {
            filtered = filtered.filter(apt => {
                const aptDate = parseISO(apt.startTimestamp);
                return isWithinInterval(aptDate, { start: today, end: todayEnd });
            });
        } else if (dateFilter === 'upcoming') {
            filtered = filtered.filter(apt => {
                const aptDate = parseISO(apt.startTimestamp);
                return aptDate >= now && apt.status === 'upcoming';
            });
        } else if (dateFilter === 'past') {
            filtered = filtered.filter(apt => {
                const aptDate = parseISO(apt.startTimestamp);
                return aptDate < now;
            });
        }

        setFilteredAppointments(filtered);
    };

    const handleStatusChange = async (appointmentId: string, newStatus: string) => {
        try {
            await api.put(`/appointments/${appointmentId}`, { status: newStatus });
            await fetchAppointments();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update status');
            console.error('Error updating status:', err);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            upcoming: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Upcoming' },
            completed: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle, label: 'Completed' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Cancelled' },
        };
        const badge = badges[status as keyof typeof badges] || badges.upcoming;
        const Icon = badge.icon;
        return (
            <div className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                <Icon className="h-3 w-3" />
                {badge.label}
            </div>
        );
    };

    const getStats = () => {
        const now = new Date();
        return {
            total: appointments.length,
            upcoming: appointments.filter(a => a.status === 'upcoming' && parseISO(a.startTimestamp) >= now).length,
            today: appointments.filter(a => {
                const aptDate = parseISO(a.startTimestamp);
                return isWithinInterval(aptDate, { start: startOfDay(now), end: endOfDay(now) });
            }).length,
            completed: appointments.filter(a => a.status === 'completed').length,
        };
    };

    const stats = getStats();

    return (
        <PractitionerLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#2E7D32] to-[#A2B38B] rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold flex items-center gap-2">
                                <CalendarClock className="h-8 w-8" />
                                Appointments
                            </h2>
                            <p className="mt-2 text-green-50">Manage your patient consultations</p>
                        </div>
                        <div className="hidden md:grid grid-cols-3 gap-4">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                                <p className="text-xs text-green-100">Today</p>
                                <p className="text-2xl font-bold">{stats.today}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                                <p className="text-xs text-green-100">Upcoming</p>
                                <p className="text-2xl font-bold">{stats.upcoming}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                                <p className="text-xs text-green-100">Total</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
                        <p className="text-red-700 font-semibold flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            {error}
                        </p>
                    </div>
                )}

                {loading ? (
                    <Card>
                        <CardContent className="p-12 flex flex-col items-center justify-center">
                            <Loader2 className="h-12 w-12 animate-spin text-[#2E7D32] mb-4" />
                            <p className="text-gray-600">Loading appointments...</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Filters */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="h-5 w-5" />
                                    Filters
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Filter by Date
                                        </label>
                                        <Select value={dateFilter} onValueChange={setDateFilter}>
                                            <SelectTrigger className="border-2 border-gray-300">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Dates</SelectItem>
                                                <SelectItem value="today">Today</SelectItem>
                                                <SelectItem value="upcoming">Upcoming Only</SelectItem>
                                                <SelectItem value="past">Past Appointments</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Filter by Status
                                        </label>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="border-2 border-gray-300">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Appointments List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Appointments ({filteredAppointments.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {filteredAppointments.length > 0 ? (
                                    <div className="space-y-4">
                                        {filteredAppointments.map((apt) => (
                                            <div key={apt.id} className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                                            <User className="h-4 w-4 text-[#2E7D32]" />
                                                            {apt.patientName}
                                                        </h4>
                                                        <p className="text-sm text-gray-500 mt-1">{apt.notes || 'Consultation'}</p>
                                                    </div>
                                                    {getStatusBadge(apt.status)}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                    <div className="flex items-center bg-green-50 p-2 rounded-lg">
                                                        <Calendar className="h-4 w-4 mr-2 text-[#2E7D32]" />
                                                        <span className="text-sm font-medium">
                                                            {formatDateIST(apt.startTimestamp, 'EEEE, MMMM d, yyyy')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center bg-blue-50 p-2 rounded-lg">
                                                        <Clock className="h-4 w-4 mr-2 text-blue-600" />
                                                        <span className="text-sm font-medium">
                                                            {formatDateIST(apt.startTimestamp, 'h:mm a')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {apt.status === 'upcoming' && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 border-2 border-green-300 hover:bg-green-50 text-green-700"
                                                            onClick={() => handleStatusChange(apt.id, 'completed')}
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                            Mark Complete
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 border-2 border-red-300 hover:bg-red-50 text-red-700"
                                                            onClick={() => handleStatusChange(apt.id, 'cancelled')}
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-6xl mb-4">📅</div>
                                        <p className="text-gray-500 text-lg">No appointments found.</p>
                                        <p className="text-gray-400 mt-2">Try adjusting your filters.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </PractitionerLayout>
    );
}
