/**
 * HOW TO USE CONFIRM DIALOG
 * 
 * This component provides a beautiful confirmation dialog that matches your app's design.
 * It's a drop-in replacement for the native confirm() function.
 */

// STEP 1: Import the component
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useState } from 'react';
import api from '@/services/api';
import { toast } from 'react-toastify';

// STEP 2: Add state to control the dialog
const [confirmOpen, setConfirmOpen] = useState(false);
const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);



// AFTER (using ConfirmDialog):
const handleCancel = async (appointmentId: string) => {
    setPendingAction(() => async () => {
        try {
            await api.post(`/appointments/${appointmentId}/cancel`);
            toast.success('Appointment cancelled');
        } catch (error) {
            toast.error('Failed to cancel');
        }
    });
    setConfirmOpen(true);
};

// STEP 4: Add the dialog component to your JSX (at the end of your component)
return (
    <div>
        {/* Your existing code stays here */}

        {/* Add this at the bottom */}
        <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Cancel Appointment?"
            description="Are you sure you want to cancel this appointment? This action cannot be undone."
            confirmText="Yes, cancel"
            cancelText="No, keep it"
            variant="destructive"
            onConfirm={() => {
                if (pendingAction) pendingAction();
            }}
        />
    </div>
);

/**
 * PROPS REFERENCE:
 * 
 * - open: boolean - Controls if dialog is visible
 * - onOpenChange: (open: boolean) => void - Called when dialog should close
 * - title: string - Dialog title
 * - description: string - Dialog description
 * - onConfirm: () => void - Called when user clicks confirm
 * - confirmText?: string - Confirm button text (default: "Confirm")
 * - cancelText?: string - Cancel button text (default: "Cancel")
 * - variant?: 'default' | 'destructive' - Button style (default: "default")
 */
