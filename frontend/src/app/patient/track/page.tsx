'use client';

import { useState, useEffect } from 'react';
import PatientLayout from '@/components/layouts/PatientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, Save, Loader2, Droplet, TrendingUp, History, Edit2, Trash2, ChevronLeft, ChevronRight, Activity, Heart, Zap } from 'lucide-react';
import { format, subDays, addDays, startOfWeek, endOfWeek } from 'date-fns';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';

interface ProgressEntry {
    id: string;
    date: string;
    waterIntake: number;
    bowelMovement: string;
    symptoms: string;
    mealAdherence: number;
    weight?: number;
    notes: string;
}

export default function TrackingPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('log');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [waterIntake, setWaterIntake] = useState(0);
    const [bowelMovement, setBowelMovement] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [mealAdherence, setMealAdherence] = useState(100);
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [history, setHistory] = useState<ProgressEntry[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchHistory();
    }, [user]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const userId = user?.uid;
            if (!userId) return;
            const response = await api.get(`/progress/${userId}`);
            setHistory(response.data || []);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const weeklyStats = () => {
        const weekStart = startOfWeek(new Date());
        const weekEnd = endOfWeek(new Date());
        const weekEntries = history.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= weekStart && entryDate <= weekEnd;
        });
        const avgWater = weekEntries.length > 0 ? Math.round(weekEntries.reduce((sum, e) => sum + e.waterIntake, 0) / weekEntries.length) : 0;
        const avgAdherence = weekEntries.length > 0 ? Math.round(weekEntries.reduce((sum, e) => sum + e.mealAdherence, 0) / weekEntries.length) : 0;
        const weights = weekEntries.filter(e => e.weight).map(e => e.weight!);
        const weightChange = weights.length >= 2 ? (weights[weights.length - 1] - weights[0]).toFixed(1) : null;
        return { avgWater, avgAdherence, weightChange, loggedDays: weekEntries.length };
    };

    const stats = weeklyStats();

    const handleSave = async () => {
        setSaving(true);
        setSuccess(false);
        try {
            const userId = user?.uid;
            if (!userId) {
                toast.error('User not authenticated');
                return;
            }
            await api.post('/progress', {
                patientId: userId,
                date: format(selectedDate, 'yyyy-MM-dd'),
                waterIntake,
                bowelMovement,
                symptoms,
                mealAdherence,
                weight: weight ? parseFloat(weight) : null,
                notes
            });
            setSuccess(true);
            await fetchHistory();
            setWaterIntake(0);
            setBowelMovement('');
            setSymptoms('');
            setMealAdherence(100);
            setWeight('');
            setNotes('');
            setEditingId(null);
            setTimeout(() => setSuccess(false), 3000);
            toast.success('saved progress');
        } catch (err) {
            console.error('Error saving progress:', err);
            toast.error('Failed to save progress');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (entry: ProgressEntry) => {
        setSelectedDate(new Date(entry.date));
        setWaterIntake(entry.waterIntake);
        setBowelMovement(entry.bowelMovement);
        setSymptoms(entry.symptoms);
        setMealAdherence(entry.mealAdherence);
        setWeight(entry.weight?.toString() || '');
        setNotes(entry.notes);
        setEditingId(entry.id);
        setActiveTab('log');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        try {
            await api.delete(`/progress/${id}`);
            await fetchHistory();
        } catch (err) {
            console.error('Error deleting entry:', err);
            toast.error('Failed to delete entry');
        }
    };

    return (
        <PatientLayout>
            <div className="space-y-6">
                {/* Header with Gradient */}
                <div className="bg-gradient-to-r from-[#F1F8F4] to-[#E8F5E9] rounded-2xl p-6 border-2 border-[#2E7D32]/20 shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold flex items-center gap-2 text-[#2E7D32]">
                                <Activity className="h-8 w-8" />
                                Track Your Progress
                            </h2>
                            <p className="mt-2 text-gray-600">Monitor your daily health metrics and wellness journey</p>
                        </div>
                        <div className="hidden md:flex items-center gap-4">
                            <div className="bg-white border-2 border-[#2E7D32]/30 rounded-lg px-4 py-2">
                                <p className="text-xs text-gray-600">Streak</p>
                                <p className="text-2xl font-bold text-[#2E7D32]">{stats.loggedDays} 🔥</p>
                            </div>
                        </div>
                    </div>
                </div>

                {success && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 shadow-sm">
                        <p className="text-green-700 font-semibold flex items-center gap-2">
                            <span className="text-2xl">✓</span> Progress saved successfully!
                        </p>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-100 to-gray-50 p-1 rounded-xl">
                        <TabsTrigger value="log" className="data-[state=active]:bg-[#2E7D32] data-[state=active]:text-white rounded-lg">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Log Today
                        </TabsTrigger>
                        <TabsTrigger value="history" className="data-[state=active]:bg-[#1976D2] data-[state=active]:text-white rounded-lg">
                            <History className="h-4 w-4 mr-2" />
                            History
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="data-[state=active]:bg-[#7B1FA2] data-[state=active]:text-white rounded-lg">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Stats
                        </TabsTrigger>
                    </TabsList>

                    {/* LOG TAB */}
                    <TabsContent value="log" className="space-y-6">
                        {/* Date Picker with Gradient */}
                        <Card className="border-2 border-[#2E7D32]/30 shadow-md">
                            <CardContent className="p-4 bg-gradient-to-r from-[#F1F8F4] to-[#E8F5E9]">
                                <div className="flex items-center justify-between">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                                        className="hover:bg-emerald-100 border-emerald-300"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    <div className="flex items-center space-x-3">
                                        <div className="bg-[#2E7D32] p-2 rounded-lg">
                                            <CalendarIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-lg text-gray-900">
                                                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                                            </p>
                                            <p className="text-xs font-semibold text-[#2E7D32]">
                                                {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                                    ? '✨ Today'
                                                    : format(selectedDate, 'yyyy-MM-dd') === format(subDays(new Date(), 1), 'yyyy-MM-dd')
                                                        ? '📅 Yesterday'
                                                        : ''}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedDate(new Date())}
                                            disabled={format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
                                            className="hover:bg-emerald-100 border-emerald-300 font-semibold"
                                        >
                                            Today
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                                            disabled={format(selectedDate, 'yyyy-MM-dd') >= format(new Date(), 'yyyy-MM-dd')}
                                            className="hover:bg-emerald-100 border-emerald-300"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                {editingId && (
                                    <div className="mt-3 pt-3 border-t border-emerald-200">
                                        <span className="text-sm text-orange-600 font-semibold flex items-center gap-2">
                                            <Edit2 className="h-4 w-4" />
                                            Editing existing entry for this date
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Water Intake - Blue */}
                            <Card className="border-2 border-blue-200 shadow-sm hover:shadow-md transition-all">
                                <CardHeader className="bg-gradient-to-r from-[#E3F2FD] to-[#BBDEFB] pb-3">
                                    <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
                                        <div className="bg-[#1976D2] p-2 rounded-lg">
                                            <Droplet className="h-5 w-5 text-white" />
                                        </div>
                                        Water Intake
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-5 space-y-4">
                                    <div className="space-y-3">
                                        <Input
                                            type="number"
                                            placeholder="Enter ml (e.g., 2000)"
                                            value={waterIntake || ''}
                                            onChange={(e) => setWaterIntake(parseInt(e.target.value) || 0)}
                                            className="text-lg border-2 border-blue-200 focus:border-blue-400 h-11"
                                        />
                                        <div className="flex gap-2 flex-wrap">
                                            {[250, 500, 750, 1000].map((amt) => (
                                                <Button
                                                    key={amt}
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setWaterIntake(waterIntake + amt)}
                                                    className="flex-1 min-w-[70px] bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700 font-semibold"
                                                >
                                                    +{amt}ml
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-[#1976D2] text-white p-4 rounded-xl text-center">
                                        <p className="text-xs uppercase tracking-wide opacity-90 mb-1">Total Intake</p>
                                        <p className="text-3xl font-bold">{waterIntake} <span className="text-lg">ml</span></p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Bowel Movement - Green */}
                            <Card className="border-2 border-green-200 shadow-sm hover:shadow-md transition-all">
                                <CardHeader className="bg-gradient-to-r from-[#E8F5E9] to-[#C8E6C9] pb-3">
                                    <CardTitle className="flex items-center gap-2 text-green-900 text-lg">
                                        <div className="bg-[#388E3C] p-2 rounded-lg">
                                            <Heart className="h-5 w-5 text-white" />
                                        </div>
                                        Bowel Movement
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-5">
                                    <Select value={bowelMovement} onValueChange={setBowelMovement}>
                                        <SelectTrigger className="border-2 border-green-200 focus:border-green-400 h-11 text-base">
                                            <SelectValue placeholder="Select status..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="normal" className="text-base">✅ Normal</SelectItem>
                                            <SelectItem value="constipated" className="text-base">🟡 Constipated</SelectItem>
                                            <SelectItem value="loose" className="text-base">🟠 Loose</SelectItem>
                                            <SelectItem value="diarrhea" className="text-base">🔴 Diarrhea</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>

                            {/* Meal Adherence - Purple */}
                            <Card className="border-2 border-purple-200 shadow-sm hover:shadow-md transition-all">
                                <CardHeader className="bg-gradient-to-r from-[#F3E5F5] to-[#E1BEE7] pb-3">
                                    <CardTitle className="flex items-center gap-2 text-purple-900 text-lg">
                                        <div className="bg-[#7B1FA2] p-2 rounded-lg">
                                            <Zap className="h-5 w-5 text-white" />
                                        </div>
                                        Meal Adherence
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-5 space-y-4">
                                    <div className="space-y-3">
                                        <Input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={mealAdherence}
                                            onChange={(e) => setMealAdherence(parseInt(e.target.value))}
                                            className="w-full h-2 accent-purple-600"
                                        />
                                        <div className="bg-[#7B1FA2] text-white p-4 rounded-xl text-center">
                                            <p className="text-xs uppercase tracking-wide opacity-90 mb-1">Adherence Level</p>
                                            <p className="text-4xl font-bold">{mealAdherence}%</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Weight - Orange */}
                            <Card className="border-2 border-orange-200 shadow-sm hover:shadow-md transition-all">
                                <CardHeader className="bg-gradient-to-r from-[#FFF3E0] to-[#FFE0B2] pb-3">
                                    <CardTitle className="text-orange-800 text-lg">Weight (Optional)</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-5">
                                    <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="Enter weight in kg"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        className="border-2 border-orange-200 focus:border-orange-400 h-11 text-lg"
                                    />
                                </CardContent>
                            </Card>

                            {/* Symptoms & Notes - Full Width */}
                            <Card className="md:col-span-2 border-2 border-indigo-200 shadow-md">
                                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                                    <CardTitle className="text-indigo-700">Symptoms & Notes</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Symptoms (if any)
                                        </label>
                                        <Input
                                            placeholder="e.g., acidity, headache, fatigue"
                                            value={symptoms}
                                            onChange={(e) => setSymptoms(e.target.value)}
                                            className="border-2 border-indigo-200 focus:border-indigo-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Additional Notes
                                        </label>
                                        <textarea
                                            className="w-full min-h-[100px] px-3 py-2 border-2 border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                            placeholder="Any other observations or feelings..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-end gap-3">
                            {editingId && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setEditingId(null);
                                        setWaterIntake(0);
                                        setBowelMovement('');
                                        setSymptoms('');
                                        setMealAdherence(100);
                                        setWeight('');
                                        setNotes('');
                                    }}
                                    className="border-2 border-gray-300"
                                >
                                    Cancel Edit
                                </Button>
                            )}
                            <Button
                                onClick={handleSave}
                                className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white h-12 px-8 text-lg font-semibold shadow-lg"
                                disabled={saving || !bowelMovement}
                            >
                                {saving ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="mr-2 h-5 w-5" /> {editingId ? 'Update Entry' : 'Save Daily Log'}</>
                                )}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* HISTORY TAB */}
                    <TabsContent value="history" className="space-y-4">
                        {loadingHistory ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                        ) : history.length === 0 ? (
                            <Card className="border-2 border-blue-200">
                                <CardContent className="py-12 text-center">
                                    <div className="text-6xl mb-4">📊</div>
                                    <p className="text-gray-500 text-lg">No progress entries yet.</p>
                                    <p className="text-gray-400 mt-2">Start logging your daily metrics!</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {history.slice(0, 14).map((entry, index) => (
                                    <Card key={entry.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-[#2E7D32] overflow-hidden">
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 space-y-4">
                                                    {/* Header */}
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <h3 className="font-bold text-lg text-gray-900">
                                                            {format(new Date(entry.date), 'EEEE, MMM d, yyyy')}
                                                        </h3>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${entry.bowelMovement === 'normal' ? 'bg-green-100 text-green-700 border border-green-300' :
                                                                entry.bowelMovement === 'constipated' ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                                                                    'bg-red-100 text-red-700 border border-red-300'
                                                            }`}>
                                                            {entry.bowelMovement === 'normal' ? '✅ Normal' :
                                                                entry.bowelMovement === 'constipated' ? '🟡 Constipated' :
                                                                    entry.bowelMovement === 'loose' ? '🟠 Loose' : '🔴 Diarrhea'}
                                                        </span>
                                                    </div>

                                                    {/* Metrics Grid */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Droplet className="h-4 w-4 text-blue-600" />
                                                                <span className="text-xs font-semibold text-blue-600 uppercase">Water</span>
                                                            </div>
                                                            <p className="text-lg font-bold text-blue-700">{entry.waterIntake} ml</p>
                                                        </div>
                                                        <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Zap className="h-4 w-4 text-purple-600" />
                                                                <span className="text-xs font-semibold text-purple-600 uppercase">Adherence</span>
                                                            </div>
                                                            <p className="text-lg font-bold text-purple-700">{entry.mealAdherence}%</p>
                                                        </div>
                                                        {entry.weight && (
                                                            <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Activity className="h-4 w-4 text-orange-600" />
                                                                    <span className="text-xs font-semibold text-orange-600 uppercase">Weight</span>
                                                                </div>
                                                                <p className="text-lg font-bold text-orange-700">{entry.weight} kg</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Symptoms */}
                                                    {entry.symptoms && (
                                                        <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                                                            <p className="text-xs font-semibold text-red-600 uppercase mb-1">🩺 Symptoms</p>
                                                            <p className="text-sm text-red-700">{entry.symptoms}</p>
                                                        </div>
                                                    )}

                                                    {/* Notes */}
                                                    {entry.notes && (
                                                        <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                                                            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">📝 Notes</p>
                                                            <p className="text-sm text-gray-700 italic">"{entry.notes}"</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex flex-col gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(entry)}
                                                        className="hover:bg-blue-100 text-blue-600 h-9 w-9 p-0"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(entry.id)}
                                                        className="hover:bg-red-100 text-red-600 h-9 w-9 p-0"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* STATS TAB */}
                    <TabsContent value="stats" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader className="pb-3 bg-gradient-to-br from-emerald-50 to-teal-50">
                                    <CardTitle className="text-sm font-semibold text-emerald-600">🔥 Logged Days</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{stats.loggedDays}</p>
                                    <p className="text-xs text-gray-500 mt-1">This week</p>
                                </CardContent>
                            </Card>

                            <Card className="border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader className="pb-3 bg-gradient-to-br from-blue-50 to-cyan-50">
                                    <CardTitle className="text-sm font-semibold text-blue-600">💧 Avg Water</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{stats.avgWater}</p>
                                    <p className="text-xs text-gray-500 mt-1">ml per day</p>
                                </CardContent>
                            </Card>

                            <Card className="border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader className="pb-3 bg-gradient-to-br from-purple-50 to-pink-50">
                                    <CardTitle className="text-sm font-semibold text-purple-600">⚡ Avg Adherence</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stats.avgAdherence}%</p>
                                    <p className="text-xs text-gray-500 mt-1">Weekly average</p>
                                </CardContent>
                            </Card>

                            <Card className="border-2 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader className="pb-3 bg-gradient-to-br from-orange-50 to-amber-50">
                                    <CardTitle className="text-sm font-semibold text-orange-600">⚖️ Weight Change</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className={`text-4xl font-bold ${stats.weightChange === null ? 'text-gray-400' :
                                        parseFloat(stats.weightChange) > 0 ? 'bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent' :
                                            parseFloat(stats.weightChange) < 0 ? 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent' :
                                                'text-gray-600'
                                        }`}>
                                        {stats.weightChange === null ? 'N/A' :
                                            parseFloat(stats.weightChange) > 0 ? `+${stats.weightChange}` : stats.weightChange}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">kg this week</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-2 border-indigo-200 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                                <CardTitle className="text-indigo-700">📊 Weekly Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <p className="text-gray-700 text-lg">
                                    You've logged <span className="font-bold text-emerald-600 text-xl">{stats.loggedDays} days</span> this week.
                                    {stats.loggedDays < 7 && (
                                        <span className="text-orange-600 font-semibold"> Keep it up! Try to log every day for better insights. 💪</span>
                                    )}
                                    {stats.loggedDays === 7 && (
                                        <span className="text-green-600 font-semibold"> Excellent! You've logged every day this week! 🎉✨</span>
                                    )}
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div >
        </PatientLayout >
    );
}
