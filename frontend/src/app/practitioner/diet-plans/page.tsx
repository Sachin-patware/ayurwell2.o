'use client';

import { useState, useEffect } from 'react';
import PractitionerLayout from '@/components/layouts/PractitionerLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileText, Calendar, Loader2, CheckCircle, XCircle, PlayCircle, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import api from '@/services/api';
import { formatDateIST } from '@/lib/dateUtils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '../../../components/ui/badge';

interface DietPlan {
    id: string;
    patientId: string;
    patientName: string;
    generatedAt: string;
    lastModified: string;
    status: string;
    calories: number;
}

export default function DietPlansPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [plans, setPlans] = useState<DietPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await api.get('/diet-plans');
            setPlans(response.data);
        } catch (error) {
            console.error('Failed to fetch diet plans', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleStatusChange = async (planId: string, newStatus: string) => {
        try {
            // Optimistic update
            setPlans(prevPlans => prevPlans.map(p =>
                p.id === planId ? { ...p, status: newStatus } : p
            ));

            const response = await api.put(`/diet-plans/${planId}/status`, { status: newStatus });

            console.log('Status update response:', response.data);

            // Refresh to ensure sync
            await fetchPlans();
        } catch (error: any) {
            console.error('Failed to update status', error);
            console.error('Error response:', error.response?.data);

            // Revert optimistic update
            await fetchPlans();

            const errorMessage = error.response?.data?.error || error.message || "Failed to update status. Please try again.";
            alert(errorMessage);
        }
    };

    const filteredPlans = plans.filter(plan => {
        const matchesSearch = plan.patientName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || plan.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
            case 'published':
                return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200';
            case 'completed':
                return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200';
            case 'cancelled':
                return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200';
            default: // draft
                return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
            case 'published':
                return <PlayCircle className="h-3.5 w-3.5" />;
            case 'completed':
                return <CheckCircle className="h-3.5 w-3.5" />;
            case 'cancelled':
                return <XCircle className="h-3.5 w-3.5" />;
            default:
                return <Clock className="h-3.5 w-3.5" />;
        }
    };

    const statusCounts = {
        all: plans.length,
        active: plans.filter(p => p.status.toLowerCase() === 'active' || p.status.toLowerCase() === 'published').length,
        draft: plans.filter(p => p.status.toLowerCase() === 'draft').length,
        completed: plans.filter(p => p.status.toLowerCase() === 'completed').length,
    };

    return (
        <PractitionerLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] rounded-xl p-8 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold">My Diet Plans</h2>
                            <p className="text-green-100 mt-2">Manage diet plans you've created for your patients</p>
                        </div>
                        <div className="hidden md:flex items-center gap-6">
                            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/20">
                                <div className="text-2xl font-bold">{plans.length}</div>
                                <div className="text-xs text-green-100">Total Plans</div>
                            </div>
                            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/20">
                                <div className="text-2xl font-bold">{statusCounts.active}</div>
                                <div className="text-xs text-green-100">Active</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Search by patient name..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {['all', 'active', 'draft', 'completed'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === status
                                            ? 'bg-[#2E7D32] text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                        <span className="ml-2 text-xs opacity-75">
                                            ({status === 'all' ? statusCounts.all : statusCounts[status as keyof typeof statusCounts]})
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <Loader2 className="h-12 w-12 animate-spin text-[#2E7D32] mb-4" />
                                <p className="text-gray-500">Loading diet plans...</p>
                            </div>
                        ) : filteredPlans.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                    <FileText className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No diet plans found</h3>
                                <p className="text-gray-500 mb-6">
                                    {searchTerm || statusFilter !== 'all'
                                        ? 'Try adjusting your filters'
                                        : 'Create diet plans from your patient profiles'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {filteredPlans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border-2 border-gray-100 rounded-xl hover:border-[#2E7D32] hover:shadow-md transition-all duration-200 gap-4 bg-white"
                                    >
                                        {/* Left Section */}
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#E9F7EF] to-[#C8E6C9] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                <FileText className="h-7 w-7 text-[#2E7D32]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-900 text-lg mb-1 truncate">{plan.patientName}</h4>
                                                <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-1">
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span className="font-medium">Updated:</span>
                                                        {formatDateIST(plan.lastModified || plan.generatedAt, 'MMM d, yyyy')}
                                                    </span>
                                                    {plan.calories > 0 && (
                                                        <span className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                                                            <TrendingUp className="h-3.5 w-3.5" />
                                                            {plan.calories} kcal
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Section */}
                                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Badge
                                                        className={`cursor-pointer px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(plan.status)}`}
                                                    >
                                                        {getStatusIcon(plan.status)}
                                                        {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                                                    </Badge>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleStatusChange(plan.id, 'active')}>
                                                        <PlayCircle className="mr-2 h-4 w-4 text-green-600" /> Active
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(plan.id, 'completed')}>
                                                        <CheckCircle className="mr-2 h-4 w-4 text-blue-600" /> Completed
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(plan.id, 'cancelled')}>
                                                        <XCircle className="mr-2 h-4 w-4 text-red-600" /> Cancelled
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            <Link href={`/practitioner/diet-plans/create?edit=${plan.id}&patientId=${plan.patientId}`}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-[#2E7D32] text-[#2E7D32] hover:bg-[#2E7D32] hover:text-white transition-colors"
                                                >
                                                    {plan.status === 'draft' ? 'Continue Editing' : 'View/Edit'}
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PractitionerLayout>
    );
}
