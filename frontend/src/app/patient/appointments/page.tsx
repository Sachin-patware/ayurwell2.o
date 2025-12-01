'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PatientLayout from '@/components/layouts/PatientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarView } from '@/components/appointments/CalendarView';
import { TimeSlotPicker } from '@/components/appointments/TimeSlotPicker';
import { Calendar, Clock, User, Loader2, AlertCircle, CalendarCheck, X, Edit, CheckCircle, XCircle, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
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
    rescheduleReason?: string;
    proposedStartTimestamp?: string;
}

interface ClinicSchedule {
    day: string;
    from: string;
    to: string;
}

interface Doctor {
    doctorId: string;
    name: string;
    specialization: string;
    clinicHours: ClinicSchedule[];
}

export default function PatientAppointmentsPage() {
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<string>('');
    const [doctorAppointments, setDoctorAppointments] = useState<Appointment[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [booking, setBooking] = useState(false);
    const [error, setError] = useState('');
    const [reschedulingId, setReschedulingId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const selectedDoctorData = doctors.find((d) => d.doctorId === selectedDoctor);

    useEffect(() => {
        fetchData();
    }, []);

    // Fetch doctor's all appointments when doctor is selected
    useEffect(() => {
        if (selectedDoctor) {
            fetchDoctorAppointments();
        } else {
            setDoctorAppointments([]);
        }
    }, [selectedDoctor]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [appointmentsRes, doctorsRes] = await Promise.all([
                api.get('/appointments/me'),
                api.get('/doctors')
            ]);
            setAppointments(appointmentsRes.data);
            setDoctors(doctorsRes.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load data');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctorAppointments = async () => {
        if (!selectedDoctor) return;

        try {
            const response = await api.get(`/appointments/doctor/${selectedDoctor}`);
            setDoctorAppointments(response.data);
            console.log('📅 Fetched all appointments for doctor:', response.data);
        } catch (err: any) {
            console.error('Error fetching doctor appointments:', err);
        }
    };

    const handleBook = async () => {
        if (!selectedDate || !selectedSlot || !selectedDoctor) {
            setError('Please select doctor, date, and time');
            return;
        }

        setBooking(true);
        setError('');

        try {
            const startTimestamp = new Date(selectedDate);
            const [time, period] = selectedSlot.split(' ');
            const [hours, minutes] = time.split(':');
            let hour = parseInt(hours);
            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;

            startTimestamp.setHours(hour, parseInt(minutes), 0, 0);

            // Create a properly formatted datetime string that preserves local time
            const year = startTimestamp.getFullYear();
            const month = String(startTimestamp.getMonth() + 1).padStart(2, '0');
            const day = String(startTimestamp.getDate()).padStart(2, '0');
            const hourStr = String(startTimestamp.getHours()).padStart(2, '0');
            const minStr = String(startTimestamp.getMinutes()).padStart(2, '0');
            const localDateTimeString = `${year}-${month}-${day}T${hourStr}:${minStr}:00`;

            console.log('📅 Booking appointment:', {
                selectedDate: format(selectedDate, 'PPP'),
                selectedSlot,
                localDateTime: localDateTimeString,
                timestamp: startTimestamp
            });

            if (reschedulingId) {
                // Reschedule existing appointment - use /reschedule/patient endpoint
                const res = await api.post(`/appointments/${reschedulingId}/reschedule/patient`, {
                    newStartTimestamp: localDateTimeString
                });

                console.log('📥 Reschedule API Response:', res.data);
                console.log('📥 Appointment object from response:', res.data.appointment);

                // Update UI instantly with the returned appointment object
                setAppointments(prev => prev.map(apt => {
                    if (apt.id === reschedulingId) {
                        console.log('🔄 Updating appointment:', apt.id);
                        console.log('🔄 Old appointment:', apt);
                        const updated = { ...apt, ...res.data.appointment };
                        console.log('🔄 New appointment:', updated);
                        return updated;
                    }
                    return apt;
                }));

                toast.success(`Reschedule request sent! Waiting for doctor confirmation for ${format(selectedDate, 'PPP')} at ${selectedSlot}.`);
                setReschedulingId(null);
            } else {
                // Book new appointment - use /book endpoint
                await api.post('/appointments/book', {
                    doctor_id: selectedDoctor,
                    startTimestamp: localDateTimeString,
                    notes: 'Diet consultation'
                });
                toast.success(`Appointment request sent! Waiting for doctor confirmation for ${format(selectedDate, 'PPP')} at ${selectedSlot}.`);
                await fetchData();
            }

            await fetchDoctorAppointments(); // Refresh doctor's appointments
            setSelectedSlot(null);
            setSelectedDoctor('');
            setError('');
        } catch (err: any) {
            console.error('Error processing appointment:', err);
            const errorMsg = err.response?.data?.error || err.message || 'Failed to process appointment';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setBooking(false);
        }
    };

    const handleCancel = async (appointmentId: string) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            await api.post(`/appointments/${appointmentId}/cancel`, {
                reason: 'Cancelled by patient'
            });
            await fetchData();
            await fetchDoctorAppointments(); // Refresh doctor's appointments
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to cancel appointment');
            toast.error('Failed to cancel appointment');
            console.error('Error cancelling appointment:', err);
        }
    };

    const handleReschedule = (appointment: Appointment) => {
        setReschedulingId(appointment.id);
        setSelectedDoctor(appointment.doctorId);
        setSelectedDate(new Date(appointment.startTimestamp));
        setSelectedSlot(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRescheduleResponse = async (appointmentId: string, action: 'accept' | 'reject') => {
        try {
            await api.post(`/appointments/${appointmentId}/reschedule/${action}`);
            await fetchData();
            toast.success(`Reschedule proposal ${action}ed!`);
        } catch (err: any) {
            console.error(`Error ${action}ing reschedule:`, err);
            toast.error(`Failed to ${action} reschedule`);
        }
    };

    const filteredAppointments = appointments.filter(a => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'pending') {
            return a.status === 'pending' || a.status === 'doctor_rescheduled_pending' || a.status === 'patient_rescheduled_pending';
        }
        return a.status === statusFilter;
    });

    const upcomingAppointments = appointments.filter(a => a.status === 'confirmed');
    const pastAppointments = appointments.filter(a => a.status === 'cancelled');
    const pendingAppointments = appointments.filter(a => a.status === 'pending' || a.status === 'doctor_rescheduled_pending' || a.status === 'patient_rescheduled_pending');
    // Get available days for selected doctor
    const getAvailableDays = (): string[] => {
        if (!selectedDoctorData) return [];
        return selectedDoctorData.clinicHours.map(ch => ch.day);
    };

    // Check if a date is available (matches doctor's clinic days)
    const isDateAvailable = (date: Date): boolean => {
        if (!selectedDoctorData) return true;
        const dayName = format(date, 'EEEE'); // Monday, Tuesday, etc.
        return getAvailableDays().includes(dayName);
    };


    // Get booked slots for selected date and doctor (from ALL patients)
    const getBookedSlots = (): string[] => {
        if (!selectedDate || !selectedDoctor) return [];

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const bookedSlots: string[] = [];

        // Use doctorAppointments instead of appointments to check ALL bookings for this doctor
        doctorAppointments.forEach(apt => {
            // Skip the current appointment being rescheduled
            if (reschedulingId && apt.id === reschedulingId) {
                console.log('⏭️ Skipping current appointment:', apt.id);
                return;
            }

            const aptDate = format(new Date(apt.startTimestamp), 'yyyy-MM-dd');
            if (aptDate === dateStr) {
                // Format time to match our slot format (e.g., "02:00 PM")
                const aptTime = format(new Date(apt.startTimestamp), 'hh:mm a');
                bookedSlots.push(aptTime);
                console.log('🔒 Booked slot found:', aptTime, 'for appointment:', apt.id);
            }
        });

        console.log('📅 Total booked slots for', dateStr, ':', bookedSlots);
        return bookedSlots;
    };

    // Generate 30-minute slots between start and end time
    const generateTimeSlots = (start: string, end: string): string[] => {
        const slots: string[] = [];
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);

        let currentHour = startHour;
        let currentMin = startMin;

        while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
            const period = currentHour >= 12 ? 'PM' : 'AM';
            const displayHour = currentHour > 12 ? currentHour - 12 : (currentHour === 0 ? 12 : currentHour);
            const displayMin = currentMin === 0 ? '00' : currentMin;

            // Format: "09:00 AM"
            const timeString = `${String(displayHour).padStart(2, '0')}:${displayMin} ${period}`;
            slots.push(timeString);

            // Increment by 30 minutes
            currentMin += 30;
            if (currentMin >= 60) {
                currentHour += 1;
                currentMin = 0;
            }
        }
        return slots;
    };
    // 


    // Get available time slots based on doctor's clinic hours and existing bookings
    const getAllSlots = (): string[] => {
        if (!selectedDate || !selectedDoctorData) return [];

        const dayName = format(selectedDate, 'EEEE');
        const clinicDay = selectedDoctorData.clinicHours.find((ch) => ch.day === dayName);

        if (!clinicDay) {
            return [];
        }

        return generateTimeSlots(clinicDay.from, clinicDay.to);
    };

    const getAvailableSlots = (): string[] => {
        const allSlots = getAllSlots();
        const bookedSlots = getBookedSlots();
        return allSlots.filter(slot => !bookedSlots.includes(slot));
    };


    // Get current appointment slot when rescheduling
    const getCurrentAppointmentSlot = (): string | null => {
        if (!reschedulingId || !selectedDate) return null;

        const appointment = appointments.find(apt => apt.id === reschedulingId);
        if (!appointment) return null;

        // Convert appointment timestamp to a Date object
        const oldDateObj = new Date(appointment.startTimestamp);

        // Format dates for comparison
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        const oldDateStr = format(oldDateObj, 'yyyy-MM-dd');

        // If same date → return old slot
        if (selectedDateStr === oldDateStr) {
            return format(oldDateObj, 'hh:mm a'); // correct OLD slot
        }

        return null;
    };


    const availableSlots = getAvailableSlots();
    const bookedSlots = getBookedSlots();


    const getStatusBadge = (status: string) => {
        const badges = {
            pending: { bg: 'bg-gradient-to-r from-yellow-400 to-orange-400', text: 'text-white', icon: Clock, label: 'Pending Confirmation' },
            doctor_rescheduled_pending: { bg: 'bg-gradient-to-r from-orange-400 to-red-400', text: 'text-white', icon: CalendarClock, label: 'Reschedule Proposed' },
            patient_rescheduled_pending: { bg: 'bg-gradient-to-r from-orange-400 to-red-400', text: 'text-white', icon: CalendarClock, label: 'Reschedule Requested' },
            confirmed: { bg: 'bg-gradient-to-r from-green-400 to-emerald-400', text: 'text-white', icon: CheckCircle, label: 'Confirmed' },
            completed: { bg: 'bg-gradient-to-r from-blue-400 to-cyan-400', text: 'text-white', icon: CalendarCheck, label: 'Completed' },
            cancelled: { bg: 'bg-gradient-to-r from-red-400 to-pink-400', text: 'text-white', icon: XCircle, label: 'Cancelled' },
        };
        const badge = badges[status.toLowerCase() as keyof typeof badges] || badges.pending;
        const Icon = badge.icon;
        return (
            <div className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
                <Icon className="h-3 w-3" />
                {badge.label}
            </div>
        );
    };

    return (
        <PatientLayout>
            <div className="space-y-6">
                {/* Header with Gradient */}
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold flex items-center gap-2">
                                <CalendarClock className="h-8 w-8" />
                                Appointments
                            </h2>
                            <p className="mt-2 text-indigo-50">Manage your visits and book consultations</p>
                        </div>
                        <div className="hidden md:flex items-center gap-4">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                                <p className="text-xs text-indigo-100">Upcoming</p>
                                <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl p-4 shadow-sm">
                        <p className="text-red-700 font-semibold flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            {error}
                        </p>
                    </div>
                )}

                {loading ? (
                    <Card className="border-2 border-indigo-200">
                        <CardContent className="p-12 flex flex-col items-center justify-center">
                            <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
                            <p className="text-gray-600">Loading appointments...</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Booking Section */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-2 border-indigo-200 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                                    <CardTitle className="flex items-center justify-between text-indigo-700">
                                        <span className="flex items-center gap-2">
                                            <CalendarCheck className="h-5 w-5" />
                                            {reschedulingId ? 'Reschedule Appointment' : 'Book New Appointment'}
                                        </span>
                                        {reschedulingId && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setReschedulingId(null);
                                                    setSelectedDoctor('');
                                                    setSelectedSlot(null);
                                                }}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Cancel Reschedule
                                            </Button>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {reschedulingId && (
                                        <div className="mb-4 bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                                            <p className="text-orange-700 font-semibold flex items-center gap-2">
                                                <Edit className="h-4 w-4" />
                                                Rescheduling mode: Select new date and time
                                            </p>
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Select Doctor
                                        </label>
                                        <Select value={selectedDoctor} onValueChange={setSelectedDoctor} disabled={!!reschedulingId}>
                                            <SelectTrigger className="border-2 border-indigo-200 focus:border-indigo-400">
                                                <SelectValue placeholder="Choose a doctor..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {doctors.map((doctor) => (
                                                    <SelectItem key={doctor.doctorId} value={doctor.doctorId}>
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-indigo-500" />
                                                            {doctor.name} - {doctor.specialization}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-8 ">
                                        <div className="flex-1 ">
                                            <h4 className="font-semibold mb-4 text-gray-700 flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-indigo-500" />
                                                1. Select Date
                                            </h4>
                                            {selectedDoctor ? (
                                                <><div className="border-2 border-blue-300 rounded-xl bg-white p-4 shadow-sm">
                                                    <CalendarView
                                                        selectedDate={selectedDate}
                                                        onSelect={setSelectedDate}
                                                        bookedDates={[]}
                                                        isDateAvailable={isDateAvailable}
                                                    />
                                                </div>
                                                    <div className="mt-3 bg-indigo-50 p-3 rounded-lg">
                                                        <p className="text-xs font-semibold text-indigo-700 mb-1">Available Days:</p>
                                                        <p className="text-xs text-indigo-600">
                                                            {getAvailableDays().join(', ') || 'No clinic days set'}
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="bg-gray-50 p-8 rounded-lg text-center">
                                                    <p className="text-gray-500 text-sm">Please select a doctor first</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold mb-4 text-gray-700 flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-indigo-500" />
                                                2. Select Time
                                            </h4>
                                            {selectedDate && selectedDoctor ? (
                                                <>
                                                    <div className="border-2 border-purple-300 rounded-xl bg-white p-4 shadow-sm overflow-y-auto">

                                                        <TimeSlotPicker
                                                            slots={getAllSlots()}
                                                            selectedSlot={selectedSlot}
                                                            onSelect={setSelectedSlot}
                                                            bookedSlots={bookedSlots}
                                                            currentSlot={getCurrentAppointmentSlot()}
                                                        />
                                                    </div>
                                                    {availableSlots.length === 0 && (
                                                        <div className="mt-3 bg-red-50 border border-red-200 p-3 rounded-lg">
                                                            <p className="text-xs font-semibold text-red-700">
                                                                ⚠️ No available slots on this day
                                                            </p>
                                                        </div>
                                                    )}

                                                </>
                                            ) : (
                                                <div className="bg-gray-50 p-8 rounded-lg text-center">
                                                    <p className="text-gray-500 text-sm">
                                                        {!selectedDoctor ? 'Select a doctor first' : 'Select a date first'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-8 flex justify-end gap-3">
                                        {reschedulingId && (
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setReschedulingId(null);
                                                    setSelectedDoctor('');
                                                    setSelectedSlot(null);
                                                }}
                                                className="border-2 border-gray-300"
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleBook}
                                            disabled={!selectedDate || !selectedSlot || !selectedDoctor || booking}
                                            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-8 font-semibold shadow-lg"
                                        >
                                            {booking ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                                            ) : reschedulingId ? (
                                                <><Edit className="mr-2 h-4 w-4" /> Confirm Reschedule</>
                                            ) : (
                                                <><CalendarCheck className="mr-2 h-4 w-4" /> Confirm Booking</>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* All Appointments List */}
                            <Card className="border-2 border-blue-200 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-blue-700">All Appointments</CardTitle>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="w-40 border-2 border-blue-200">
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
                                </CardHeader>
                                <CardContent className="p-4">
                                    {filteredAppointments.length > 0 ? (
                                        <div className="space-y-4">
                                            {filteredAppointments.map((apt) => (
                                                <div key={apt.id} className="border rounded-lg p-4 bg-white shadow-sm">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="font-bold text-lg">{format(new Date(apt.startTimestamp), 'PPP')}</h4>
                                                            <p className="text-gray-600 flex items-center gap-2">
                                                                <Clock className="h-4 w-4" />
                                                                {format(new Date(apt.startTimestamp), 'p')}
                                                            </p>
                                                            <p className="text-gray-600 flex items-center gap-2">
                                                                <User className="h-4 w-4" />
                                                                Dr. {apt.doctorName}
                                                            </p>
                                                        </div>
                                                        {getStatusBadge(apt.status)}
                                                    </div>

                                                    {/* Proposed Reschedule Section */}
                                                    {(apt.status === 'doctor_rescheduled_pending') && apt.proposedStartTimestamp && (
                                                        <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                                                            <p className="text-xs font-bold text-orange-700 mb-1 uppercase">
                                                                Doctor Proposed New Time:
                                                            </p>
                                                            <div className="flex items-center gap-2 text-orange-800 font-medium">
                                                                <CalendarClock className="h-4 w-4" />
                                                                {format(new Date(apt.proposedStartTimestamp), 'PPP p')}
                                                            </div>
                                                            {apt.rescheduleReason && (
                                                                <div className="mt-2 pt-2 border-t border-orange-200">
                                                                    <p className="text-xs font-semibold text-orange-700 mb-1">Reason:</p>
                                                                    <p className="text-sm text-orange-800">{apt.rescheduleReason}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2 mt-4 justify-end">
                                                        {/* PENDING: Only Cancel (patient cannot reschedule until doctor confirms) */}
                                                        {apt.status === 'pending' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                                onClick={() => handleCancel(apt.id)}
                                                            >
                                                                <X className="h-4 w-4 mr-1" />
                                                                Cancel
                                                            </Button>
                                                        )}

                                                        {/* CONFIRMED: Reschedule + Cancel */}
                                                        {apt.status === 'confirmed' && (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                                                    onClick={() => handleReschedule(apt)}
                                                                >
                                                                    <Edit className="h-4 w-4 mr-1" />
                                                                    Reschedule
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                                    onClick={() => handleCancel(apt.id)}
                                                                >
                                                                    <X className="h-4 w-4 mr-1" />
                                                                    Cancel
                                                                </Button>
                                                            </>
                                                        )}

                                                        {/* PATIENT_RESCHEDULED_PENDING: Withdraw Request + Cancel */}
                                                        {apt.status === 'patient_rescheduled_pending' && (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                                                                    onClick={() => handleRescheduleResponse(apt.id, 'reject')}
                                                                >
                                                                    <XCircle className="h-4 w-4 mr-1" />
                                                                    Withdraw Request
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                                    onClick={() => handleCancel(apt.id)}
                                                                >
                                                                    <X className="h-4 w-4 mr-1" />
                                                                    Cancel
                                                                </Button>
                                                            </>
                                                        )}

                                                        {/* DOCTOR_RESCHEDULED_PENDING: Accept + Reject + Cancel */}
                                                        {apt.status === 'doctor_rescheduled_pending' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                                    onClick={() => handleRescheduleResponse(apt.id, 'accept')}
                                                                >
                                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                                    Accept New Time
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                                    onClick={() => handleRescheduleResponse(apt.id, 'reject')}
                                                                >
                                                                    <XCircle className="h-4 w-4 mr-1" />
                                                                    Reject
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                                    onClick={() => handleCancel(apt.id)}
                                                                >
                                                                    <X className="h-4 w-4 mr-1" />
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
                                            <p className="text-gray-400 mt-2">Book your first consultation!</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card >
                        </div >

                        {/* Sidebar */}
                        < div className="space-y-6" >
                            {/* Quick Stats */}
                            < Card className="border-2 border-green-200 shadow-lg" >
                                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                                    <CardTitle className="text-green-700">Quick Stats</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <div className="bg-gradient-to-r from-green-400 to-emerald-400 text-white p-3 rounded-lg">
                                        <p className="text-xs opacity-90">Upcoming</p>
                                        <p className="text-3xl font-bold">{upcomingAppointments.length}</p>
                                    </div>
                                    <div className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white p-3 rounded-lg">
                                        <p className="text-xs opacity-90">Completed</p>
                                        <p className="text-3xl font-bold">{appointments.filter(a => a.status === 'completed').length}</p>
                                    </div>
                                    <div className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white p-3 rounded-lg">
                                        <p className="text-xs opacity-90">Cancelled</p>
                                        <p className="text-3xl font-bold">{pastAppointments.length}</p>
                                    </div>
                                    <div className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white p-3 rounded-lg">
                                        <p className="text-xs opacity-90">Pending</p>
                                        <p className="text-3xl font-bold">{appointments.filter(a => a.status === 'pending').length}</p>
                                    </div>
                                    <div className="bg-gradient-to-r from-gray-400 to-slate-400 text-white p-3 rounded-lg">
                                        <p className="text-xs opacity-90">Total</p>
                                        <p className="text-3xl font-bold">{appointments.length}</p>
                                    </div>
                                </CardContent>
                            </Card >

                            {/* Doctor Info */}
                            {
                                selectedDoctorData && (
                                    <Card className="border-2 border-purple-200 shadow-lg">
                                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                                            <CardTitle className="text-purple-700">Practitioner Info</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <div className="flex items-center space-x-4 mb-4">
                                                <div className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                                                    <User className="h-7 w-7 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{selectedDoctorData.name}</h4>
                                                    <p className="text-sm text-purple-600 font-medium">{selectedDoctorData.specialization}</p>
                                                </div>
                                            </div>
                                            {selectedDoctorData.clinicHours.length > 0 && (
                                                <div className="mt-4 bg-purple-50 p-3 rounded-lg">
                                                    <p className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
                                                        <Clock className="h-4 w-4" />
                                                        Clinic Hours:
                                                    </p>
                                                    {selectedDoctorData.clinicHours.map((schedule, idx) => (
                                                        <p key={idx} className="text-sm text-gray-700 py-1 border-b border-purple-100 last:border-0">
                                                            <span className="font-medium">{schedule.day}:</span> {schedule.from} - {schedule.to}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            }
                        </div >
                    </div >
                )
                }
            </div >
        </PatientLayout >
    );
}
