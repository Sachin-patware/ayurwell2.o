"use client";

import React, { useState, useEffect } from "react";
import { Appointment } from "@/services/appointmentService";
import { CalendarView } from "@/components/appointments/CalendarView";
import { TimeSlotPicker } from "@/components/appointments/TimeSlotPicker";
import { format } from "date-fns";
import api from "@/services/api";
import { Loader2, AlertCircle ,Calendar, } from "lucide-react";


interface RescheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment;
    onReschedule: (newTime: string, reason?: string) => Promise<void>;
    userRole: "patient" | "doctor";
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
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        new Date(appointment.startTimestamp)
    );
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingSlots, setFetchingSlots] = useState(false);
    const [error, setError] = useState("");
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [doctorAppointments, setDoctorAppointments] = useState<Appointment[]>([]);

    // ----------------------------------------
    // Fetch doctor + doctor appointments
    // ----------------------------------------
    useEffect(() => {
        if (isOpen) {
            fetchDoctorDetails();
            fetchDoctorAppointments();
            setSelectedSlot(null);
        }
    }, [isOpen]);

    const fetchDoctorDetails = async () => {
        try {
            const response = await api.get("/doctors");
            const doc = response.data.find(
                (d: Doctor) => d.doctorId === appointment.doctorId
            );
            setDoctor(doc || null);
        } catch (error) {
            console.error("Error fetching doctor:", error);
        }
    };

    const fetchDoctorAppointments = async () => {
        try {
            setFetchingSlots(true);
            const response = await api.get(`/appointments/doctor/${appointment.doctorId}`);
            setDoctorAppointments(response.data);
        } catch (error) {
            console.error("Error fetching doctor appointments:", error);
        } finally {
            setFetchingSlots(false);
        }
    };

    // ----------------------------------------
    // Slot Logic
    // ----------------------------------------
    const generateTimeSlots = (start: string, end: string): string[] => {
        const slots: string[] = [];
        let [h, m] = start.split(":").map(Number);
        const [endH, endM] = end.split(":").map(Number);

        while (h < endH || (h === endH && m < endM)) {
            const period = h >= 12 ? "PM" : "AM";
            const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
            const displayM = m === 0 ? "00" : m;

            slots.push(`${String(displayH).padStart(2, "0")}:${displayM} ${period}`);

            m += 30;
            if (m >= 60) {
                h++;
                m = 0;
            }
        }
        return slots;
    };

    const getAllSlots = () => {
        if (!selectedDate || !doctor) return [];
        const day = format(selectedDate, "EEEE");
        const clinic = doctor.clinicHours.find((c) => c.day === day);
        if (!clinic) return [];
        return generateTimeSlots(clinic.from, clinic.to);
    };

    const getBookedSlots = () => {
        if (!selectedDate) return [];
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        return doctorAppointments
            .filter((apt) => apt.id !== appointment.id)
            .filter((apt) => format(new Date(apt.startTimestamp), "yyyy-MM-dd") === dateStr)
            .map((apt) => format(new Date(apt.startTimestamp), "hh:mm a"));
    };

   const getCurrentSlot = () => {
    if (!selectedDate) return null;

    const old = new Date(appointment.startTimestamp);

    const oldDateStr = format(old, "yyyy-MM-dd");
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

    return oldDateStr === selectedDateStr
        ? format(old, "hh:mm a")
        : null;
};

    const allSlots = getAllSlots();
    const bookedSlots = getBookedSlots();
    const currentSlot = getCurrentSlot();

    // ----------------------------------------
    // Submit Handler
    // ----------------------------------------
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot || !selectedDate) {
            setError("Select valid date and time");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const dt = new Date(selectedDate);
            const [time, period] = selectedSlot.split(" ");
            let [h, m] = time.split(":").map(Number);

            if (period === "PM" && h !== 12) h += 12;
            if (period === "AM" && h === 12) h = 0;

            dt.setHours(h, m, 0, 0);

            await onReschedule(format(dt, "yyyy-MM-dd'T'HH:mm:ss"), reason || undefined);

            onClose();
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const isDateAvailable = (date: Date) => {
        if (!doctor) return false;
        const day = format(date, "EEEE");
        return doctor.clinicHours.some((c) => c.day === day);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50/95 via-purple-50/95 to-pink-50/95 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 my-4 border border-gray-100">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-t-2xl p-4 text-white flex justify-between sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold">Reschedule Appointment</h2>
                        <p className="text-sm opacity-80">{appointment.patientName}</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full">✕</button>
                </div>

                <div className="p-4 space-y-5">
                    
        
                                            
                    {/* CALENDAR & SLOTS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                        {/* LEFT: Calendar */}
                        <div className="border-2 border-blue-300 rounded-xl bg-white p-4 shadow-sm">
                            <CalendarView
                                selectedDate={selectedDate}
                                onSelect={(d) => {
                                    setSelectedDate(d);
                                    setSelectedSlot(null);
                                }}
                                isDateAvailable={isDateAvailable}
                            />
                        </div>
                        

                        {/* RIGHT: Slots */}
                        <div className="border-2 border-purple-300 rounded-xl bg-white p-4 shadow-sm overflow-y-auto">

                            {fetchingSlots ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="animate-spin h-6 w-6 text-purple-500" />
                                </div>
                            ) : (
                                <TimeSlotPicker
                                    slots={allSlots}
                                    selectedSlot={selectedSlot}
                                    onSelect={setSelectedSlot}
                                    bookedSlots={bookedSlots}
                                    currentSlot={currentSlot}
                                />
                            )}

                        </div>
                    </div>

                    {/* Reason (doctor) */}
                    {userRole === "doctor" && (
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Reason (optional)"
                            className="w-full border-2 rounded-xl p-3 bg-white"
                            rows={2}
                        />
                    )}

                    {/* ERROR */}
                    {error && (
                        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl">
                            <AlertCircle className="h-4 w-4" /> {error}
                        </div>
                    )}

                    {/* ACTION BUTTONS */}
                    <div className="flex gap-4 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border-2 rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedSlot || loading}
                            className="px-5 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Send Proposal"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RescheduleModal;
