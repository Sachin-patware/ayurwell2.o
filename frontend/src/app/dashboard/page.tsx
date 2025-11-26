'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login');
            } else if (user.role === 'doctor') {
                router.push('/practitioner/dashboard');
            } else if (user.role === 'patient') {
                router.push('/patient/dashboard');
            } else if (user.role === 'admin') {
                router.push('/admin/dashboard');
            } else {
                // Fallback for unknown roles
                router.push('/login');
            }
        }
    }, [user, isLoading, router]);

    return (
        <div className="flex items-center justify-center h-screen bg-[#F5F5DC]">
            <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-[#A2B38B] mx-auto mb-4" />
                <p className="text-[#2E7D32] font-medium">Redirecting to your dashboard...</p>
            </div>
        </div>
    );
}
