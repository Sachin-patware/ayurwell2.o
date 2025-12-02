'use client';

import { useState, useEffect } from 'react';
import PractitionerLayout from '@/components/layouts/PractitionerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Briefcase, MapPin, Settings, Edit2, Save, X, Plus, Trash2, Loader2, Calendar } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'react-toastify';

export default function DoctorProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');

    // Initial empty state matching the structure
    const [profile, setProfile] = useState({
        personalInfo: {
            name: '',
            gender: '',
            age: '', // Changed from dob to age
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
            languages: [] as string[]
        },
        clinicInfo: {
            clinicName: '',
            clinicAddress: '', // Added field
            clinicHours: [] as any[],
            consultationFee: { inClinic: 0, online: 0 },
            location: { type: 'Point', coordinates: [0, 0] }
        },
        account: {
            status: '',
            emailVerified: false,
            createdAt: '',
            profileImage: ''
        }
    });

    // Fetch profile on mount
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/practitioner/profile');
            // Merge with default structure to ensure all fields exist
            setProfile(prev => ({
                ...prev,
                ...response.data,
                personalInfo: {
                    ...prev.personalInfo,
                    ...(response.data.personalInfo || {}),
                    // Ensure age is handled if it comes as number or string
                    age: response.data.personalInfo?.age || ''
                },
                professionalInfo: { ...prev.professionalInfo, ...(response.data.professionalInfo || {}) },
                clinicInfo: { ...prev.clinicInfo, ...(response.data.clinicInfo || {}) },
                account: { ...prev.account, ...(response.data.account || {}) }
            }));
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.put('/practitioner/profile', profile);
            toast.success('Profile updated successfully');
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (section: string, field: string, value: any, nestedField?: string) => {
        setProfile(prev => {
            const sectionData = (prev as any)[section];
            if (nestedField) {
                return {
                    ...prev,
                    [section]: {
                        ...sectionData,
                        [field]: {
                            ...sectionData[field],
                            [nestedField]: value
                        }
                    }
                };
            }
            return {
                ...prev,
                [section]: {
                    ...sectionData,
                    [field]: value
                }
            };
        });
    };

    // Helper to add/remove array items (e.g. languages, clinic hours)
    const addArrayItem = (section: string, field: string, item: any) => {
        setProfile(prev => ({
            ...prev,
            [section]: {
                ...(prev as any)[section],
                [field]: [...(prev as any)[section][field], item]
            }
        }));
    };

    const removeArrayItem = (section: string, field: string, index: number) => {
        setProfile(prev => ({
            ...prev,
            [section]: {
                ...(prev as any)[section],
                [field]: (prev as any)[section][field].filter((_: any, i: number) => i !== index)
            }
        }));
    };

    // Helper to render field based on edit mode
    const RenderField = ({ label, value, onChange, type = "text", icon: Icon, placeholder }: any) => {
        if (!isEditing) {
            return (
                <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">{label}</Label>
                    <div className="flex items-center gap-2 text-gray-900 font-medium p-2 bg-gray-50/50 rounded-md border border-transparent">
                        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
                        <span className="break-words">{value || <span className="text-gray-400 italic">Not provided</span>}</span>
                    </div>
                </div>
            );
        }
        return (
            <div className="space-y-2">
                <Label>{label}</Label>
                <div className="relative">
                    {Icon && (
                        <div className="absolute left-3 top-2.5 text-gray-400">
                            <Icon className="w-4 h-4" />
                        </div>
                    )}
                    <Input
                        type={type}
                        value={value}
                        onChange={onChange}
                        className={Icon ? "pl-9" : ""}
                        placeholder={placeholder}
                    />
                </div>
            </div>
        );
    };

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
                            <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center overflow-hidden shadow-xl">
                                {profile.account.profileImage ? (
                                    <img src={profile.account.profileImage} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-12 w-12 text-white" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{profile.personalInfo.name || 'Doctor Profile'}</h1>
                                <p className="text-green-100 text-lg flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" />
                                    {profile.professionalInfo.specialization || 'General Practitioner'}
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
                                    <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-none" onClick={() => setIsEditing(false)} disabled={saving}>
                                        <X className="mr-2 h-4 w-4" /> Cancel
                                    </Button>
                                    <Button className="bg-white text-[#1B5E20] hover:bg-green-50" onClick={handleSave} disabled={saving}>
                                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save Changes
                                    </Button>
                                </>
                            ) : (
                                <Button className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 hover:border-white/40 backdrop-blur-sm" onClick={() => setIsEditing(true)}>
                                    <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
                                </Button>
                            )}
                        </div>
                    </div>
                    {/* Decorative circles */}
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

                    {/* Personal Info Section */}
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
                                        onChange={(e: any) => handleChange('personalInfo', 'name', e.target.value)}
                                        icon={User}
                                    />
                                    <RenderField
                                        label="Email"
                                        value={profile.personalInfo.email}
                                        icon={Settings} // Using Settings as generic icon or Mail if imported
                                    />
                                    <RenderField
                                        label="Phone"
                                        value={profile.personalInfo.phone}
                                        onChange={(e: any) => handleChange('personalInfo', 'phone', e.target.value)}
                                    />

                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <Label>Gender</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={profile.personalInfo.gender}
                                                onChange={(e) => handleChange('personalInfo', 'gender', e.target.value)}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <RenderField label="Gender" value={profile.personalInfo.gender} />
                                    )}

                                    <RenderField
                                        label="Age"
                                        value={profile.personalInfo.age}
                                        onChange={(e: any) => handleChange('personalInfo', 'age', e.target.value)}
                                        type="number"
                                        placeholder="Years"
                                    />
                                </div>

                                <div className="space-y-4 pt-6 border-t border-dashed">
                                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-[#2E7D32]" /> Address
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <RenderField
                                            label="Line 1"
                                            value={profile.personalInfo.address?.line1}
                                            onChange={(e: any) => handleChange('personalInfo', 'address', e.target.value, 'line1')}
                                        />
                                        <RenderField
                                            label="Line 2"
                                            value={profile.personalInfo.address?.line2}
                                            onChange={(e: any) => handleChange('personalInfo', 'address', e.target.value, 'line2')}
                                        />
                                        <RenderField
                                            label="City"
                                            value={profile.personalInfo.address?.city}
                                            onChange={(e: any) => handleChange('personalInfo', 'address', e.target.value, 'city')}
                                        />
                                        <RenderField
                                            label="State"
                                            value={profile.personalInfo.address?.state}
                                            onChange={(e: any) => handleChange('personalInfo', 'address', e.target.value, 'state')}
                                        />
                                        <RenderField
                                            label="Pincode"
                                            value={profile.personalInfo.address?.pincode}
                                            onChange={(e: any) => handleChange('personalInfo', 'address', e.target.value, 'pincode')}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Professional Info Section */}
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
                                        onChange={(e: any) => handleChange('professionalInfo', 'specialization', e.target.value)}
                                        icon={Briefcase}
                                    />
                                    <RenderField
                                        label="Qualification"
                                        value={profile.professionalInfo.qualification}
                                        onChange={(e: any) => handleChange('professionalInfo', 'qualification', e.target.value)}
                                    />
                                    <RenderField
                                        label="Experience (Years)"
                                        value={profile.professionalInfo.experienceYears}
                                        onChange={(e: any) => handleChange('professionalInfo', 'experienceYears', parseInt(e.target.value))}
                                        type="number"
                                    />
                                    <RenderField
                                        label="Registration Number"
                                        value={profile.professionalInfo.registrationNumber}
                                        onChange={(e: any) => handleChange('professionalInfo', 'registrationNumber', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Bio</Label>
                                    {isEditing ? (
                                        <textarea
                                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={profile.professionalInfo.bio}
                                            onChange={(e) => handleChange('professionalInfo', 'bio', e.target.value)}
                                            placeholder="Tell us about your professional background..."
                                        />
                                    ) : (
                                        <div className="p-4 bg-gray-50/50 rounded-lg border border-transparent text-gray-700 leading-relaxed">
                                            {profile.professionalInfo.bio || <span className="text-gray-400 italic">No bio provided</span>}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Languages</Label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {profile.professionalInfo.languages?.map((lang, index) => (
                                            <span key={index} className="bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full text-sm flex items-center gap-1 font-medium">
                                                {lang}
                                                {isEditing && (
                                                    <button onClick={() => removeArrayItem('professionalInfo', 'languages', index)} className="ml-1 text-green-400 hover:text-red-500 transition-colors">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </span>
                                        ))}
                                        {(!profile.professionalInfo.languages?.length && !isEditing) && (
                                            <span className="text-gray-400 italic text-sm">No languages listed</span>
                                        )}
                                    </div>
                                    {isEditing && (
                                        <div className="flex gap-2 max-w-xs">
                                            <Input
                                                placeholder="Add language..."
                                                id="new-lang"
                                                className="h-9"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const val = e.currentTarget.value.trim();
                                                        if (val) {
                                                            addArrayItem('professionalInfo', 'languages', val);
                                                            e.currentTarget.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const input = document.getElementById('new-lang') as HTMLInputElement;
                                                    if (input.value.trim()) {
                                                        addArrayItem('professionalInfo', 'languages', input.value.trim());
                                                        input.value = '';
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

                    {/* Clinic Info Section */}
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
                                        onChange={(e: any) => handleChange('clinicInfo', 'clinicName', e.target.value)}
                                        icon={MapPin}
                                    />

                                    <div className="space-y-4">
                                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Consultation Fees (₹)</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <RenderField
                                                label="In-Clinic"
                                                value={profile.clinicInfo.consultationFee?.inClinic}
                                                onChange={(e: any) => handleChange('clinicInfo', 'consultationFee', parseInt(e.target.value), 'inClinic')}
                                                type="number"
                                            />
                                            <RenderField
                                                label="Online"
                                                value={profile.clinicInfo.consultationFee?.online}
                                                onChange={(e: any) => handleChange('clinicInfo', 'consultationFee', parseInt(e.target.value), 'online')}
                                                type="number"
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
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={profile.clinicInfo.clinicAddress || ''}
                                                onChange={(e) => handleChange('clinicInfo', 'clinicAddress', e.target.value)}
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
                                                            onChange={(e) => {
                                                                const newHours = [...profile.clinicInfo.clinicHours];
                                                                newHours[index].day = e.target.value;
                                                                handleChange('clinicInfo', 'clinicHours', newHours);
                                                            }}
                                                        >
                                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                                                <option key={day} value={day}>{day}</option>
                                                            ))}
                                                        </select>
                                                        <Input
                                                            type="time"
                                                            className="w-32"
                                                            value={hours.from}
                                                            onChange={(e) => {
                                                                const newHours = [...profile.clinicInfo.clinicHours];
                                                                newHours[index].from = e.target.value;
                                                                handleChange('clinicInfo', 'clinicHours', newHours);
                                                            }}
                                                        />
                                                        <span className="text-gray-500">to</span>
                                                        <Input
                                                            type="time"
                                                            className="w-32"
                                                            value={hours.to}
                                                            onChange={(e) => {
                                                                const newHours = [...profile.clinicInfo.clinicHours];
                                                                newHours[index].to = e.target.value;
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
                                                        <span className="text-gray-600">{hours.from} - {hours.to}</span>
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

                    {/* Account Section */}
                    <TabsContent value="account" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <Card className="border-none shadow-md overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b pb-4">
                                <CardTitle className="text-xl text-[#2E7D32]">Account Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-8">
                                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-gray-50 to-white border rounded-xl">
                                    <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                                        {profile.account.profileImage ? (
                                            <img src={profile.account.profileImage} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-10 w-10 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-lg">Profile Picture</h3>
                                        <p className="text-sm text-gray-500 mb-3">Upload a professional photo to build trust with patients.</p>
                                        {isEditing && (
                                            <Button size="sm" variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">Upload New Photo</Button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Account Status</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${profile.account.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full ${profile.account.status === 'verified' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                                {profile.account.status || 'Pending'}
                                            </span>
                                            {profile.account.emailVerified && (
                                                <span className="text-sm text-blue-600 flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    Email Verified
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Member Since</Label>
                                        <p className="text-gray-900 font-medium text-lg">
                                            {profile.account.createdAt ? new Date(profile.account.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                        </p>
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
                                        <Button variant="destructive" size="sm">Deactivate</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </PractitionerLayout>
    );
}
