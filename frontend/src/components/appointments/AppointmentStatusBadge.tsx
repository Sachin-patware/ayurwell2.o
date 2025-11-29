import React from 'react';

interface AppointmentStatusBadgeProps {
    status: 'pending' | 'confirmed' | 'cancelled' | 'doctor_rescheduled_pending' | 'completed';
    className?: string;
}

const AppointmentStatusBadge: React.FC<AppointmentStatusBadgeProps> = ({ status, className = '' }) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'pending':
                return {
                    label: 'Pending',
                    bgColor: 'bg-yellow-100',
                    textColor: 'text-yellow-800',
                    borderColor: 'border-yellow-300',
                    icon: '⏳'
                };
            case 'confirmed':
                return {
                    label: 'Confirmed',
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-800',
                    borderColor: 'border-green-300',
                    icon: '✓'
                };
            case 'cancelled':
                return {
                    label: 'Cancelled',
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-800',
                    borderColor: 'border-red-300',
                    icon: '✕'
                };
            case 'doctor_rescheduled_pending':
                return {
                    label: 'Reschedule Pending',
                    bgColor: 'bg-orange-100',
                    textColor: 'text-orange-800',
                    borderColor: 'border-orange-300',
                    icon: '🔄'
                };
            case 'completed':
                return {
                    label: 'Completed',
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-800',
                    borderColor: 'border-gray-300',
                    icon: '✓'
                };
            default:
                return {
                    label: status,
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-800',
                    borderColor: 'border-gray-300',
                    icon: ''
                };
        }
    };

    const config = getStatusConfig();

    return (
        <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
            role="status"
            aria-label={`Status: ${config.label}`}
        >
            <span aria-hidden="true">{config.icon}</span>
            {config.label}
        </span>
    );
};

export default AppointmentStatusBadge;
