'use client';

import { useState, useEffect } from 'react';
import PractitionerLayout from '@/components/layouts/PractitionerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Loader2, AlertCircle, CheckCircle, XCircle, CalendarClock, Filter, Edit } from 'lucide-react';
import { startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { formatDateIST } from '@/lib/dateUtils';
import api from '@/services/api';
import RescheduleModal from '@/components/appointments/RescheduleModal';
import { Appointment } from '@/services/appointmentService';
import { toast } from 'react-toastify';

export default function PractitionerAppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all'); // 'all', 'today', 'upcoming', 'past'

    // Reschedule state
    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [appointments, statusFilter, dateFilter]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/appointments/me');
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
                return aptDate > now;
            });
        } else if (dateFilter === 'past') {
            filtered = filtered.filter(apt => {
                const aptDate = parseISO(apt.startTimestamp);
                return aptDate < now;
            });
        }

        setFilteredAppointments(filtered);
    };

    // Handle reschedule click
    const handleRescheduleClick = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setRescheduleModalOpen(true);
    };

    const handleRescheduleSubmit = async (newTimestamp: string, reason?: string) => {
        if (!selectedAppointment?.id) {
            toast.warn('Please select an appointment and try again.');
            return;
        }

        try {
            const res = await api.post(`/appointments/${selectedAppointment.id}/reschedule/doctor`, {
                newStartTimestamp: newTimestamp,
                reason: reason
            });

            console.log('📥 Doctor Reschedule API Response:', res.data);
            console.log('📥 Appointment object from response:', res.data.appointment);

            // Update UI instantly with the returned appointment object
            setAppointments(prev => prev.map(apt => {
                if (apt.id === selectedAppointment.id) {
                    console.log('🔄 Updating appointment:', apt.id);
                    console.log('🔄 Old appointment:', apt);
                    const updated = { ...apt, ...res.data.appointment };
                    console.log('🔄 New appointment:', updated);
                    return updated;
                }
                return apt;
            }));

            setRescheduleModalOpen(false);
            setSelectedAppointment(null);

            toast.success('✅ Reschedule proposal sent to patient!');
        } catch (err: any) {
            console.error('Error rescheduling:', err);
            throw new Error(err.response?.data?.error || 'Failed to reschedule');
        }
    };

    const handleStatusChange = async (appointmentId: string, newStatus: string) => {
        try {
            if (newStatus === 'confirmed') {
                await api.post(`/appointments/${appointmentId}/confirm`);
            } else if (newStatus === 'cancelled') {
                await api.post(`/appointments/${appointmentId}/cancel`, { reason: 'Cancelled by doctor' });
            }
            await fetchAppointments();
            toast.success(`✅ Appointment ${newStatus}!`);
        } catch (err: any) {
            console.error('Error updating status:', err);
            toast.error(`❌ Failed to update appointment: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleReschedule = (appointment: Appointment) => {
        handleRescheduleClick(appointment);
    };

    const handleRejectReschedule = async (appointmentId: string) => {
        try {
            await api.post(`/appointments/${appointmentId}/reschedule/reject`);
            await fetchAppointments();
            toast.success('✅ Reschedule request rejected!');
        } catch (err: any) {
            console.error('Error rejecting reschedule:', err);
            toast.error(`❌ Failed to reject reschedule: ${err.response?.data?.error || err.message}`);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Pending' },
            confirmed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Confirmed' },
            upcoming: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Confirmed' },
            completed: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle, label: 'Completed' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Cancelled' },
            doctor_rescheduled_pending: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Clock, label: 'Reschedule Proposed' },
            patient_rescheduled_pending: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Clock, label: 'Patient Reschedule Req' },
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
            upcoming: appointments.filter(a => (a.status === 'pending' || a.status === 'doctor_rescheduled_pending' || a.status === 'patient_rescheduled_pending'|| a.status === 'confirmed') && parseISO(a.startTimestamp) >= now).length,
            today: appointments.filter(a => {
                const aptDate = parseISO(a.startTimestamp);
                return isWithinInterval(aptDate, { start: startOfDay(now), end: endOfDay(now) });
            }).length,
            pending:appointments.filter(a => a.status === 'pending' || a.status === 'doctor_rescheduled_pending' || a.status === 'patient_rescheduled_pending').length,
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
                                <p className="text-xs text-green-100">Pending</p>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                            </div>
                            {/* <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                                <p className="text-xs text-green-100">Total</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div> */}
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
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="confirmed">Confirmed</SelectItem>

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

                                                {/* Proposed Reschedule Section */}
                                                {(apt.status === 'patient_rescheduled_pending' || apt.status === 'doctor_rescheduled_pending') && apt.proposedStartTimestamp && (
                                                    <div className="mb-3 p-3 bg-orange-50 border-2 border-orange-200 rounded-lg">
                                                        <p className="text-xs font-bold text-orange-700 mb-2 uppercase flex items-center gap-1">
                                                            <CalendarClock className="h-4 w-4" />
                                                            {apt.status === 'patient_rescheduled_pending' ? 'Patient Proposed New Time:' : 'You Proposed:'}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-orange-800 font-semibold">
                                                            <Calendar className="h-4 w-4" />
                                                            {formatDateIST(apt.proposedStartTimestamp, 'EEEE, MMMM d, yyyy')}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-orange-800 font-semibold mt-1">
                                                            <Clock className="h-4 w-4" />
                                                            {formatDateIST(apt.proposedStartTimestamp, 'h:mm a')}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 mt-4 flex-wrap">
                                                    {/* PENDING: Confirm + Propose Reschedule + Reject */}
                                                    {apt.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
                                                                onClick={() => handleStatusChange(apt.id, 'confirmed')}
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                                Confirm
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                                                onClick={() => handleReschedule(apt)}
                                                            >
                                                                <Edit className="h-4 w-4 mr-1" />
                                                                Propose Reschedule
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                                onClick={() => handleStatusChange(apt.id, 'cancelled')}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-1" />
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}

                                                    {/* CONFIRMED: Propose Reschedule + Cancel */}
                                                    {apt.status === 'confirmed' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                                                onClick={() => handleReschedule(apt)}
                                                            >
                                                                <Edit className="h-4 w-4 mr-1" />
                                                                Propose Reschedule
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                                onClick={() => handleStatusChange(apt.id, 'cancelled')}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-1" />
                                                                Cancel
                                                            </Button>
                                                        </>
                                                    )}

                                                    {/* PATIENT_RESCHEDULED_PENDING: Accept + Decline + Cancel */}
                                                    {apt.status === 'patient_rescheduled_pending' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
                                                                onClick={() => handleStatusChange(apt.id, 'confirmed')}
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                                Accept Reschedule
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                                onClick={() => handleRejectReschedule(apt.id)}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-1" />
                                                                Decline
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                                onClick={() => handleStatusChange(apt.id, 'cancelled')}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-1" />
                                                                Cancel
                                                            </Button>
                                                        </>
                                                    )}

                                                    {/* DOCTOR_RESCHEDULED_PENDING: Withdraw Proposal + Cancel */}
                                                    {apt.status === 'doctor_rescheduled_pending' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-orange-200 text-orange-600 hover:bg-orange-50"
                                                                onClick={() => handleRejectReschedule(apt.id)}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-1" />
                                                                Withdraw Proposal
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                                onClick={() => handleStatusChange(apt.id, 'cancelled')}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-1" />
                                                                Cancel
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
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

                {selectedAppointment && (
                    <RescheduleModal
                        isOpen={rescheduleModalOpen}
                        onClose={() => {
                            setRescheduleModalOpen(false);
                            setSelectedAppointment(null);
                        }}
                        appointment={selectedAppointment}
                        onReschedule={handleRescheduleSubmit}
                        userRole="doctor"
                    />
                )}
            </div>
        </PractitionerLayout>
    );
}
