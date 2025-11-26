'use client';

import { useState, useEffect } from 'react';
import PractitionerLayout from '@/components/layouts/PractitionerLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, FileText, Calendar, User, MoreVertical, Loader2, CheckCircle, XCircle, PlayCircle } from 'lucide-react';
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
} from "../../../components/ui/dropdown-menu";
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

    const filteredPlans = plans.filter(plan =>
        plan.patientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
            case 'published':
                return 'bg-green-100 text-green-700 hover:bg-green-200';
            case 'completed':
                return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
            case 'cancelled':
                return 'bg-red-100 text-red-700 hover:bg-red-200';
            default: // draft
                return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
        }
    };

    return (
        <PractitionerLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Diet Plans</h2>
                        <p className="text-gray-500 mt-1">Manage and generate diet plans</p>
                    </div>
                    <Link href="/practitioner/diet-plans/create">
                        <Button className="bg-[#2E7D32] hover:bg-[#1B5E20]">
                            <Plus className="mr-2 h-4 w-4" /> Create New Plan
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search by patient name..."
                                className="pl-9 max-w-md"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-[#2E7D32]" />
                            </div>
                        ) : filteredPlans.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p>No diet plans found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredPlans.map((plan) => (
                                    <div key={plan.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-12 w-12 rounded-full bg-[#E9F7EF] text-[#2E7D32] flex items-center justify-center shrink-0">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 text-lg">{plan.patientName}</h4>
                                                <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-1 mt-1">
                                                    <span className="flex items-center">
                                                        <Calendar className="h-3 w-3 mr-1" />
                                                        {formatDateIST(plan.lastModified || plan.generatedAt, 'MMM d, yyyy')}
                                                    </span>
                                                    {plan.calories > 0 && (
                                                        <span className="flex items-center">
                                                            <User className="h-3 w-3 mr-1" />
                                                            {plan.calories} kcal
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Badge
                                                        className={`cursor-pointer px-3 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(plan.status)}`}
                                                    >
                                                        {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                                                    </Badge>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
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
                                                <Button variant="outline" size="sm">
                                                    {plan.status === 'draft' ? 'Edit' : 'View/Edit'}
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
