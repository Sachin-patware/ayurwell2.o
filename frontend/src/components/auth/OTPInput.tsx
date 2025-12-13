'use client';

import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { Input } from '@/components/ui/input';

interface OTPInputProps {
    length?: number;
    onComplete: (otp: string) => void;
    disabled?: boolean;
}

export default function OTPInput({ length = 6, onComplete, disabled = false }: OTPInputProps) {
    const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        if (disabled) return;

        // Only allow digits
        const digit = value.replace(/[^0-9]/g, '');

        if (digit.length > 1) {
            // Handle paste
            handlePaste(digit, index);
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        // Auto-focus next input
        if (digit && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Check if OTP is complete
        if (newOtp.every(d => d !== '') && newOtp.join('').length === length) {
            onComplete(newOtp.join(''));
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;

        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                // Move to previous input if current is empty
                inputRefs.current[index - 1]?.focus();
            } else {
                // Clear current input
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (pastedData: string, startIndex: number = 0) => {
        if (disabled) return;

        const digits = pastedData.replace(/[^0-9]/g, '').split('');
        const newOtp = [...otp];

        digits.forEach((digit, i) => {
            const index = startIndex + i;
            if (index < length) {
                newOtp[index] = digit;
            }
        });

        setOtp(newOtp);

        // Focus the next empty input or the last input
        const nextEmptyIndex = newOtp.findIndex(d => d === '');
        if (nextEmptyIndex !== -1) {
            inputRefs.current[nextEmptyIndex]?.focus();
        } else {
            inputRefs.current[length - 1]?.focus();
        }

        // Check if OTP is complete
        if (newOtp.every(d => d !== '') && newOtp.join('').length === length) {
            onComplete(newOtp.join(''));
        }
    };

    const handlePasteEvent = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        handlePaste(pastedData, index);
    };

    return (
        <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
                <Input
                    key={index}
                    ref={el => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={e => handlePasteEvent(e, index)}
                    disabled={disabled}
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg
                        ${digit ? 'border-[#2E7D32] bg-[#E9F7EF]' : 'border-gray-300'}
                        focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20
                        transition-all duration-200
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                />
            ))}
        </div>
    );
}
