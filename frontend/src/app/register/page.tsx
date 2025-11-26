'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

const registerSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['patient', 'doctor']),
    phone: z.string().optional(),
    specialization: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const [error, setError] = useState('');
    const router = useRouter();
    const { login } = useAuth();

    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: 'patient',
        },
    });

    const selectedRole = watch('role');

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            const response = await api.post('/auth/register', data);

            // Auto-login: Use the returned token and user data
            const { access_token, uid, name, email, role } = response.data;

            // Call login from AuthContext to set cookies and state
            login({ uid, name, email, role }, access_token);

            // Redirect based on role
            if (role === 'doctor') {
                router.push('/practitioner/dashboard');
            } else if (role === 'patient') {
                router.push('/patient/dashboard');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#E9F7EF] p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-2xl font-bold text-[#2E7D32]">Create Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error && <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Full Name</label>
                                <Input {...register('name')} placeholder="Enter your full name" />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <Input type="email" {...register('email')} placeholder="Enter your email" />
                                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Password</label>
                                <Input type="password" {...register('password')} placeholder="Enter password" />
                                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Phone (Optional)</label>
                                <Input {...register('phone')} placeholder="+91-1234567890" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">I am a...</label>
                                <select
                                    {...register('role')}
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]"
                                >
                                    <option value="patient">Patient</option>
                                    <option value="doctor">Doctor / Practitioner</option>
                                </select>
                                {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
                            </div>

                            {selectedRole === 'doctor' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Specialization</label>
                                    <Input {...register('specialization')} placeholder="e.g., Kayachikitsa" />
                                </div>
                            )}

                            <Button type="submit" className="w-full bg-[#2E7D32] hover:bg-[#1B5E20]" disabled={isSubmitting}>
                                {isSubmitting ? 'Registering...' : 'Register'}
                            </Button>
                        </form>
                        <div className="mt-4 text-center text-sm text-gray-600">
                            Already have an account? <Link href="/login" className="text-[#2E7D32] hover:underline font-medium">Login</Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
