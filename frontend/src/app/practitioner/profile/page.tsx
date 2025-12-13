// pages/practitioner/profile.tsx (or wherever your page is)
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import PractitionerLayout from '@/components/layouts/PractitionerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Briefcase,
  MapPin,
  Settings,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  Loader2,
  Mail,
  Calendar
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import OTPInput from '@/components/auth/OTPInput';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '@/services/api';
import { toast } from 'react-toastify';
import { RenderField } from '@/components/Renderfield'; // or import from same file
import { useAuth } from '@/contexts/AuthContext';

type ProfileType = {
  doctorId: string;
  personalInfo: {
    name: string;
    gender: string;
    age: string | number;
    email: string;
    phone: string;
    address: { line1: string; line2: string; city: string; state: string; pincode: string };
  };
  professionalInfo: {
    specialization: string;
    qualification: string;
    experienceYears: number;
    registrationNumber: string;
    bio: string;
    languages: string[];
  };
  clinicInfo: {
    clinicName: string;
    clinicAddress: string;
    clinicHours: Array<{ day: string; from: string; to: string }>;
    consultationFee: { inClinic: number; online: number };
    location: { type: string; coordinates: [number, number] };
  };
  account: { status: string; };
};

const defaultProfile: ProfileType = {
  doctorId: '',
  personalInfo: {
    name: '',
    gender: '',
    age: '',
    email: '',
    phone: '',
    address: { line1: '', line2: '', city: '', state: '', pincode: '' }
  },
  professionalInfo: {
    specialization: '',
    qualification: '',
    experienceYears: 0,
    registrationNumber: '',
    bio: '',
    languages: []
  },
  clinicInfo: {
    clinicName: '',
    clinicAddress: '',
    clinicHours: [],
    consultationFee: { inClinic: 0, online: 0 },
    location: { type: 'Point', coordinates: [0, 0] }
  },
  account: { status: 'Pending' }
};

export default function DoctorProfilePage() {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [profile, setProfile] = useState<ProfileType>(defaultProfile);

  const newLangRef = useRef<HTMLInputElement | null>(null);

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
      const response = await api.get('/practitioner/profile');
      const data = response.data || {};
      // shallow merge to keep structure
      setProfile(prev => ({
        ...prev,
        ...data,
        doctorId: data.doctorId || '',
        personalInfo: { ...prev.personalInfo, ...(data.personalInfo || {}) },
        professionalInfo: { ...prev.professionalInfo, ...(data.professionalInfo || {}) },
        clinicInfo: { ...prev.clinicInfo, ...(data.clinicInfo || {}) },
        account: { ...prev.account, ...(data.account || {}) }
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
      await api.put('/practitioner/profile', profile);

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

  // Helper — update a nested field with minimal cloning
  const handleChange = useCallback(
    (section: keyof ProfileType, field: string, value: any, nestedField?: string) => {
      setProfile(prev => {
        const next = { ...prev };
        if (nestedField) {
          // e.g., section='clinicInfo', field='consultationFee', nestedField='inClinic'
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

  const addArrayItem = useCallback((section: keyof ProfileType, field: string, item: any) => {
    setProfile(prev => {
      const next = { ...prev };
      const sectionObj: any = { ...(next[section] as any) };
      sectionObj[field] = [...(sectionObj[field] || []), item];
      (next as any)[section] = sectionObj;
      return next;
    });
  }, []);

  const removeArrayItem = useCallback((section: keyof ProfileType, field: string, index: number) => {
    setProfile(prev => {
      const next = { ...prev };
      const sectionObj: any = { ...(next[section] as any) };
      sectionObj[field] = (sectionObj[field] || []).filter((_: any, i: number) => i !== index);
      (next as any)[section] = sectionObj;
      return next;
    });
  }, []);

  if (loading) {
    return (
      <PractitionerLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-[#2E7D32]" />
        </div>
      </PractitionerLayout>
    );
  }

  return (
    <PractitionerLayout>
      <div className="space-y-8 max-w-5xl mx-auto pb-10">
        {/* Header Banner */}
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-[#1B5E20] to-[#4CAF50] text-white p-8 shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{profile.personalInfo.name || 'Doctor Profile'}</h1>
                <p className="text-green-100 text-lg flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {profile.personalInfo.email || 'General Practitioner'}
                </p>
                <p className="text-green-100 text-lg flex items-center gap-2">
                  <span className="font-semibold">Doctor ID:</span>
                  {profile.doctorId || 'No Doctor ID'}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-green-50">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {profile.personalInfo.address?.city || 'Location not set'}
                  </span>
                  <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                    {profile.account.status === 'verified' ? 'Verified' : 'Pending Verification'}
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
          <TabsList className="bg-white border p-1.5 rounded-xl w-full md:w-auto grid grid-cols-2 md:grid-cols-4 h-auto shadow-sm">
            {[
              { id: 'personal', label: 'Personal', icon: User },
              { id: 'professional', label: 'Professional', icon: Briefcase },
              { id: 'clinic', label: 'Clinic', icon: MapPin },
              { id: 'account', label: 'Account', icon: Settings }
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

          {/* Personal */}
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
                      label="Line 1"
                      value={profile.personalInfo.address?.line1}
                      onChange={e => handleChange('personalInfo', 'address', e.target.value, 'line1')}
                      isEditing={isEditing}
                    />
                    <RenderField
                      label="Line 2"
                      value={profile.personalInfo.address?.line2}
                      onChange={e => handleChange('personalInfo', 'address', e.target.value, 'line2')}
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

          {/* Professional */}
          <TabsContent value="professional" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b pb-4">
                <CardTitle className="text-xl text-[#2E7D32]">Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <RenderField
                    label="Specialization"
                    value={profile.professionalInfo.specialization}
                    onChange={e => handleChange('professionalInfo', 'specialization', e.target.value)}
                    icon={Briefcase}
                    isEditing={isEditing}
                  />
                  <RenderField
                    label="Qualification"
                    value={profile.professionalInfo.qualification}
                    onChange={e => handleChange('professionalInfo', 'qualification', e.target.value)}
                    isEditing={isEditing}
                  />
                  <RenderField
                    label="Experience (Years)"
                    value={profile.professionalInfo.experienceYears}
                    onChange={e => handleChange('professionalInfo', 'experienceYears', parseInt(e.target.value || '0', 10))}
                    type="number"
                    isEditing={isEditing}
                  />
                  <RenderField
                    label="Registration Number"
                    value={profile.professionalInfo.registrationNumber}
                    onChange={e => handleChange('professionalInfo', 'registrationNumber', e.target.value)}
                    isEditing={isEditing}
                  />
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Bio</Label>
                  {isEditing ? (
                    <textarea
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={profile.professionalInfo.bio}
                      onChange={e => handleChange('professionalInfo', 'bio', e.target.value)}
                      placeholder="Tell us about your professional background..."
                    />
                  ) : (
                    <div className="p-4 bg-gray-50/50 rounded-lg border border-transparent text-gray-700 leading-relaxed">
                      {profile.professionalInfo.bio || <span className="text-gray-400 italic">No bio provided</span>}
                    </div>
                  )}
                </div>

                {/* Languages */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Languages</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {profile.professionalInfo.languages?.map((lang, index) => (
                      <span key={lang + index} className="bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full text-sm flex items-center gap-1 font-medium">
                        {lang}
                        {isEditing && (
                          <button
                            onClick={() => removeArrayItem('professionalInfo', 'languages', index)}
                            className="ml-1 text-green-400 hover:text-red-500 transition-colors"
                            type="button"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    {!profile.professionalInfo.languages?.length && !isEditing && (
                      <span className="text-gray-400 italic text-sm">No languages listed</span>
                    )}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2 max-w-xs">
                      <Input placeholder="Add language..." ref={newLangRef as any} className="h-9" id="new-lang" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const val = newLangRef.current?.value?.trim();
                          if (val) {
                            addArrayItem('professionalInfo', 'languages', val);
                            if (newLangRef.current) newLangRef.current.value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clinic */}
          <TabsContent value="clinic" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b pb-4">
                <CardTitle className="text-xl text-[#2E7D32]">Clinic Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <RenderField
                    label="Clinic Name"
                    value={profile.clinicInfo.clinicName}
                    onChange={e => handleChange('clinicInfo', 'clinicName', e.target.value)}
                    icon={MapPin}
                    isEditing={isEditing}
                  />

                  <div className="space-y-4">
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Consultation Fees (₹)</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <RenderField
                        label="In-Clinic"
                        value={profile.clinicInfo.consultationFee?.inClinic}
                        onChange={e => handleChange('clinicInfo', 'consultationFee', parseInt(e.target.value || '0', 10), 'inClinic')}
                        type="number"
                        isEditing={isEditing}
                      />
                      <RenderField
                        label="Online"
                        value={profile.clinicInfo.consultationFee?.online}
                        onChange={e => handleChange('clinicInfo', 'consultationFee', parseInt(e.target.value || '0', 10), 'online')}
                        type="number"
                        isEditing={isEditing}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-dashed">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#2E7D32]" /> Clinic Location
                  </h3>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Address / Location Link</Label>
                    {isEditing ? (
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={profile.clinicInfo.clinicAddress || ''}
                        onChange={e => handleChange('clinicInfo', 'clinicAddress', e.target.value)}
                        placeholder="Enter full clinic address or Google Maps link..."
                      />
                    ) : (
                      <div className="p-4 bg-gray-50/50 rounded-lg border border-transparent text-gray-700 whitespace-pre-wrap">
                        {profile.clinicInfo.clinicAddress || <span className="text-gray-400 italic">No location details provided</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-dashed">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#2E7D32]" /> Clinic Hours
                    </h3>
                    {isEditing && (
                      <Button size="sm" variant="outline" onClick={() => addArrayItem('clinicInfo', 'clinicHours', { day: 'Monday', from: '09:00', to: '17:00' })}>
                        <Plus className="w-4 h-4 mr-1" /> Add Hours
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {profile.clinicInfo.clinicHours?.map((hours, index) => (
                      <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {isEditing ? (
                          <>
                            <select
                              className="flex h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm"
                              value={hours.day}
                              onChange={e => {
                                const newHours = [...profile.clinicInfo.clinicHours];
                                newHours[index] = { ...newHours[index], day: e.target.value };
                                handleChange('clinicInfo', 'clinicHours', newHours);
                              }}
                            >
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                <option key={day} value={day}>
                                  {day}
                                </option>
                              ))}
                            </select>
                            <Input
                              type="time"
                              className="w-32"
                              value={hours.from}
                              onChange={e => {
                                const newHours = [...profile.clinicInfo.clinicHours];
                                newHours[index] = { ...newHours[index], from: e.target.value };
                                handleChange('clinicInfo', 'clinicHours', newHours);
                              }}
                            />
                            <span className="text-gray-500">to</span>
                            <Input
                              type="time"
                              className="w-32"
                              value={hours.to}
                              onChange={e => {
                                const newHours = [...profile.clinicInfo.clinicHours];
                                newHours[index] = { ...newHours[index], to: e.target.value };
                                handleChange('clinicInfo', 'clinicHours', newHours);
                              }}
                            />
                            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeArrayItem('clinicInfo', 'clinicHours', index)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <div className="flex justify-between w-full px-2">
                            <span className="font-medium text-gray-700 w-24">{hours.day}</span>
                            <span className="text-gray-600">
                              {hours.from} - {hours.to}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    {profile.clinicInfo.clinicHours?.length === 0 && (
                      <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg text-center">No clinic hours added.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account */}
          <TabsContent value="account" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b pb-4">
                <CardTitle className="text-xl text-[#2E7D32]">Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Account Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${profile.account.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        <span className={`w-2 h-2 rounded-full ${profile.account.status === 'verified' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        {profile.account.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t space-y-4">
                  <h3 className="font-medium text-red-600 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Danger Zone
                  </h3>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-900">Deactivate Account</p>
                      <p className="text-sm text-red-700">This will hide your profile from patients.</p>
                    </div>
                    <Button variant="destructive" size="sm">
                      Deactivate
                    </Button>
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
    </PractitionerLayout>
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
