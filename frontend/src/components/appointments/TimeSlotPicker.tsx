'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Lock, Calendar } from 'lucide-react';

interface TimeSlotPickerProps {
    slots: string[];
    selectedSlot: string | null;
    onSelect: (slot: string) => void;
    bookedSlots?: string[];
    currentSlot?: string | null;
}

export function TimeSlotPicker({ slots, selectedSlot, onSelect, bookedSlots = [], currentSlot = null }: TimeSlotPickerProps) {
    if (slots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="text-4xl mb-2">⏰</div>
                <p className="text-sm text-gray-600 font-medium">No slots available</p>
                <p className="text-xs text-gray-500 mt-1">Try a different date</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-1.5">
            {slots.map((slot) => {
                const isSelected = selectedSlot === slot;
                const isBooked = bookedSlots.includes(slot);
                const isCurrent = currentSlot === slot ;
                return (
                    <button
                        key={slot}
                        onClick={() => {
                            if (!isBooked && !isCurrent) {
                                onSelect(slot);
                            }
                        }}
                        disabled={isBooked || isCurrent}
                        className={`
                            relative px-2 py-2 rounded-lg font-medium text-xs
                            transition-all duration-200 transform
                            ${isCurrent
                                ? 'bg-orange-100 border-2 border-orange-400 text-orange-700 cursor-not-allowed'
                                : isBooked
                                    ? 'bg-green-100 border-2 border-green-300 text-green-700 cursor-not-allowed opacity-60'
                                    : isSelected
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105 border-2 border-transparent'
                                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-400 hover:bg-purple-50 hover:scale-102 cursor-pointer'
                            }
                            ${!isBooked && !isCurrent && 'active:scale-95'}
                        `}
                    >
                        <div className="flex items-center justify-center gap-1">
                            {isCurrent ? (
                                <Calendar className="h-3 w-3" />
                            ) : isBooked ? (
                                <Lock className="h-3 w-3" />
                            ) : (
                                <Clock className={`h-3 w-3 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                            )}
                            <span className="text-xs">{slot}</span>
                        </div>
                        {isCurrent && (
                            <div className="absolute -top-1 -right-1 bg-white rounded-full px-1 py-0.5">
                                <span className="text-[9px] font-bold text-orange-600">OLD</span>
                            </div>
                        )}
                        {isBooked && (
                            <div className="absolute -top-1 -right-1 bg-white rounded-full px-1 py-0.5">
                                <span className="text-[9px] font-bold text-green-600">BOOKED</span>
                            </div>
                        )}
                        {isSelected && !isBooked && !isCurrent && (
                            <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                                <svg className="w-2.5 h-2.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
