'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/services/api';
import { motion } from 'framer-motion';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    doctorId?: string; // If booking with a specific doctor
}

export default function BookingModal({ isOpen, onClose, doctorId }: BookingModalProps) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Combine date and time
            const dateTime = new Date(`${date}T${time}:00`).toISOString();

            await api.post('/appointments', {
                doctor_id: doctorId || 'placeholder_doctor_id', // In real app, select from list
                date: dateTime,
                notes
            });
            alert('Appointment booked successfully!');
            onClose();
        } catch (error) {
            console.error('Booking failed', error);
            alert('Failed to book appointment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Book Appointment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleBook} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Date</label>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Time</label>
                                <Input type="time" value={time} onChange={e => setTime(e.target.value)} required />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Notes</label>
                                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for visit" />
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                                <Button type="submit" disabled={loading}>{loading ? 'Booking...' : 'Confirm Booking'}</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
