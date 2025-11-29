import React, { useState, useEffect } from 'react';
import { Appointment } from '@/services/appointmentService';
import { CalendarView } from '@/components/appointments/CalendarView';
import { TimeSlotPicker } from '@/components/appointments/TimeSlotPicker';
import { format } from 'date-fns';
import api from '@/services/api';
import { Loader2, AlertCircle } from 'lucide-react';

interface RescheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment;
    onReschedule: (newTime: string, reason?: string) => Promise<void>;
    userRole: 'patient' | 'doctor';
}

interface Doctor {
    doctorId: string;
    name: string;
    specialization: string;
    clinicHours: Array<{ day: string; from: string; to: string }>;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({
    isOpen,
    onClose,
    appointment,
    onReschedule,
    userRole
}) => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingSlots, setFetchingSlots] = useState(false);
    const [error, setError] = useState('');
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [doctorAppointments, setDoctorAppointments] = useState<Appointment[]>([]);

    const availableSlots = [
        '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '12:00 PM', '12:30 PM',
        '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
        '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM'
    ];

    useEffect(() => {
        if (isOpen && appointment) {
            fetchDoctorDetails();
            fetchDoctorAppointments();
        }
    }, [isOpen, appointment]);

    const fetchDoctorDetails = async () => {
        try {
            const response = await api.get('/doctors');
            const doc = response.data.find((d: Doctor) => d.doctorId === appointment.doctorId);
            setDoctor(doc || null);
        } catch (err) {
            console.error('Error fetching doctor details:', err);
        }
    };

    const fetchDoctorAppointments = async () => {
        try {
            setFetchingSlots(true);
            const response = await api.get(`/appointments/doctor/${appointment.doctorId}`);
            setDoctorAppointments(response.data);
        } catch (err) {
            console.error('Error fetching doctor appointments:', err);
        } finally {
            setFetchingSlots(false);
        }
    };

    // Get booked slots for selected date
    const getBookedSlots = (): string[] => {
        if (!selectedDate) return [];

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const bookedSlots: string[] = [];

        doctorAppointments.forEach(apt => {
            // Exclude current appointment from booked slots (since we are rescheduling it)
            if (apt.id === appointment.id) return;

            const aptDate = format(new Date(apt.startTimestamp), 'yyyy-MM-dd');
            if (aptDate === dateStr) {
                const aptTime = format(new Date(apt.startTimestamp), 'hh:mm a');
                bookedSlots.push(aptTime);
            }
        });

        return bookedSlots;
    };

    // Get available time slots based on doctor's clinic hours and existing bookings
    const getAvailableSlots = (): string[] => {
        if (!selectedDate || !doctor) return [];

        const dayName = format(selectedDate, 'EEEE');
        const clinicDay = doctor.clinicHours.find(ch => ch.day === dayName);

        if (!clinicDay) return []; // Doctor not available on this day

        // Parse clinic hours
        const [fromHour, fromMin] = clinicDay.from.split(':').map(Number);
        const [toHour, toMin] = clinicDay.to.split(':').map(Number);

        // Filter slots within clinic hours
        const slotsInRange = availableSlots.filter(slot => {
            const [time, period] = slot.split(' ');
            const [hours, minutes] = time.split(':').map(Number);
            let hour = hours;
            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;

            const slotMinutes = hour * 60 + minutes;
            const fromMinutes = fromHour * 60 + fromMin;
            const toMinutes = toHour * 60 + toMin;

            return slotMinutes >= fromMinutes && slotMinutes < toMinutes;
        });

        // Remove booked slots
        const bookedSlots = getBookedSlots();
        return slotsInRange.filter(slot => !bookedSlots.includes(slot));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !selectedSlot) {
            setError('Please select a date and time');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const startTimestamp = new Date(selectedDate);
            const [time, period] = selectedSlot.split(' ');
            const [hours, minutes] = time.split(':');
            let hour = parseInt(hours);
            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;

            startTimestamp.setHours(hour, parseInt(minutes), 0, 0);

            // Create ISO string preserving local time
            const year = startTimestamp.getFullYear();
            const month = String(startTimestamp.getMonth() + 1).padStart(2, '0');
            const day = String(startTimestamp.getDate()).padStart(2, '0');
            const hourStr = String(startTimestamp.getHours()).padStart(2, '0');
            const minStr = String(startTimestamp.getMinutes()).padStart(2, '0');
            const localDateTimeString = `${year}-${month}-${day}T${hourStr}:${minStr}:00`;

            await onReschedule(localDateTimeString, reason || undefined);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to reschedule');
        } finally {
            setLoading(false);
        }
    };

    // Check if a date is available based on doctor's clinic hours
    const isDateAvailable = (date: Date) => {
        if (!doctor || !doctor.clinicHours) return false;
        const dayName = format(date, 'EEEE');
        return doctor.clinicHours.some(ch => ch.day === dayName);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Reschedule Appointment</h2>
                        <p className="text-gray-500">Select a new date and time for {appointment.patientName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Calendar */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-4">1. Select New Date</h3>
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <CalendarView
                                selectedDate={selectedDate}
                                onSelect={(date) => {
                                    setSelectedDate(date);
                                    setSelectedSlot(null);
                                }}
                                isDateAvailable={isDateAvailable}
                            />
                        </div>
                    </div>

                    {/* Right Column: Time Slots & Reason */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-700 mb-4">2. Select New Time</h3>
                            {fetchingSlots ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                </div>
                            ) : (
                                <TimeSlotPicker
                                    slots={getAvailableSlots()}
                                    selectedSlot={selectedSlot}
                                    onSelect={setSelectedSlot}
                                />
                            )}
                        </div>

                        {userRole === 'doctor' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reason for Reschedule (Optional)
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={3}
                                    placeholder="Explain why you need to reschedule..."
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !selectedDate || !selectedSlot}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                {loading ? 'Sending Proposal...' : 'Send Reschedule Proposal'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RescheduleModal;
