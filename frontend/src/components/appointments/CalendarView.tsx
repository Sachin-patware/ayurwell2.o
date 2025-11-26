'use client';

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';
import { Card, CardContent } from '@/components/ui/card';

interface CalendarViewProps {
    selectedDate: Date | undefined;
    onSelect: (date: Date | undefined) => void;
    bookedDates?: Date[];
    isDateAvailable?: (date: Date) => boolean;
}

export function CalendarView({ selectedDate, onSelect, bookedDates = [], isDateAvailable }: CalendarViewProps) {
    const disabledDays = isDateAvailable
        ? (date: Date) => !isDateAvailable(date) || date < new Date(new Date().setHours(0, 0, 0, 0))
        : (date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0));

    return (
        <Card className="w-fit">
            <CardContent className="p-4">
                <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={onSelect}
                    disabled={disabledDays}
                    modifiers={{
                        booked: bookedDates
                    }}
                    modifiersStyles={{
                        booked: { border: '2px solid #E07A5F', color: '#E07A5F' }
                    }}
                    styles={{
                        caption: { color: '#2E7D32' },
                        head_cell: { color: '#666' },
                        day_selected: { backgroundColor: '#2E7D32', color: 'white' },
                        day_today: { color: '#E07A5F', fontWeight: 'bold' },
                        day_disabled: { color: '#ccc', textDecoration: 'line-through' }
                    }}
                />
                {selectedDate && (
                    <p className="text-center text-sm text-gray-500 mt-2">
                        Selected: {format(selectedDate, 'PPP')}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
