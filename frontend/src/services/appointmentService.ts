/**
 * Appointment Service
 * Centralized API calls for appointment management
 */

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/appointments`;

// Helper to get auth token
const getAuthToken = (): string | null => {
    return localStorage.getItem('token');
};

// Helper to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
};

export interface Appointment {
    id: string;
    doctorId: string;
    patientId: string;
    doctorName: string;
    patientName: string;
    startTimestamp: string;
    endTimestamp?: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'doctor_rescheduled_pending' | 'patient_rescheduled_pending' | 'completed';
    notes?: string;
    cancelReason?: string;
    rescheduleReason?: string;
    isRescheduledBy?: 'patient' | 'doctor' | null;
    proposedStartTimestamp?: string;
    proposedEndTimestamp?: string;
    createdAt: string;
    updatedAt: string;
}

export interface BookedSlot {
    id: string;
    startTimestamp: string;
    endTimestamp?: string;
    status: string;
}

/**
 * Book a new appointment
 */
export const bookAppointment = async (data: {
    doctor_id: string;
    startTimestamp: string;
    notes?: string;
}): Promise<{ message: string; id: string; status: string }> => {
    return fetchWithAuth(`${API_BASE}/book`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/**
 * Get my appointments (patient or doctor)
 */
export const getMyAppointments = async (): Promise<Appointment[]> => {
    return fetchWithAuth(`${API_BASE}/me`);
};

/**
 * Get booked slots for a doctor (for conflict detection)
 */
export const getBookedSlots = async (doctorId: string): Promise<BookedSlot[]> => {
    return fetchWithAuth(`${API_BASE}/doctor/${doctorId}/upcoming`);
};

/**
 * Confirm an appointment (doctor only)
 */
export const confirmAppointment = async (appointmentId: string): Promise<{ message: string; status: string }> => {
    return fetchWithAuth(`${API_BASE}/${appointmentId}/confirm`, {
        method: 'POST',
    });
};

/**
 * Cancel an appointment
 */
export const cancelAppointment = async (
    appointmentId: string,
    reason?: string
): Promise<{ message: string; status: string }> => {
    return fetchWithAuth(`${API_BASE}/${appointmentId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    });
};

/**
 * Patient reschedules appointment
 */
export const rescheduleAsPatient = async (
    appointmentId: string,
    newStartTimestamp: string
): Promise<{ message: string; status: string }> => {
    return fetchWithAuth(`${API_BASE}/${appointmentId}/reschedule/patient`, {
        method: 'POST',
        body: JSON.stringify({ newStartTimestamp }),
    });
};

/**
 * Doctor proposes reschedule
 */
export const rescheduleAsDoctor = async (
    appointmentId: string,
    newStartTimestamp: string,
    reason?: string
): Promise<{ message: string; status: string }> => {
    return fetchWithAuth(`${API_BASE}/${appointmentId}/reschedule/doctor`, {
        method: 'POST',
        body: JSON.stringify({ newStartTimestamp, reason }),
    });
};

/**
 * Patient accepts doctor's reschedule proposal
 */
export const acceptDoctorReschedule = async (
    appointmentId: string
): Promise<{ message: string; status: string }> => {
    return fetchWithAuth(`${API_BASE}/${appointmentId}/reschedule/patient/accept`, {
        method: 'POST',
    });
};

/**
 * Patient rejects doctor's reschedule proposal
 */
export const rejectDoctorReschedule = async (
    appointmentId: string
): Promise<{ message: string; status: string }> => {
    return fetchWithAuth(`${API_BASE}/${appointmentId}/reschedule/patient/reject`, {
        method: 'POST',
    });
};
