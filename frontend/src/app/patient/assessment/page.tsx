'use client';

import { useState, useEffect, useMemo } from 'react';
import PatientLayout from '@/components/layouts/PatientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AssessmentCard } from '@/components/assessments/AssessmentCard';
import { FileText, Loader2, Info, Filter, X, Search } from 'lucide-react';
import api from '@/services/api';

export default function PatientAssessmentPage() {
    const [assessments, setAssessments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [patientId, setPatientId] = useState<string>('');

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [prakritiFilter, setPrakritiFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                const userResponse = await api.get('/auth/me');
                const userId = userResponse.data.uid;
                setPatientId(userId);

                const response = await api.get(`/appointments/assessments/patient/${userId}`);
                setAssessments(response.data.assessments || []);
            } catch (error) {
                console.error('Error fetching assessments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssessments();
    }, []);

    // Get unique prakriti types
    const prakritiTypes = useMemo(() => {
        const types = new Set<string>();
        assessments.forEach(assessment => {
            if (assessment.assessment?.prakriti) {
                types.add(assessment.assessment.prakriti);
            }
        });
        return Array.from(types);
    }, [assessments]);

    // Filter logic
    const filteredAssessments = useMemo(() => {
        return assessments.filter(assessment => {
            // Prakriti filter
            if (prakritiFilter !== 'all' && assessment.assessment?.prakriti !== prakritiFilter) {
                return false;
            }

            // Search filter (doctor name)
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const doctorMatch = assessment.doctorName?.toLowerCase().includes(query);
                if (!doctorMatch) {
                    return false;
                }
            }

            return true;
        });
    }, [assessments, prakritiFilter, searchQuery]);

    const clearFilters = () => {
        setPrakritiFilter('all');
        setSearchQuery('');
    };

    const hasActiveFilters = prakritiFilter !== 'all' || searchQuery !== '';

    if (loading) {
        return (
            <PatientLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="h-12 w-12 animate-spin text-[#2E7D32]" />
                </div>
            </PatientLayout>
        );
    }

    return (
        <PatientLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="bg-gradient-to-r from-[#F1F8F4] to-[#E8F5E9] rounded-2xl p-8 border-2 border-[#2E7D32]/20 shadow-md flex-1">
                        <div className="flex items-center gap-4">
                            <div className="bg-[#2E7D32] rounded-xl p-3 shadow-lg">
                                <FileText className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">My Assessments</h2>
                                <p className="text-[#2E7D32] mt-1 font-medium">
                                    View your health assessment history
                                </p>
                            </div>
                        </div>
                    </div>
                    {assessments.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className="border-2 border-[#2E7D32] text-[#2E7D32] hover:bg-[#2E7D32] hover:text-white"
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </Button>
                    )}
                </div>

                {/* Filter Panel */}
                {showFilters && assessments.length > 0 && (
                    <Card className="border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                        <CardContent className="p-5">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Filter className="h-4 w-4" />
                                        Filter Assessments
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
                                    {/* Prakriti Filter */}
                                    {prakritiTypes.length > 0 && (
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Prakriti Type</label>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    variant={prakritiFilter === 'all' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setPrakritiFilter('all')}
                                                    className={prakritiFilter === 'all' ? 'bg-[#2E7D32] hover:bg-[#1B5E20]' : ''}
                                                >
                                                    All
                                                </Button>
                                                {prakritiTypes.map((type) => (
                                                    <Button
                                                        key={type}
                                                        variant={prakritiFilter === type ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setPrakritiFilter(type)}
                                                        className={prakritiFilter === type ? 'bg-[#2E7D32] hover:bg-[#1B5E20]' : ''}
                                                    >
                                                        {type}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Search Filter */}
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Search by Doctor</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by doctor name..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#2E7D32] focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="text-sm text-gray-600 pt-2 border-t">
                                    Showing <span className="font-semibold text-[#2E7D32]">{filteredAssessments.length}</span> of <span className="font-semibold">{assessments.length}</span> assessments
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Assessments List */}
                <Card className="border-2 border-gray-200 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-100">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl text-gray-900">Assessment History</CardTitle>
                            <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                {filteredAssessments.length} {filteredAssessments.length === 1 ? 'assessment' : 'assessments'}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {filteredAssessments.length > 0 ? (
                            <div className="space-y-5">
                                {filteredAssessments.map((assessment) => (
                                    <AssessmentCard
                                        key={assessment.assessmentId}
                                        assessment={assessment}
                                        showPatientName={false}
                                    />
                                ))}
                            </div>
                        ) : assessments.length > 0 ? (
                            <div className="text-center py-16">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-full inline-flex mb-4 shadow-sm">
                                    <Filter className="h-10 w-10 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    No Matching Assessments
                                </h3>
                                <p className="text-gray-600 max-w-md mx-auto text-lg mb-4">
                                    No assessments match your current filters.
                                </p>
                                <Button onClick={clearFilters} variant="outline" className="border-blue-600 text-blue-600">
                                    Clear Filters
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-full inline-flex mb-4 shadow-sm">
                                    <Info className="h-10 w-10 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    No Assessments Yet
                                </h3>
                                <p className="text-gray-600 max-w-md mx-auto text-lg">
                                    Your health assessments will appear here after your doctor completes them during your consultation.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PatientLayout>
    );
}
