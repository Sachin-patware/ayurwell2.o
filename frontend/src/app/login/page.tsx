'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [error, setError] = useState<ReactNode>(null);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            setError(null);
            const response = await api.post('/auth/login', data);

            const { access_token, uid, name, email, role } = response.data;

            login({ uid, name, email, role }, access_token);

            // Redirect based on role
            if (role === 'doctor') {
                router.push('/practitioner/dashboard');
            } else if (role === 'patient') {
                router.push('/patient/dashboard');
            } else if (role === 'admin') {
                router.push('/admin/dashboard');
            } else {
                router.push('/dashboard'); // Fallback
            }
        } catch (err: any) {
            console.error('Login error:', err);

            // Check if email verification is required
            if (err.response?.data?.requiresVerification) {
                router.push(`/register?mode=verify&email=${encodeURIComponent(data.email)}`);
                return;
            } else {
                setError(err.response?.data?.error || err.response?.data?.message || 'Failed to login. Please check your credentials.');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F5DC] to-[#E8F5E9] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="border-none shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-[#2E7D32] to-[#81C784]" />
                    <CardHeader className="space-y-1 text-center pb-2">
                        <CardTitle className="text-3xl font-bold text-[#1B5E20]">Welcome Back</CardTitle>
                        <CardDescription className="text-gray-500">
                            Sign in to continue to AyurWell
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2"
                                >
                                    <div className="w-1 h-8 bg-red-500 rounded-full" />
                                    {error}
                                </motion.div>
                            )}

                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    {...register('email')}
                                    className={`h-11 border-gray-200 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition-all duration-200 ${errors.email ? "border-red-500 focus:ring-red-200" : ""}`}
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-500 font-medium ml-1">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label htmlFor="password" className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        {...register('password')}
                                        className={`h-11 pr-10 border-gray-200 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition-all duration-200 ${errors.password ? "border-red-500 focus:ring-red-200" : ""}`}
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#2E7D32] transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-red-500 font-medium ml-1">{errors.password.message}</p>
                                )}
                                <div className="text-right">
                                    <Link href="/forgot-password" className="text-xs text-[#2E7D32] hover:text-[#1B5E20] font-medium transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-gradient-to-r from-[#2E7D32] to-[#43A047] hover:from-[#1B5E20] hover:to-[#2E7D32] text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...</>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        <div className="mt-8 text-center text-sm text-gray-600">
                            <span className="text-gray-500">New to AyurWell? </span>
                            <Link href="/register" className="text-[#2E7D32] hover:text-[#1B5E20] font-bold hover:underline transition-all ml-1">
                                Create Account
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
