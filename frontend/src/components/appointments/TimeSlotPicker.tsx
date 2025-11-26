'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TimeSlotPickerProps {
    slots: string[];
    selectedSlot: string | null;
    onSelect: (slot: string) => void;
}

export function TimeSlotPicker({ slots, selectedSlot, onSelect }: TimeSlotPickerProps) {
    return (
        <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Available Slots</h3>
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <div className="grid grid-cols-2 gap-3">
                    {slots.map((slot) => (
                        <Button
                            key={slot}
                            variant={selectedSlot === slot ? 'default' : 'outline'}
                            className={`w-full ${selectedSlot === slot
                                    ? 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white'
                                    : 'hover:bg-[#E9F7EF] hover:text-[#2E7D32] hover:border-[#2E7D32]'
                                }`}
                            onClick={() => onSelect(slot)}
                        >
                            {slot}
                        </Button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
