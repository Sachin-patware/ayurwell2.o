'use client';

import { useState, useEffect } from 'react';
import PractitionerLayout from '@/components/layouts/PractitionerLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileText, Calendar, Loader2, CheckCircle, XCircle, PlayCircle, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import api from '@/services/api';
import { toast } from 'react-toastify';
import { formatDateIST } from '@/lib/dateUtils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

interface DietPlan {
    id: string;
    patientId: string;
    patientName: string;
    generatedAt: string;
    lastModified: string;
    status: string;
    calories: number;
}

function toIST(dateString: string) {
    const d = new Date(
        dateString.endsWith('Z') || dateString.includes('+')
            ? dateString
            : dateString + 'Z'
    );

    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: 'Asia/Kolkata'
    }).format(d);
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

    const handleAction = async (planId: string, action: 'publish' | 'complete' | 'cancel') => {
        const actionText = action === 'publish' ? 'activate' : action;
        if (!confirm(`Are you sure you want to ${actionText} this plan?`)) return;

        try {
            setLoading(true);
            // Optimistic update
            const newStatus = action === 'publish' ? 'active' : action === 'complete' ? 'completed' : 'cancelled';
            setPlans(prev => prev.map(p => p.id === planId ? { ...p, status: newStatus } : p));

            await api.put(`/diet-plans/${planId}/${action}`);
            await fetchPlans();
        } catch (error: any) {
            console.error(`Failed to ${action} plan`, error);
            toast.error(`Failed to ${action} plan`);
            await fetchPlans(); // Revert on error
        } finally {
            setLoading(false);
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
                return <PlayCircle className="h-3.5 w-3.5" />;
            case 'completed':
                return <CheckCircle className="h-3.5 w-3.5" />;
            case 'cancelled':
                return <XCircle className="h-3.5 w-3.5" />;
            default:
                return <FileText className="h-3.5 w-3.5" />;
        }
    };

    const statusCounts = {
        all: plans.length,
        active: plans.filter(p => p.status === 'active').length,
        draft: plans.filter(p => p.status === 'draft').length,
        completed: plans.filter(p => p.status === 'completed').length,
        cancelled: plans.filter(p => p.status === 'cancelled').length,
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
                            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg overflow-x-auto">
                                {['all', 'draft', 'active', 'completed', 'cancelled'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize whitespace-nowrap ${statusFilter === status
                                            ? 'bg-white text-[#2E7D32] shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                            }`}
                                    >
                                        {status}
                                        <span className="ml-2 text-xs opacity-60 bg-gray-200 px-1.5 py-0.5 rounded-full">
                                            {statusCounts[status as keyof typeof statusCounts]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Plans Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-[#2E7D32]" />
                    </div>
                ) : filteredPlans.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No diet plans found</h3>
                        <p className="text-gray-500">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPlans.map((plan) => (
                            <Card key={plan.id} className="group hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-[#2E7D32]">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#2E7D32] transition-colors">
                                                {plan.patientName}
                                            </h3>
                                            <p className="text-sm text-gray-500 flex items-center mt-1">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                <span className="font-medium mr-1">Updated:</span>
                                                <span>{toIST(plan.lastModified || plan.generatedAt)}</span>
                                            </p>
                                        </div>
                                        <Badge className={`${getStatusColor(plan.status)} border px-2.5 py-0.5`}>
                                            <span className="flex items-center gap-1.5">
                                                {getStatusIcon(plan.status)}
                                                <span className="capitalize">{plan.status}</span>
                                            </span>
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg">
                                        <div className="flex items-center">
                                            <TrendingUp className="h-4 w-4 mr-2 text-orange-500" />
                                            <span className="font-medium">{plan.calories || 'N/A'}</span>
                                            <span className="text-xs ml-1">kcal</span>
                                        </div>
                                        <div className="h-4 w-px bg-gray-300"></div>
                                        <div className="flex items-center">
                                            <Clock className="h-4 w-4 mr-2 text-blue-500" />
                                            <span>7 Days</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                        <Link href={`/practitioner/diet-plans/create?edit=${plan.id}`} className="flex-1">
                                            <Button variant="outline" className="w-full hover:bg-[#E9F7EF] hover:text-[#2E7D32] hover:border-[#2E7D32]">
                                                {plan.status === 'draft' ? 'Edit Plan' : 'View Plan'}
                                            </Button>
                                        </Link>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-10 w-10">
                                                    <span className="sr-only">Open menu</span>
                                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.12132 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />

                                                {plan.status === 'draft' && (
                                                    <DropdownMenuItem onClick={() => handleAction(plan.id, 'publish')} className="text-green-600">
                                                        <PlayCircle className="mr-2 h-4 w-4" /> Publish Plan
                                                    </DropdownMenuItem>
                                                )}

                                                {plan.status === 'active' && (
                                                    <DropdownMenuItem onClick={() => handleAction(plan.id, 'complete')} className="text-blue-600">
                                                        <CheckCircle className="mr-2 h-4 w-4" /> Mark Completed
                                                    </DropdownMenuItem>
                                                )}

                                                {(plan.status === 'draft' || plan.status === 'active') && (
                                                    <DropdownMenuItem onClick={() => handleAction(plan.id, 'cancel')} className="text-red-600">
                                                        <XCircle className="mr-2 h-4 w-4" /> Cancel Plan
                                                    </DropdownMenuItem>
                                                )}

                                                <Link href={`/practitioner/diet-plans/create?edit=${plan.id}`}>
                                                    <DropdownMenuItem>
                                                        <FileText className="mr-2 h-4 w-4" /> View Details
                                                    </DropdownMenuItem>
                                                </Link>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </PractitionerLayout>
    );
}
