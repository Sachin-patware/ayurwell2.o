'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, CheckCircle } from 'lucide-react';
import OTPInput from '@/components/auth/OTPInput';

const registerSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['patient', 'doctor']),
    specialization: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState<'register' | 'verify'>('register');
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: 'patient',
        },
    });

    const selectedRole = watch('role');

    // Check for verify mode in URL
    useEffect(() => {
        const mode = searchParams.get('mode');
        const emailParam = searchParams.get('email');
        if (mode === 'verify' && emailParam) {
            setRegisteredEmail(emailParam);
            setStep('verify');
            setValue('email', emailParam);
            setResendCountdown(60);
        }
    }, [searchParams, setValue]);

    // Countdown timer for resend OTP
    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCountdown]);

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            setError('');
            const response = await api.post('/auth/register', data);

            if (response.data.requiresVerification) {
                setRegisteredEmail(data.email);
                setStep('verify');
                setResendCountdown(60); // 60 seconds before allowing resend
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    const handleOTPComplete = async (otp: string) => {
        try {
            setError('');
            setIsVerifying(true);

            const response = await api.post('/auth/verify-email', {
                email: registeredEmail,
                otp: otp
            });

            // Auto-login: Use the returned token and user data
            const { access_token, uid, name, email, role } = response.data;

            // Call login from AuthContext to set cookies and state
            login({ uid, name, email, role }, access_token);

            setVerificationSuccess(true);

            if (role === 'doctor') {
                router.push('/practitioner/dashboard');
            } else if (role === 'patient') {
                router.push('/patient/dashboard');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Verification failed');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOTP = async () => {
        try {
            setError('');
            setIsResending(true);
            await api.post('/auth/resend-otp', {
                email: registeredEmail,
                purpose: 'signup'
            });
            setResendCountdown(60);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to resend OTP');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-[#E9F7EF] to-[#D5F5E3] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="border-none shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
                    <div className="h-2 bg-linear-to-r from-[#2E7D32] to-[#66BB6A]" />

                    <AnimatePresence mode="wait">
                        {step === 'register' ? (
                            <motion.div
                                key="register"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <CardHeader className="space-y-1 text-center pb-2">
                                    <CardTitle className="text-3xl font-bold text-[#1B5E20]">Create Account</CardTitle>
                                    <CardDescription className="text-gray-500">
                                        Join AyurWell for a healthier you
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2"
                                        >
                                            <div className="w-1 h-8 bg-red-500 rounded-full" />
                                            {error}
                                        </motion.div>
                                    )}
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
                                            <Input
                                                {...register('name')}
                                                placeholder="Enter your full name"
                                                className={`h-11 border-gray-200 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition-all duration-200 ${errors.name ? "border-red-500" : ""}`}
                                            />
                                            {errors.name && <p className="text-xs text-red-500 font-medium ml-1">{errors.name.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Email</label>
                                            <Input
                                                type="email"
                                                {...register('email')}
                                                placeholder="Enter your email"
                                                className={`h-11 border-gray-200 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition-all duration-200 ${errors.email ? "border-red-500" : ""}`}
                                            />
                                            {errors.email && <p className="text-xs text-red-500 font-medium ml-1">{errors.email.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    {...register('password')}
                                                    placeholder="Create a password"
                                                    className={`h-11 pr-10 border-gray-200 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition-all duration-200 ${errors.password ? "border-red-500" : ""}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#2E7D32] transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                            {errors.password && <p className="text-xs text-red-500 font-medium ml-1">{errors.password.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">I am a...</label>
                                            <select
                                                {...register('role')}
                                                className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition-all duration-200"
                                            >
                                                <option value="patient">Patient</option>
                                                <option value="doctor">Doctor / Practitioner</option>
                                            </select>
                                            {errors.role && <p className="text-xs text-red-500 font-medium ml-1">{errors.role.message}</p>}
                                        </div>

                                        {selectedRole === 'doctor' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="space-y-2"
                                            >
                                                <label className="text-sm font-semibold text-gray-700 ml-1">Specialization</label>
                                                <Input
                                                    {...register('specialization')}
                                                    placeholder="e.g., Kayachikitsa"
                                                    className="h-11 border-gray-200 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition-all duration-200"
                                                />
                                            </motion.div>
                                        )}

                                        <Button
                                            type="submit"
                                            className="w-full h-11 bg-gradient-to-r from-[#2E7D32] to-[#43A047] hover:from-[#1B5E20] hover:to-[#2E7D32] text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg mt-2"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</>
                                            ) : (
                                                'Create Account'
                                            )}
                                        </Button>
                                    </form>
                                    <div className="mt-6 text-center text-sm text-gray-600">
                                        <span className="text-gray-500">Already have an account? </span>
                                        <Link href="/login" className="text-[#2E7D32] hover:text-[#1B5E20] font-bold hover:underline transition-all ml-1">Login</Link>
                                    </div>
                                </CardContent>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="verify"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <CardHeader className="space-y-1 text-center pb-2">
                                    {verificationSuccess ? (
                                        <>
                                            <div className="mx-auto mb-4">
                                                <CheckCircle className="w-16 h-16 text-[#2E7D32]" />
                                            </div>
                                            <CardTitle className="text-3xl font-bold text-[#1B5E20]">Verified!</CardTitle>
                                            <CardDescription className="text-gray-500">
                                                Redirecting to login...
                                            </CardDescription>
                                        </>
                                    ) : (
                                        <>
                                            <div className="mx-auto mb-4">
                                                <Mail className="w-16 h-16 text-[#2E7D32]" />
                                            </div>
                                            <CardTitle className="text-3xl font-bold text-[#1B5E20]">Verify Your Email</CardTitle>
                                            <CardDescription className="text-gray-500">
                                                We've sent a 6-digit code to<br />
                                                <span className="font-semibold text-[#2E7D32]">{registeredEmail}</span>
                                            </CardDescription>
                                        </>
                                    )}
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {!verificationSuccess && (
                                        <>
                                            {error && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2"
                                                >
                                                    <div className="w-1 h-8 bg-red-500 rounded-full" />
                                                    {error}
                                                </motion.div>
                                            )}

                                            <div className="space-y-6">
                                                <div>
                                                    <label className="text-sm font-semibold text-gray-700 mb-3 block text-center">
                                                        Enter Verification Code
                                                    </label>
                                                    <OTPInput
                                                        length={6}
                                                        onComplete={handleOTPComplete}
                                                        disabled={isVerifying}
                                                    />
                                                </div>

                                                <div className="text-center">
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        Didn't receive the code?
                                                    </p>
                                                    {resendCountdown > 0 ? (
                                                        <p className="text-sm text-gray-500">
                                                            Resend in {resendCountdown}s
                                                        </p>
                                                    ) : (
                                                        <button
                                                            onClick={handleResendOTP}
                                                            disabled={isResending}
                                                            className="text-sm text-[#2E7D32] hover:text-[#1B5E20] font-bold hover:underline transition-all flex items-center gap-1 justify-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isResending && <Loader2 className="h-3 w-3 animate-spin" />}
                                                            {isResending ? 'Resending...' : 'Resend Code'}
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="text-center text-xs text-gray-500">
                                                    The code will expire in 5 minutes
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </motion.div>
        </div>
    );
}
