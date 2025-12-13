'use client';

import React, { useCallback, useEffect, useState } from 'react';
import PatientLayout from '@/components/layouts/PatientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    User,
    MapPin,
    Edit2,
    Save,
    X,
    Loader2,
    Heart,
    Activity,
    Mail,
    Phone
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import OTPInput from '@/components/auth/OTPInput';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';
import api from '@/services/api';
import { toast } from 'react-toastify';
import { RenderField } from '@/components/Renderfield';
import { useAuth } from '@/contexts/AuthContext';

type ProfileType = {
    patientId: string;
    personalInfo: {
        name: string;
        gender: string;
        age: string | number;
        email: string;
        phone: string;
        address: { line1: string; city: string; state: string; pincode: string };
    };
    medicalInfo: {
        bloodGroup: string;
        dietPreferences: string;
        smoking: boolean;
        alcohol: boolean;
    };
};

const defaultProfile: ProfileType = {
    patientId: '',
    personalInfo: {
        name: '',
        gender: '',
        age: '',
        email: '',
        phone: '',
        address: { line1: '', city: '', state: '', pincode: '' }
    },
    medicalInfo: {
        bloodGroup: '',
        dietPreferences: '',
        smoking: false,
        alcohol: false
    }
};

export default function PatientProfilePage() {
    const { refreshUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');
    const [profile, setProfile] = useState<ProfileType>(defaultProfile);

    // Email Change State
    const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);

    const handleEmailUpdateSuccess = (newEmail: string) => {
        setProfile(prev => ({
            ...prev,
            personalInfo: { ...prev.personalInfo, email: newEmail }
        }));
        setShowEmailChangeModal(false);
        refreshUser({ email: newEmail }); // Refresh global auth state
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = useCallback(async () => {
        try {
            const response = await api.get('/patient/profile');
            const data = response.data || {};

            setProfile(prev => ({
                ...prev,
                patientId: data.patientId,
                personalInfo: { ...prev.personalInfo, ...(data.personalInfo || {}) },
                medicalInfo: { ...prev.medicalInfo, ...(data.medicalInfo || {}) }
            }));
        } catch (err) {
            console.error('Error fetching profile:', err);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSave = useCallback(async () => {
        try {
            setSaving(true);
            await api.put('/patient/profile', profile);

            // Refresh user context if name changed
            if (profile.personalInfo.name) {
                refreshUser({ name: profile.personalInfo.name });
            }

            toast.success('Profile updated successfully');
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating profile:', err);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    }, [profile, refreshUser]);


    const handleChange = useCallback(
        (section: keyof ProfileType, field: string, value: any, nestedField?: string) => {
            setProfile(prev => {
                const next = { ...prev };
                if (nestedField) {
                    const sectionObj: any = { ...(next[section] as any) };
                    const target = { ...(sectionObj[field] as any) };
                    target[nestedField] = value;
                    sectionObj[field] = target;
                    (next as any)[section] = sectionObj;
                } else {
                    const sectionObj: any = { ...(next[section] as any) };
                    sectionObj[field] = value;
                    (next as any)[section] = sectionObj;
                }
                return next;
            });
        },
        []
    );

    if (loading) {
        return (
            <PatientLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="h-12 w-12 animate-spin text-[#2E7D32]" />
                </div>
            </PatientLayout>
        );
    }

    return (
        <PatientLayout>
            <div className="space-y-8 max-w-4xl mx-auto pb-10">
                {/* Header Banner */}
                <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] text-white p-8 shadow-lg">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center overflow-hidden shadow-xl">
                                <User className="h-12 w-12 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{profile.personalInfo.name || 'Patient Profile'}</h1>
                                <p className="text-green-100 text-lg flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {profile.personalInfo.email || 'No email provided'}
                                </p>
                                <p className="text-green-100 text-lg flex items-center gap-2">
                                    <span className="font-semibold">Patient ID:</span>
                                    {profile.patientId || 'No Patient ID'}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-green-50">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {profile.personalInfo.address?.city || 'Location not set'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {isEditing ? (
                                <>
                                    <Button
                                        variant="secondary"
                                        className="bg-white/10 hover:bg-white/20 text-white border-none"
                                        onClick={() => setIsEditing(false)}
                                        disabled={saving}
                                    >
                                        <X className="mr-2 h-4 w-4" /> Cancel
                                    </Button>
                                    <Button className="bg-white text-[#1B5E20] hover:bg-green-50" onClick={handleSave} disabled={saving}>
                                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save Changes
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 hover:border-white/40 backdrop-blur-sm"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-black/5 rounded-full blur-2xl"></div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-white border p-1.5 rounded-xl w-full md:w-auto grid grid-cols-2 h-auto shadow-sm">
                        {[
                            { id: 'personal', label: 'Personal Information', icon: User },
                            { id: 'medical', label: 'Medical Details', icon: Activity }
                        ].map(tab => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="data-[state=active]:bg-green-50 data-[state=active]:text-[#2E7D32] data-[state=active]:shadow-sm rounded-lg py-2.5 transition-all"
                            >
                                <tab.icon className="w-4 h-4 mr-2" /> {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* Personal Info Tab */}
                    <TabsContent value="personal" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <Card className="border-none shadow-md overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b pb-4">
                                <CardTitle className="text-xl text-[#2E7D32]">Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <RenderField
                                        label="Full Name"
                                        value={profile.personalInfo.name}
                                        onChange={e => handleChange('personalInfo', 'name', e.target.value)}
                                        icon={User}
                                        isEditing={isEditing}
                                    />

                                    {/* Email Field with Edit Button */}
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Email</Label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 flex items-center gap-2 text-gray-900 font-medium p-2 bg-gray-100 rounded-md border border-transparent">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <span>{profile.personalInfo.email}</span>
                                            </div>
                                            {isEditing && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-[#2E7D32] text-[#2E7D32] hover:bg-[#E9F7EF]"
                                                    onClick={() => setShowEmailChangeModal(true)}
                                                >
                                                    Change
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <RenderField
                                        label="Phone"
                                        value={profile.personalInfo.phone}
                                        onChange={e => handleChange('personalInfo', 'phone', e.target.value)}
                                        icon={Phone}
                                        isEditing={isEditing}
                                    />

                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <Label>Gender</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={profile.personalInfo.gender}
                                                onChange={e => handleChange('personalInfo', 'gender', e.target.value)}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <RenderField label="Gender" value={profile.personalInfo.gender} isEditing={isEditing} />
                                    )}

                                    <RenderField
                                        label="Age"
                                        value={profile.personalInfo.age}
                                        onChange={e => handleChange('personalInfo', 'age', e.target.value)}
                                        type="number"
                                        placeholder="Years"
                                        isEditing={isEditing}
                                    />
                                </div>

                                {/* Address */}
                                <div className="space-y-4 pt-6 border-t border-dashed">
                                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-[#2E7D32]" /> Address
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <RenderField
                                            label="Address Line 1"
                                            value={profile.personalInfo.address?.line1}
                                            onChange={e => handleChange('personalInfo', 'address', e.target.value, 'line1')}
                                            isEditing={isEditing}
                                        />
                                        <RenderField
                                            label="City"
                                            value={profile.personalInfo.address?.city}
                                            onChange={e => handleChange('personalInfo', 'address', e.target.value, 'city')}
                                            isEditing={isEditing}
                                        />
                                        <RenderField
                                            label="State"
                                            value={profile.personalInfo.address?.state}
                                            onChange={e => handleChange('personalInfo', 'address', e.target.value, 'state')}
                                            isEditing={isEditing}
                                        />
                                        <RenderField
                                            label="Pincode"
                                            value={profile.personalInfo.address?.pincode}
                                            onChange={e => handleChange('personalInfo', 'address', e.target.value, 'pincode')}
                                            isEditing={isEditing}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Medical Info Tab */}
                    <TabsContent value="medical" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <Card className="border-none shadow-md overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b pb-4">
                                <CardTitle className="text-xl text-[#2E7D32]">Medical Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <Label>Blood Group</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={profile.medicalInfo.bloodGroup}
                                                onChange={e => handleChange('medicalInfo', 'bloodGroup', e.target.value)}
                                            >
                                                <option value="">Select Blood Group</option>
                                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                    <option key={bg} value={bg}>{bg}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <RenderField label="Blood Group" value={profile.medicalInfo.bloodGroup} icon={Heart} isEditing={isEditing} />
                                    )}

                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <Label>Diet Preferences</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={profile.medicalInfo.dietPreferences}
                                                onChange={e => handleChange('medicalInfo', 'dietPreferences', e.target.value)}
                                            >
                                                <option value="">Select Diet</option>
                                                <option value="Vegetarian">Vegetarian</option>
                                                <option value="Non-Vegetarian">Non-Vegetarian</option>
                                                <option value="Vegan">Vegan</option>
                                                <option value="Eggetarian">Eggetarian</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <RenderField label="Diet Preferences" value={profile.medicalInfo.dietPreferences} isEditing={isEditing} />
                                    )}
                                </div>

                                <div className="space-y-4 pt-6 border-t border-dashed">
                                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-[#2E7D32]" /> Lifestyle Habits
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                                            <Label className="cursor-pointer">Smoking</Label>
                                            {isEditing ? (
                                                <input
                                                    type="checkbox"
                                                    className="h-5 w-5 accent-[#2E7D32]"
                                                    checked={profile.medicalInfo.smoking}
                                                    onChange={e => handleChange('medicalInfo', 'smoking', e.target.checked)}
                                                />
                                            ) : (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${profile.medicalInfo.smoking ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    {profile.medicalInfo.smoking ? 'Yes' : 'No'}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                                            <Label className="cursor-pointer">Alcohol Consumption</Label>
                                            {isEditing ? (
                                                <input
                                                    type="checkbox"
                                                    className="h-5 w-5 accent-[#2E7D32]"
                                                    checked={profile.medicalInfo.alcohol}
                                                    onChange={e => handleChange('medicalInfo', 'alcohol', e.target.checked)}
                                                />
                                            ) : (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${profile.medicalInfo.alcohol ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    {profile.medicalInfo.alcohol ? 'Yes' : 'No'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {showEmailChangeModal && (
                    <EmailChangeModal
                        currentEmail={profile.personalInfo.email}
                        onClose={() => setShowEmailChangeModal(false)}
                        onSuccess={handleEmailUpdateSuccess}
                    />
                )}
            </div>
        </PatientLayout>
    );
}

function EmailChangeModal({ currentEmail, onClose, onSuccess }: { currentEmail: string, onClose: () => void, onSuccess: (email: string) => void }) {
    const [newEmail, setNewEmail] = useState('');
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);

    // Countdown timer
    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCountdown]);

    const handleRequestChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!newEmail) {
            setError('Please enter a new email address');
            setIsLoading(false);
            return;
        }

        if (newEmail === currentEmail) {
            setError('New email cannot be the same as current email');
            setIsLoading(false);
            return;
        }

        try {
            await api.post('/auth/request-email-change', { newEmail });
            setStep('verify');
            setResendCountdown(60);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to request email change');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (otp: string) => {
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/verify-email-change', { otp });
            toast.success('Email changed successfully!');
            onSuccess(response.data.newEmail);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to verify email change');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setError('');
        setIsResending(true);
        try {
            await api.post('/auth/resend-otp', {
                email: newEmail,
                purpose: 'email_change'
            });
            setResendCountdown(60);
            toast.info('Verification code resent');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to resend OTP');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Change Email Address</DialogTitle>
                    <DialogDescription>
                        Update your registered email address. Verification required.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <AnimatePresence mode="wait">
                        {step === 'request' ? (
                            <motion.form
                                key="request"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onSubmit={handleRequestChange}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label>Current Email</Label>
                                    <Input value={currentEmail} disabled className="bg-gray-50" />
                                </div>
                                <div className="space-y-2">
                                    <Label>New Email Address</Label>
                                    <Input
                                        type="email"
                                        placeholder="Enter new email address"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                {error && (
                                    <div className="text-sm text-red-600 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        {error}
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isLoading || !newEmail}
                                        className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
                                    >
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP'}
                                    </Button>
                                </div>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="verify"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <div className="bg-[#E9F7EF] p-4 rounded-lg border border-[#2E7D32]/20">
                                    <h3 className="text-sm font-semibold text-[#1B5E20] mb-2">Verify New Email</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Code sent to <span className="font-bold">{newEmail}</span>
                                    </p>

                                    <OTPInput
                                        length={6}
                                        onComplete={handleVerify}
                                        disabled={isLoading}
                                    />

                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-xs">
                                            {resendCountdown > 0 ? (
                                                <span className="text-gray-400">Resend in {resendCountdown}s</span>
                                            ) : (
                                                <button
                                                    onClick={handleResendOTP}
                                                    disabled={isResending}
                                                    className="text-[#2E7D32] hover:underline font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isResending && <Loader2 className="h-3 w-3 animate-spin" />}
                                                    {isResending ? 'Resending...' : 'Resend Code'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="text-sm text-red-600 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        {error}
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 text-sm">
                                    <Button variant="ghost" onClick={() => setStep('request')} disabled={isLoading}>
                                        Back
                                    </Button>
                                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                                        Cancel
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}
