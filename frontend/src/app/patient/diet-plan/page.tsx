'use client';

import { useEffect, useState, useMemo } from 'react';
import PatientLayout from '@/components/layouts/PatientLayout';
import { DietPlanViewer } from '@/components/diet/DietPlanViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2, AlertCircle, ChevronDown, ChevronUp, Calendar, User, FileText, Filter, X, Search } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DietPlan {
    id: string;
    generatedAt: string;
    content: any;
    createdBy: string;
    doctorName: string;
    status: string;
    publishedAt: string | null;
    lastModified: string | null;
}

export default function PatientDietPlanPage() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<DietPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
    const [downloadingPlanId, setDownloadingPlanId] = useState<string | null>(null);

    // Filter states
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchDietPlans();
    }, []);

    const fetchDietPlans = async () => {
        try {
            setLoading(true);
            const userId = user?.uid;

            if (!userId) {
                setError('User not logged in');
                return;
            }

            // Fetch all diet plans for this patient
            const response = await api.get(`/diet-plans/${userId}`);

            if (response.data && response.data.length > 0) {
                setPlans(response.data);
            } else {
                setError('No diet plan assigned yet. Please contact your doctor.');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load diet plans');
            console.error('Error fetching diet plans:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter logic
    const filteredPlans = useMemo(() => {
        return plans.filter(plan => {
            // Status filter
            if (statusFilter !== 'all' && plan.status !== statusFilter) {
                return false;
            }

            // Search filter (doctor name or constitution)
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const doctorMatch = plan.doctorName.toLowerCase().includes(query);
                const constitutionMatch = plan.content.prakriti?.toLowerCase().includes(query) ||
                    plan.content.doshaImbalance?.toLowerCase().includes(query);
                if (!doctorMatch && !constitutionMatch) {
                    return false;
                }
            }

            return true;
        });
    }, [plans, statusFilter, searchQuery]);

    const clearFilters = () => {
        setStatusFilter('all');
        setSearchQuery('');
    };

    const hasActiveFilters = statusFilter !== 'all' || searchQuery !== '';

    const togglePlanExpansion = (planId: string) => {
        setExpandedPlanId(expandedPlanId === planId ? null : planId);
    };

    const handleDownloadPDF = async (plan: DietPlan) => {
        try {
            setDownloadingPlanId(plan.id);

            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.width = '800px';
            tempDiv.style.padding = '40px';
            tempDiv.style.backgroundColor = 'white';
            document.body.appendChild(tempDiv);

            const content = plan.content;
            tempDiv.innerHTML = `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h1 style="color: #2E7D32; margin-bottom: 10px;">My Diet Plan</h1>
                    <p style="color: #666; margin-bottom: 20px;">Personalized Ayurvedic meal schedule</p>
                    <p style="color: #666; margin-bottom: 30px;">Doctor: ${plan.doctorName} | Published: ${plan.publishedAt ? new Date(plan.publishedAt).toLocaleDateString() : 'N/A'}</p>
                    
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #2E7D32; margin-bottom: 10px;">Your Constitution</h2>
                        <p><strong>Prakriti (Nature):</strong> ${content.prakriti || 'Not specified'}</p>
                        <p><strong>Vikriti (Imbalance):</strong> ${content.doshaImbalance || 'Not specified'}</p>
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #2E7D32; margin-bottom: 10px;">Rationale</h2>
                        <p>${content.rationale || ''}</p>
                    </div>
                    
                    ${content.guidelines && content.guidelines.length > 0 ? `
                        <div style="margin-bottom: 30px;">
                            <h2 style="color: #2E7D32; margin-bottom: 10px;">Dietary Guidelines</h2>
                            <ul>
                                ${content.guidelines.map((g: string) => `<li>${g}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #2E7D32; margin-bottom: 10px;">Recommended Foods</h2>
                        <p>${content.recommendedFoods?.join(', ') || ''}</p>
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #2E7D32; margin-bottom: 10px;">Foods to Avoid</h2>
                        <p>${content.avoidFoods?.join(', ') || ''}</p>
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #2E7D32; margin-bottom: 10px;">7-Day Meal Plan</h2>
                        ${content.mealPlan?.map((day: any) => `
                            <div style="margin-bottom: 20px; page-break-inside: avoid;">
                                <h3 style="color: #2E7D32; margin-bottom: 10px;">${day.day}</h3>
                                ${day.meals.map((meal: any) => `
                                    <div style="margin-bottom: 15px;">
                                        <p style="font-weight: bold; margin-bottom: 5px;">${meal.type} (${meal.time})</p>
                                        <ul style="margin-left: 20px;">
                                            ${meal.items.map((item: any) => `
                                                <li>${typeof item === 'string' ? item : item.name}</li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                `).join('')}
                            </div>
                        `).join('') || ''}
                    </div>
                </div>
            `;

            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 10;

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 20);

            while (heightLeft > 0) {
                position = heightLeft - imgHeight + 10;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= (pdfHeight - 20);
            }

            document.body.removeChild(tempDiv);

            const fileName = `diet-plan-${new Date(plan.publishedAt || plan.generatedAt).toLocaleDateString()}.pdf`;
            pdf.save(fileName);

            toast.success('PDF downloaded successfully!');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF. Please try again.');
        } finally {
            setDownloadingPlanId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; className: string }> = {
            active: { label: 'Active', className: 'bg-green-100 text-green-800 border-green-200' },
            completed: { label: 'Completed', className: 'bg-blue-100 text-blue-800 border-blue-200' },
            cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' },
            draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 border-gray-200' }
        };

        const config = statusConfig[status] || statusConfig.draft;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
                {config.label}
            </span>
        );
    };

    return (
        <PatientLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">My Diet Plans</h2>
                        <p className="text-gray-500 mt-1">View all your personalized Ayurvedic meal schedules</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="border-2 border-[#2E7D32] text-[#2E7D32] hover:bg-[#2E7D32] hover:text-white"
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>
                </div>

                {/* Filter Panel */}
                {showFilters && !loading && !error && plans.length > 0 && (
                    <Card className="border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                        <CardContent className="p-5">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Filter className="h-4 w-4" />
                                        Filter Diet Plans
                                    </h3>
                                    {hasActiveFilters && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearFilters}
                                            className="text-gray-600 hover:text-gray-900"
                                        >
                                            <X className="mr-1 h-4 w-4" />
                                            Clear All
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Status Filter */}
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Status</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['all', 'active', 'completed', 'cancelled'].map((status) => (
                                                <Button
                                                    key={status}
                                                    variant={statusFilter === status ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setStatusFilter(status)}
                                                    className={statusFilter === status ? 'bg-[#2E7D32] hover:bg-[#1B5E20]' : ''}
                                                >
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Search Filter */}
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Search</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by doctor or constitution..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#2E7D32] focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="text-sm text-gray-600 pt-2 border-t">
                                    Showing <span className="font-semibold text-[#2E7D32]">{filteredPlans.length}</span> of <span className="font-semibold">{plans.length}</span> diet plans
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {loading && (
                    <Card>
                        <CardContent className="p-12 flex flex-col items-center justify-center">
                            <Loader2 className="h-12 w-12 animate-spin text-[#2E7D32] mb-4" />
                            <p className="text-gray-600">Loading your diet plans...</p>
                        </CardContent>
                    </Card>
                )}

                {error && !loading && (
                    <Card className="border-amber-300 bg-amber-50">
                        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                            <AlertCircle className="h-12 w-12 text-amber-600 mb-4" />
                            <h3 className="text-lg font-semibold text-amber-900 mb-2">No Diet Plans Available</h3>
                            <p className="text-amber-700 mb-6">{error}</p>
                            <p className="text-sm text-amber-600">
                                Your practitioner will create a personalized plan based on your assessment.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {!loading && !error && filteredPlans.length === 0 && plans.length > 0 && (
                    <Card className="border-blue-300 bg-blue-50">
                        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                            <Filter className="h-12 w-12 text-blue-600 mb-4" />
                            <h3 className="text-lg font-semibold text-blue-900 mb-2">No Matching Plans</h3>
                            <p className="text-blue-700 mb-4">No diet plans match your current filters.</p>
                            <Button onClick={clearFilters} variant="outline" className="border-blue-600 text-blue-600">
                                Clear Filters
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {!loading && !error && filteredPlans.length > 0 && (
                    <div className="space-y-5">
                        {filteredPlans.map((plan) => (
                            <Card
                                key={plan.id}
                                className="overflow-hidden border-2 border-gray-200 hover:border-[#2E7D32] hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50"
                            >
                                <div className="bg-gradient-to-r from-[#F1F8F4] to-[#E8F5E9] border-b-2 border-[#2E7D32]/20 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#2E7D32] rounded-lg p-2.5 shadow-md">
                                                <FileText className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-gray-900 font-bold text-lg">Personalized Diet Plan</h3>
                                                <p className="text-[#2E7D32] text-sm font-medium">
                                                    {plan.content.prakriti || 'Constitution'} - {plan.content.doshaImbalance || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(plan.status)}
                                    </div>
                                </div>

                                <CardHeader
                                    className="cursor-pointer hover:bg-white/80 transition-colors pb-4"
                                    onClick={() => togglePlanExpansion(plan.id)}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3 bg-white rounded-xl p-4 border-2 border-green-100 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-full p-2.5 shadow-sm">
                                                    <User className="h-5 w-5 text-[#2E7D32]" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Created By</p>
                                                    <p className="text-base font-bold text-gray-900">Dr. {plan.doctorName}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 bg-white rounded-xl p-4 border-2 border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-full p-2.5 shadow-sm">
                                                    <Calendar className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Published On</p>
                                                    <p className="text-base font-bold text-gray-900">
                                                        {plan.publishedAt
                                                            ? new Date(plan.publishedAt).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })
                                                            : new Date(plan.generatedAt).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownloadPDF(plan);
                                                }}
                                                disabled={downloadingPlanId === plan.id}
                                                className="border-2 border-[#2E7D32] text-[#2E7D32] hover:bg-[#2E7D32] hover:text-white font-semibold shadow-sm hover:shadow-md transition-all"
                                            >
                                                {downloadingPlanId === plan.id ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Download PDF
                                                    </>
                                                )}
                                            </Button>
                                            {expandedPlanId === plan.id ? (
                                                <ChevronUp className="h-6 w-6 text-[#2E7D32] font-bold" />
                                            ) : (
                                                <ChevronDown className="h-6 w-6 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                {expandedPlanId === plan.id && (
                                    <CardContent className="pt-6 border-t-2 border-gray-100 bg-white">
                                        <DietPlanViewer plan={plan.content} />
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </PatientLayout>
    );
}
