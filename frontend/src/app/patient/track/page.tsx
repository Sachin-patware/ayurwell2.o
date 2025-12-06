'use client';

import { useState, useEffect } from 'react';
import PatientLayout from '@/components/layouts/PatientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, Save, Loader2, Droplet, TrendingUp, History, Edit2, Trash2, ChevronLeft, ChevronRight, Activity, Heart, Zap, Moon, Smile } from 'lucide-react';
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
    sleepHours?: number;
    mood?: string;
    notes: string;
}

export default function TrackingPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('log');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [waterIntake, setWaterIntake] = useState(0);
    const [bowelMovement, setBowelMovement] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [mealAdherence, setMealAdherence] = useState(50); // Default to 50%
    const [weight, setWeight] = useState('');
    const [sleepHours, setSleepHours] = useState('');
    const [mood, setMood] = useState('');
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

    const getAdherenceLabel = (value: number) => {
        if (value <= 30) return { text: "Needs Improvement", color: "text-red-600", emoji: "😟" };
        if (value <= 70) return { text: "Moderate", color: "text-orange-600", emoji: "😐" };
        return { text: "Excellent", color: "text-green-600", emoji: "🌟" };
    };

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
                sleepHours: sleepHours ? parseFloat(sleepHours) : null,
                mood,
                notes
            });
            setSuccess(true);
            await fetchHistory();
            resetForm();
            setTimeout(() => setSuccess(false), 3000);
            toast.success('Progress saved successfully');
        } catch (err) {
            console.error('Error saving progress:', err);
            toast.error('Failed to save progress');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setWaterIntake(0);
        setBowelMovement('');
        setSymptoms('');
        setMealAdherence(50);
        setWeight('');
        setSleepHours('');
        setMood('');
        setNotes('');
        setEditingId(null);
    };

    const handleEdit = (entry: ProgressEntry) => {
        setSelectedDate(new Date(entry.date));
        setWaterIntake(entry.waterIntake);
        setBowelMovement(entry.bowelMovement);
        setSymptoms(entry.symptoms);
        setMealAdherence(entry.mealAdherence);
        setWeight(entry.weight?.toString() || '');
        setSleepHours(entry.sleepHours?.toString() || '');
        setMood(entry.mood || '');
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

    const adherenceInfo = getAdherenceLabel(mealAdherence);

    return (
        <PatientLayout>
            <div className="space-y-8 pb-10">
                {/* Header with Gradient */}
                <div className="bg-gradient-to-r from-[#F1F8F4] to-[#E8F5E9] rounded-2xl p-8 border border-[#2E7D32]/10 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold flex items-center gap-3 text-[#2E7D32]">
                                <Activity className="h-8 w-8" />
                                Track Your Progress
                            </h2>
                            <p className="mt-2 text-gray-600 text-lg">Monitor your daily health metrics and wellness journey</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-white/80 backdrop-blur-sm border border-[#2E7D32]/20 rounded-xl px-5 py-3 shadow-sm">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Streak</p>
                                <p className="text-3xl font-bold text-[#2E7D32]">{stats.loggedDays} <span className="text-xl">Days</span> 🔥</p>
                            </div>
                        </div>
                    </div>
                </div>

                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <p className="text-green-800 font-semibold flex items-center gap-2">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-green-200 text-green-800 text-sm">✓</span>
                            Progress saved successfully!
                        </p>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 p-1.5 rounded-xl h-auto">
                        <TabsTrigger value="log" className="data-[state=active]:bg-white data-[state=active]:text-[#2E7D32] data-[state=active]:shadow-sm rounded-lg py-3 font-medium transition-all">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Log Today
                        </TabsTrigger>
                        <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:text-[#1976D2] data-[state=active]:shadow-sm rounded-lg py-3 font-medium transition-all">
                            <History className="h-4 w-4 mr-2" />
                            History
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="data-[state=active]:bg-white data-[state=active]:text-[#7B1FA2] data-[state=active]:shadow-sm rounded-lg py-3 font-medium transition-all">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Stats
                        </TabsTrigger>
                    </TabsList>

                    {/* LOG TAB */}
                    <TabsContent value="log" className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        {/* Date Picker */}
                        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                                            className="hover:bg-green-50 hover:text-green-700 border-gray-200"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>

                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-100 p-2.5 rounded-xl text-green-700">
                                                <CalendarIcon className="h-5 w-5" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-lg text-gray-900">
                                                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                                                </p>
                                                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                                                    {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                                        ? '✨ Today'
                                                        : format(selectedDate, 'yyyy-MM-dd') === format(subDays(new Date(), 1), 'yyyy-MM-dd')
                                                            ? '📅 Yesterday'
                                                            : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                                            disabled={format(selectedDate, 'yyyy-MM-dd') >= format(new Date(), 'yyyy-MM-dd')}
                                            className="hover:bg-green-50 hover:text-green-700 border-gray-200"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedDate(new Date())}
                                        disabled={format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
                                        className="text-green-700 hover:bg-green-50 hover:text-green-800 font-medium"
                                    >
                                        Jump to Today
                                    </Button>
                                </div>
                                {editingId && (
                                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-sm font-medium border border-orange-200">
                                            <Edit2 className="h-3 w-3" />
                                            Editing existing entry
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Water Intake */}
                            <Card className="border border-blue-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 group">
                                <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
                                    <CardTitle className="flex items-center gap-3 text-blue-900 text-lg group-hover:text-blue-700 transition-colors">
                                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                            <Droplet className="h-5 w-5" />
                                        </div>
                                        Water Intake
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={waterIntake || ''}
                                            onChange={(e) => setWaterIntake(parseInt(e.target.value) || 0)}
                                            className="text-3xl font-bold text-center h-16 border-blue-200 focus:border-blue-400 focus:ring-blue-100"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">ml</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[250, 500, 750, 1000].map((amt) => (
                                            <Button
                                                key={amt}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setWaterIntake(waterIntake + amt)}
                                                className="bg-blue-50/50 hover:bg-blue-100 border-blue-200 text-blue-700 font-medium h-10"
                                            >
                                                +{amt}
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Bowel Movement */}
                            <Card className="border border-green-100 shadow-sm hover:shadow-lg hover:border-green-200 transition-all duration-300 group">
                                <CardHeader className="bg-green-50/50 border-b border-green-100 pb-4">
                                    <CardTitle className="flex items-center gap-3 text-green-900 text-lg group-hover:text-green-700 transition-colors">
                                        <div className="bg-green-100 p-2 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                                            <Activity className="h-5 w-5" />
                                        </div>
                                        Bowel Movement
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <Select value={bowelMovement} onValueChange={setBowelMovement}>
                                        <SelectTrigger className="h-14 text-lg border-green-200 focus:border-green-400 focus:ring-green-100">
                                            <SelectValue placeholder="Select status..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="normal" className="text-base py-3">✅ Normal</SelectItem>
                                            <SelectItem value="constipated" className="text-base py-3">🟡 Constipated</SelectItem>
                                            <SelectItem value="loose" className="text-base py-3">🟠 Loose</SelectItem>
                                            <SelectItem value="diarrhea" className="text-base py-3">🔴 Diarrhea</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-gray-500 mt-4 px-1">
                                        Regularity is key to digestive health in Ayurveda.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Meal Adherence */}
                            <Card className="border border-purple-100 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-300 group md:col-span-2">
                                <CardHeader className="bg-purple-50/50 border-b border-purple-100 pb-4">
                                    <CardTitle className="flex items-center gap-3 text-purple-900 text-lg group-hover:text-purple-700 transition-colors">
                                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                                            <Zap className="h-5 w-5" />
                                        </div>
                                        Diet Plan Adherence
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-8 pb-6 px-8">
                                    <div className="space-y-8">
                                        <div className="relative pt-2">
                                            <Input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="5"
                                                value={mealAdherence}
                                                onChange={(e) => setMealAdherence(parseInt(e.target.value))}
                                                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                            />
                                            <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium uppercase tracking-wider">
                                                <span>0%</span>
                                                <span>50%</span>
                                                <span>100%</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-center gap-4">
                                            <div className={`text-5xl font-bold ${adherenceInfo.color} transition-colors duration-300`}>
                                                {mealAdherence}%
                                            </div>
                                            <div className={`px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-lg font-medium ${adherenceInfo.color} flex items-center gap-2`}>
                                                <span>{adherenceInfo.emoji}</span>
                                                {adherenceInfo.text}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Sleep & Mood (New) */}
                            <Card className="border border-indigo-100 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group">
                                <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 pb-4">
                                    <CardTitle className="flex items-center gap-3 text-indigo-900 text-lg group-hover:text-indigo-700 transition-colors">
                                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                            <Moon className="h-5 w-5" />
                                        </div>
                                        Sleep & Mood
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Sleep Duration</label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.5"
                                                placeholder="e.g. 7.5"
                                                value={sleepHours}
                                                onChange={(e) => setSleepHours(e.target.value)}
                                                className="pl-10 h-11 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-100"
                                            />
                                            <Moon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">hours</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Mood</label>
                                        <Select value={mood} onValueChange={setMood}>
                                            <SelectTrigger className="h-11 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-100">
                                                <SelectValue placeholder="How do you feel?" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Happy">😊 Happy</SelectItem>
                                                <SelectItem value="Calm">😌 Calm</SelectItem>
                                                <SelectItem value="Energetic">⚡ Energetic</SelectItem>
                                                <SelectItem value="Tired">😴 Tired</SelectItem>
                                                <SelectItem value="Stressed">😫 Stressed</SelectItem>
                                                <SelectItem value="Anxious">😰 Anxious</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Weight */}
                            <Card className="border border-orange-100 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all duration-300 group">
                                <CardHeader className="bg-orange-50/50 border-b border-orange-100 pb-4">
                                    <CardTitle className="flex items-center gap-3 text-orange-900 text-lg group-hover:text-orange-700 transition-colors">
                                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                                            <Activity className="h-5 w-5" />
                                        </div>
                                        Weight (Optional)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="0.1"
                                            placeholder="0.0"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            className="text-3xl font-bold text-center h-16 border-orange-200 focus:border-orange-400 focus:ring-orange-100"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">kg</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-4 text-center">
                                        Track weekly for best results.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Symptoms & Notes */}
                            <Card className="md:col-span-2 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
                                <CardHeader className="bg-gray-50/50 border-b border-gray-200 pb-4">
                                    <CardTitle className="text-gray-700 flex items-center gap-2">
                                        <Edit2 className="h-5 w-5" />
                                        Daily Journal
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Symptoms (if any)</label>
                                        <Input
                                            placeholder="e.g., acidity, headache, bloating..."
                                            value={symptoms}
                                            onChange={(e) => setSymptoms(e.target.value)}
                                            className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-100"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Additional Notes</label>
                                        <textarea
                                            className="w-full min-h-[120px] px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 resize-none"
                                            placeholder="How did you feel today? Any specific cravings or observations?"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                            {editingId && (
                                <Button
                                    variant="outline"
                                    onClick={resetForm}
                                    className="h-12 px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel Edit
                                </Button>
                            )}
                            <Button
                                onClick={handleSave}
                                className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white h-12 px-8 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
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
                    <TabsContent value="history" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        {loadingHistory ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="h-10 w-10 animate-spin text-[#2E7D32]" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                <div className="bg-white p-4 rounded-full inline-block mb-4 shadow-sm">
                                    <Activity className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">No entries yet</h3>
                                <p className="text-gray-500 mt-1">Start logging your daily progress to see your history.</p>
                                <Button
                                    variant="link"
                                    onClick={() => setActiveTab('log')}
                                    className="mt-4 text-[#2E7D32] font-semibold"
                                >
                                    Log your first entry &rarr;
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {history.slice(0, 14).map((entry) => (
                                    <Card key={entry.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#2E7D32] overflow-hidden group">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                                                <div className="flex-1 space-y-6">
                                                    {/* Header */}
                                                    <div className="flex flex-wrap items-center gap-4">
                                                        <h3 className="font-bold text-xl text-gray-900">
                                                            {format(new Date(entry.date), 'EEEE, MMM d, yyyy')}
                                                        </h3>
                                                        <div className="flex gap-2">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${entry.bowelMovement === 'normal' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                    entry.bowelMovement === 'constipated' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                        'bg-red-50 text-red-700 border-red-200'
                                                                }`}>
                                                                {entry.bowelMovement === 'normal' ? '✅ Normal' :
                                                                    entry.bowelMovement === 'constipated' ? '🟡 Constipated' :
                                                                        entry.bowelMovement === 'loose' ? '🟠 Loose' : '🔴 Diarrhea'}
                                                            </span>
                                                            {entry.mood && (
                                                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                                    Mood: {entry.mood}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Metrics Grid */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Droplet className="h-4 w-4 text-blue-600" />
                                                                <span className="text-xs font-bold text-blue-600 uppercase">Water</span>
                                                            </div>
                                                            <p className="text-xl font-bold text-blue-900">{entry.waterIntake} ml</p>
                                                        </div>
                                                        <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-xl">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Zap className="h-4 w-4 text-purple-600" />
                                                                <span className="text-xs font-bold text-purple-600 uppercase">Adherence</span>
                                                            </div>
                                                            <p className="text-xl font-bold text-purple-900">{entry.mealAdherence}%</p>
                                                        </div>
                                                        {entry.sleepHours && (
                                                            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Moon className="h-4 w-4 text-indigo-600" />
                                                                    <span className="text-xs font-bold text-indigo-600 uppercase">Sleep</span>
                                                                </div>
                                                                <p className="text-xl font-bold text-indigo-900">{entry.sleepHours} hrs</p>
                                                            </div>
                                                        )}
                                                        {entry.weight && (
                                                            <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Activity className="h-4 w-4 text-orange-600" />
                                                                    <span className="text-xs font-bold text-orange-600 uppercase">Weight</span>
                                                                </div>
                                                                <p className="text-xl font-bold text-orange-900">{entry.weight} kg</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Notes Section */}
                                                    {(entry.symptoms || entry.notes) && (
                                                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                                                            {entry.symptoms && (
                                                                <div className="flex gap-2 text-sm">
                                                                    <span className="font-semibold text-red-600 min-w-[80px]">Symptoms:</span>
                                                                    <span className="text-gray-700">{entry.symptoms}</span>
                                                                </div>
                                                            )}
                                                            {entry.notes && (
                                                                <div className="flex gap-2 text-sm">
                                                                    <span className="font-semibold text-gray-600 min-w-[80px]">Notes:</span>
                                                                    <span className="text-gray-700 italic">"{entry.notes}"</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex lg:flex-col gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(entry)}
                                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                    >
                                                        <Edit2 className="h-4 w-4 mr-2" /> Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(entry.id)}
                                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
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
                    <TabsContent value="stats" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="border border-emerald-100 shadow-sm hover:shadow-lg transition-all duration-300">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-emerald-600 uppercase tracking-wide">Logged Days</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-gray-900">{stats.loggedDays}</span>
                                        <span className="text-sm text-gray-500">/ 7 days</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
                                        <div
                                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${(stats.loggedDays / 7) * 100}%` }}
                                        ></div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border border-blue-100 shadow-sm hover:shadow-lg transition-all duration-300">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-blue-600 uppercase tracking-wide">Avg Water</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-gray-900">{stats.avgWater}</span>
                                        <span className="text-sm text-gray-500">ml</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3">Daily goal: 2500ml</p>
                                </CardContent>
                            </Card>

                            <Card className="border border-purple-100 shadow-sm hover:shadow-lg transition-all duration-300">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-purple-600 uppercase tracking-wide">Avg Adherence</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-gray-900">{stats.avgAdherence}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
                                        <div
                                            className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${stats.avgAdherence}%` }}
                                        ></div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border border-orange-100 shadow-sm hover:shadow-lg transition-all duration-300">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-orange-600 uppercase tracking-wide">Weight Change</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-4xl font-bold ${stats.weightChange === null ? 'text-gray-400' :
                                                parseFloat(stats.weightChange) > 0 ? 'text-red-500' :
                                                    parseFloat(stats.weightChange) < 0 ? 'text-green-500' : 'text-gray-900'
                                            }`}>
                                            {stats.weightChange === null ? '--' :
                                                parseFloat(stats.weightChange) > 0 ? `+${stats.weightChange}` : stats.weightChange}
                                        </span>
                                        <span className="text-sm text-gray-500">kg</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3">Since start of week</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </PatientLayout>
    );
}
