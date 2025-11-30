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
        <div className="w-full">
            <style jsx global>{`
                .rdp {
                    --rdp-cell-size: 40px;
                    margin: 0;
                    font-family: inherit;
                }
                
                .rdp-months {
                    justify-content: center;
                }
                
                .rdp-month {
                    width: 100%;
                }
                
                .rdp-caption {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 0.75rem 0;
                    margin-bottom: 0.5rem;
                }
                
                .rdp-caption_label {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: #1f2937;
                }
                
                .rdp-nav {
                    display: flex;
                    gap: 0.5rem;
                }
                
                .rdp-nav_button {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: white;
                    border: 2px solid #e5e7eb;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .rdp-nav_button:hover:not(:disabled) {
                    background: #8b5cf6;
                    border-color: #8b5cf6;
                    transform: scale(1.05);
                }
                
                .rdp-nav_button:hover:not(:disabled) svg {
                    color: white;
                }
                
                .rdp-head_cell {
                    color: #6b7280;
                    font-weight: 600;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    padding: 0.5rem 0;
                }
                
                .rdp-cell {
                    padding: 2px;
                }
                
                .rdp-day {
                    width: 38px;
                    height: 38px;
                    border-radius: 8px;
                    font-weight: 500;
                    font-size: 0.875rem;
                    transition: all 0.15s;
                    border: 2px solid transparent;
                    color: #374151;
                }
                
                .rdp-day:hover:not(.rdp-day_disabled):not(.rdp-day_selected) {
                    background: #f3e8ff;
                    border-color: #c084fc;
                    transform: scale(1.05);
                }
                
                .rdp-day_selected {
                    background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%) !important;
                    color: white !important;
                    font-weight: 700;
                    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
                    transform: scale(1.05);
                    border-color: transparent !important;
                }
                
                .rdp-day_today:not(.rdp-day_selected) {
                    background: #fef3c7;
                    color: #92400e;
                    font-weight: 700;
                    border-color: #fbbf24;
                }
                
                .rdp-day_disabled {
                    color: #d1d5db !important;
                    background: #f9fafb !important;
                    opacity: 1 !important;
                    cursor: not-allowed !important;
                    text-decoration: line-through;
                }
                
                .rdp-day_disabled:hover {
                    background: #f9fafb !important;
                    transform: none !important;
                    border-color: transparent !important;
                }
                
                .rdp-day_outside {
                    color: #d1d5db;
                    opacity: 0.3;
                }
            `}</style>

            <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={onSelect}
                disabled={disabledDays}
                modifiers={{
                    booked: bookedDates
                }}
                modifiersStyles={{
                    booked: {
                        border: '2px solid #ef4444',
                        color: '#ef4444',
                        background: '#fee2e2'
                    }
                }}
            />
        </div>
    );
}
