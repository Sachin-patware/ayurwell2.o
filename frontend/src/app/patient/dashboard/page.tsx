'use client';

import { useState, useEffect } from 'react';
import PatientLayout from '@/components/layouts/PatientLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Activity, Clock, ChevronRight, Loader2, AlertCircle, Sparkles, TrendingUp, Droplet } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { format } from 'date-fns';
import { ProgressChart } from '@/components/charts/ProgressChart';

export default function PatientDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [nextAppointment, setNextAppointment] = useState<any>(null);
    const [currentPlan, setCurrentPlan] = useState<any>(null);
    const [todayProgress, setTodayProgress] = useState<any>(null);
    const [todaysMeals, setTodaysMeals] = useState<any[]>([]);
    const [progressData, setProgressData] = useState<any[]>([]);
    const [weeklyAdherence, setWeeklyAdherence] = useState(0);

    const fetchData = async () => {
        try {
            const userId = user?.uid;
            if (!userId) return;

            // 1. Fetch Appointments
            const aptResponse = await api.get('/appointments/');
            const upcoming = aptResponse.data
                .filter((a: any) => a.status === 'confirmed' || a.status === 'pending')
                .sort((a: any, b: any) => new Date(a.startTimestamp).getTime() - new Date(b.startTimestamp).getTime());

            if (upcoming.length > 0) {
                setNextAppointment(upcoming[0]);
            }

            // 2. Fetch Diet Plan
            const planResponse = await api.get(`/diet-plans/${userId}`);
            if (planResponse.data && planResponse.data.length > 0) {
                const latestPlan = planResponse.data[0];
                setCurrentPlan(latestPlan.content);

                // Extract today's meals
                const todayDay = format(new Date(), 'EEEE');
                const todayPlan = latestPlan.content.mealPlan.find((d: any) => d.day === todayDay);

                if (todayPlan) {
                    setTodaysMeals(todayPlan.meals.map((m: any) => ({
                        type: m.type,
                        name: m.items.join(', '),
                        time: m.time,
                        status: 'pending'
                    })));
                }
            }

            // 3. Fetch Progress
            const progressResponse = await api.get(`/progress/${userId}`);
            if (progressResponse.data && progressResponse.data.length > 0) {
                setProgressData(progressResponse.data);

                // Check if there's a log for today
                const today = new Date().toISOString().split('T')[0];
                const todayLog = progressResponse.data.find((p: any) => p.date.startsWith(today));
                if (todayLog) {
                    setTodayProgress(todayLog);
                }

                // Calculate weekly adherence
                const lastWeek = progressResponse.data.slice(0, 7);
                const avgAdherence = lastWeek.reduce((sum: number, p: any) => sum + (p.mealAdherence || 0), 0) / lastWeek.length;
                setWeeklyAdherence(Math.round(avgAdherence));
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);



    if (loading) {
        return (
            <PatientLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="h-12 w-12 animate-spin text-[#2E7D32]" />
                </div>
            </PatientLayout>
        );
    }

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <PatientLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">
                            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
                        </h2>
                        <p className="text-gray-500 mt-2">Here's your wellness overview for today.</p>
                    </div>
                </div>

                {/* Enhanced Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-[#E9F7EF] to-[#D4EDDA] border-[#A2B38B] shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-full bg-white text-[#2E7D32] flex items-center justify-center shadow-sm">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-medium text-[#2E7D32] bg-white px-2 py-1 rounded-full">Active</span>
                            </div>
                            <p className="text-sm font-medium text-[#2E7D32] mb-1">Current Plan</p>
                            <p className="text-xl font-bold text-gray-900">
                                {currentPlan ? currentPlan.doshaImbalance + ' Balance' : 'No Plan Yet'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2] border-[#E07A5F] shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-full bg-white text-[#E07A5F] flex items-center justify-center shadow-sm">
                                    <TrendingUp className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-medium text-[#E07A5F] bg-white px-2 py-1 rounded-full">7 Days</span>
                            </div>
                            <p className="text-sm font-medium text-[#E07A5F] mb-1">Weekly Adherence</p>
                            <p className="text-xl font-bold text-gray-900">
                                {weeklyAdherence > 0 ? `${weeklyAdherence}%` : 'Not Tracked'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-sm">
                                    <Droplet className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-medium text-blue-600 bg-white px-2 py-1 rounded-full">Today</span>
                            </div>
                            <p className="text-sm font-medium text-blue-600 mb-1">Water Intake</p>
                            <p className="text-xl font-bold text-gray-900">
                                {todayProgress ? `${todayProgress.waterIntake} glasses` : '0 glasses'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-full bg-white text-purple-600 flex items-center justify-center shadow-sm">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-medium text-purple-600 bg-white px-2 py-1 rounded-full">Next</span>
                            </div>
                            <p className="text-sm font-medium text-purple-600 mb-1">Appointment</p>
                            <p className="text-lg font-bold text-gray-900">
                                {nextAppointment ? format(new Date(nextAppointment.startTimestamp), 'MMM d') : 'None'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Today's Schedule */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Today's Meals</h3>
                            <Link href="/patient/diet-plan">
                                <Button variant="ghost" className="text-[#2E7D32] hover:text-[#1B5E20]">
                                    View Full Plan
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {todaysMeals.length > 0 ? (
                                todaysMeals.map((meal, index) => (
                                    <Card key={index} className="transition-all hover:shadow-md border-l-4 border-l-[#2E7D32]">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="h-10 w-10 rounded-full bg-[#E9F7EF] text-[#2E7D32] flex items-center justify-center">
                                                    <Clock className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{meal.type}</p>
                                                    <p className="text-sm text-gray-500">{meal.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <span className="text-sm font-medium text-gray-500">{meal.time}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-dashed border-2">
                                    <CardContent className="p-8 flex flex-col items-center text-center">
                                        <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
                                        <p className="text-gray-600 font-medium mb-2">No meals scheduled for today.</p>
                                        {!currentPlan && (
                                            <>
                                                <p className="text-sm text-gray-500 mb-4">
                                                    Get started with a personalized diet plan!
                                                </p>

                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Progress Charts */}
                        {progressData.length > 0 && (
                            <div className="space-y-6 mt-8">
                                <h3 className="text-xl font-bold text-gray-900">Your Progress</h3>
                                <div className="grid grid-cols-1 gap-6">
                                    <ProgressChart data={progressData.slice(0, 14)} type="adherence" />
                                    <ProgressChart data={progressData.slice(0, 14)} type="water" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
                        <Card className="shadow-md">
                            <CardContent className="p-0 divide-y">
                                {/* <Link href="/patient/assessment" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium text-gray-700">Complete Assessment</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                </Link> */}
                                <Link href="/patient/track" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                            <Activity className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium text-gray-700">Log Today's Progress</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                </Link>
                                <Link href="/appointments" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium text-gray-700">Book Appointment</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                </Link>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-[#A2B38B] to-[#8B9A7A] text-white shadow-lg">
                            <CardContent className="p-6">
                                <h4 className="font-bold text-lg mb-2">💡 Ayurvedic Tip</h4>
                                <p className="text-[#E9F7EF] text-sm leading-relaxed">
                                    Drinking warm water in the morning helps flush out toxins (Ama) and kickstarts your digestion (Agni).
                                </p>
                            </CardContent>
                        </Card>

                        {currentPlan && (
                            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md">
                                <CardContent className="p-6">
                                    <h4 className="font-bold text-lg mb-2 text-green-900">🌿 Your Dosha Balance</h4>
                                    <p className="text-sm text-green-700 mb-3">
                                        {currentPlan.rationale}
                                    </p>
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-xs font-medium text-green-800 mb-1">Recommended:</p>
                                            <p className="text-sm text-green-700">
                                                {currentPlan.recommendedFoods?.slice(0, 3).join(', ')}...
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>


        </PatientLayout>
    );
}
