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
                <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold flex items-center gap-2">
                                <Activity className="h-8 w-8" />
                                Track Your Progress
                            </h2>
                            <p className="mt-2 text-emerald-50">Monitor your daily health metrics and wellness journey</p>
                        </div>
                        <div className="hidden md:flex items-center gap-4">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                                <p className="text-xs text-emerald-100">Streak</p>
                                <p className="text-2xl font-bold">{stats.loggedDays} 🔥</p>
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
                        <TabsTrigger value="log" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-lg">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Log Today
                        </TabsTrigger>
                        <TabsTrigger value="history" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg">
                            <History className="h-4 w-4 mr-2" />
                            History
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Stats
                        </TabsTrigger>
                    </TabsList>

                    {/* LOG TAB */}
                    <TabsContent value="log" className="space-y-6">
                        {/* Date Picker with Gradient */}
                        <Card className="border-2 border-emerald-200 shadow-md">
                            <CardContent className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50">
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
                                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-2 rounded-lg">
                                            <CalendarIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-lg text-gray-900">
                                                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                                            </p>
                                            <p className="text-xs font-semibold text-emerald-600">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Water Intake - Blue Gradient */}
                            <Card className="border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                                    <CardTitle className="flex items-center text-blue-700">
                                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg mr-2">
                                            <Droplet className="h-5 w-5 text-white" />
                                        </div>
                                        Water Intake
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="space-y-4">
                                        <Input
                                            type="number"
                                            placeholder="Enter ml (e.g., 2000)"
                                            value={waterIntake || ''}
                                            onChange={(e) => setWaterIntake(parseInt(e.target.value) || 0)}
                                            className="text-lg border-2 border-blue-200 focus:border-blue-400"
                                        />
                                        <div className="flex gap-2 flex-wrap">
                                            {[250, 500, 750, 1000].map((amt) => (
                                                <Button
                                                    key={amt}
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setWaterIntake(waterIntake + amt)}
                                                    className="bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-blue-300 font-semibold"
                                                >
                                                    +{amt}ml
                                                </Button>
                                            ))}
                                        </div>
                                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-3 rounded-lg text-center">
                                            <p className="text-sm opacity-90">Total</p>
                                            <p className="text-2xl font-bold">{waterIntake} ml</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Bowel Movement - Green Gradient */}
                            <Card className="border-2 border-green-200 shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                                    <CardTitle className="flex items-center text-green-700">
                                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg mr-2">
                                            <Heart className="h-5 w-5 text-white" />
                                        </div>
                                        Bowel Movement
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <Select value={bowelMovement} onValueChange={setBowelMovement}>
                                        <SelectTrigger className="border-2 border-green-200 focus:border-green-400">
                                            <SelectValue placeholder="Select status..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="normal">✅ Normal</SelectItem>
                                            <SelectItem value="constipated">🟡 Constipated</SelectItem>
                                            <SelectItem value="loose">🟠 Loose</SelectItem>
                                            <SelectItem value="diarrhea">🔴 Diarrhea</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>

                            {/* Meal Adherence - Purple Gradient */}
                            <Card className="border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                                    <CardTitle className="flex items-center text-purple-700">
                                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg mr-2">
                                            <Zap className="h-5 w-5 text-white" />
                                        </div>
                                        Meal Adherence
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="space-y-4">
                                        <Input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={mealAdherence}
                                            onChange={(e) => setMealAdherence(parseInt(e.target.value))}
                                            className="w-full accent-purple-500"
                                        />
                                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg text-center">
                                            <p className="text-4xl font-bold">{mealAdherence}%</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Weight - Orange Gradient */}
                            <Card className="border-2 border-orange-200 shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                                    <CardTitle className="text-orange-700">Weight (Optional)</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="Enter weight in kg"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        className="border-2 border-orange-200 focus:border-orange-400"
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
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-12 px-8 text-lg font-semibold shadow-lg"
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
                            <div className="space-y-3">
                                {history.slice(0, 14).map((entry, index) => (
                                    <Card key={entry.id} className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
                                        <CardContent className="p-4 bg-gradient-to-r from-white to-blue-50/30">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <h3 className="font-bold text-lg text-gray-900">
                                                            {format(new Date(entry.date), 'EEEE, MMM d, yyyy')}
                                                        </h3>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${entry.bowelMovement === 'normal' ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white' :
                                                                entry.bowelMovement === 'constipated' ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white' :
                                                                    'bg-gradient-to-r from-red-400 to-pink-400 text-white'
                                                            }`}>
                                                            {entry.bowelMovement}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div className="bg-blue-50 p-2 rounded-lg">
                                                            <span className="text-blue-600 font-semibold">💧 Water:</span>
                                                            <span className="ml-2 font-bold text-blue-700">{entry.waterIntake} ml</span>
                                                        </div>
                                                        <div className="bg-purple-50 p-2 rounded-lg">
                                                            <span className="text-purple-600 font-semibold">⚡ Adherence:</span>
                                                            <span className="ml-2 font-bold text-purple-700">{entry.mealAdherence}%</span>
                                                        </div>
                                                        {entry.weight && (
                                                            <div className="bg-orange-50 p-2 rounded-lg">
                                                                <span className="text-orange-600 font-semibold">⚖️ Weight:</span>
                                                                <span className="ml-2 font-bold text-orange-700">{entry.weight} kg</span>
                                                            </div>
                                                        )}
                                                        {entry.symptoms && (
                                                            <div className="col-span-2 bg-red-50 p-2 rounded-lg">
                                                                <span className="text-red-600 font-semibold">🩺 Symptoms:</span>
                                                                <span className="ml-2 font-medium text-red-700">{entry.symptoms}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {entry.notes && (
                                                        <p className="mt-3 text-sm text-gray-600 italic bg-gray-50 p-2 rounded-lg">"{entry.notes}"</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(entry)}
                                                        className="hover:bg-blue-100 text-blue-600"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(entry.id)}
                                                        className="hover:bg-red-100 text-red-600"
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
            </div>
        </PatientLayout>
    );
}
