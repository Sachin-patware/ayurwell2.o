'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, User, Calendar, FileText, Heart, Activity, Utensils, AlertCircle, StickyNote } from 'lucide-react';


interface AssessmentData {
    assessmentId: string;
    patientId: string;
    patientName?: string;
    doctorId: string;
    doctorName: string;
    createdAt: string;
    assessment: {
        age?: number;
        gender?: string;
        prakriti?: string;
        vikriti?: string;
    };
    healthHistory?: string;
    medicalConditions?: string;
    lifestyle?: string;
    dietaryHabits?: string;
    symptoms?: string;
    notes?: string;
    updatedAt?: string;
}

interface AssessmentCardProps {
    assessment: AssessmentData;
    showPatientName?: boolean;
}

const getPrakritiColor = (prakriti?: string) => {
    if (!prakriti) return { gradient: 'from-gray-100 to-gray-50', text: 'text-gray-900', icon: 'bg-gray-600' };

    const lower = prakriti.toLowerCase();
    if (lower.includes('vata')) return { gradient: 'from-blue-50 to-cyan-50', text: 'text-blue-900', icon: 'bg-blue-600' };
    if (lower.includes('pitta')) return { gradient: 'from-orange-50 to-red-50', text: 'text-orange-900', icon: 'bg-orange-600' };
    if (lower.includes('kapha')) return { gradient: 'from-green-50 to-emerald-50', text: 'text-green-900', icon: 'bg-green-600' };
    return { gradient: 'from-purple-50 to-pink-50', text: 'text-purple-900', icon: 'bg-purple-600' };
};

export function AssessmentCard({ assessment, showPatientName = false }: AssessmentCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const prakritiStyle = getPrakritiColor(assessment.assessment.prakriti);
    const createdDate = new Date(assessment.createdAt);

    return (
        <Card className="overflow-hidden border-2 border-gray-200 hover:border-[#2E7D32] hover:shadow-xl transition-all duration-300">
            {/* Elegant Header with subtle gradient */}
            <CardHeader className={`bg-gradient-to-r ${prakritiStyle.gradient} border-b-2 border-gray-200/50 p-5`}>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`${prakritiStyle.icon} rounded-lg p-2.5 shadow-md`}>
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <h3 className={`font-bold text-lg ${prakritiStyle.text}`}>
                                Assessment - {new Intl.DateTimeFormat('en-IN', {
                                    dateStyle: 'long',
                                    timeZone: 'Asia/Kolkata'
                                }).format(createdDate)}
                            </h3>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm">
                            {showPatientName && assessment.patientName && (
                                <div className="flex items-center gap-1.5 bg-white border-2 border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                                    <User className="h-3.5 w-3.5 text-gray-600" />
                                    <span className="font-medium text-gray-700">{assessment.patientName}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 bg-white border-2 border-green-200 px-3 py-1.5 rounded-lg shadow-sm">
                                <User className="h-3.5 w-3.5 text-[#2E7D32]" />
                                <span className="font-medium text-gray-700">Dr. {assessment.doctorName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white border-2 border-blue-200 px-3 py-1.5 rounded-lg shadow-sm">
                                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                                <span className="font-medium text-gray-700">
                                    {new Intl.DateTimeFormat('en-IN', {
                                        hour: 'numeric',
                                        minute: 'numeric',
                                        hour12: true,
                                        timeZone: 'Asia/Kolkata'
                                    }).format(createdDate)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`${prakritiStyle.text} hover:bg-white/60 rounded-lg`}
                    >
                        {isExpanded ? (
                            <ChevronUp className="h-6 w-6" />
                        ) : (
                            <ChevronDown className="h-6 w-6" />
                        )}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-5 bg-gradient-to-br from-white to-gray-50/30">
                {/* Quick Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {assessment.assessment.age && (
                        <div className="bg-white border-2 border-blue-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">Age</p>
                            <p className="text-2xl font-bold text-blue-800 mt-1">{assessment.assessment.age}</p>
                        </div>
                    )}
                    {assessment.assessment.gender && (
                        <div className="bg-white border-2 border-purple-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-xs text-purple-600 font-bold uppercase tracking-wide">Gender</p>
                            <p className="text-2xl font-bold text-purple-800 mt-1">{assessment.assessment.gender}</p>
                        </div>
                    )}
                    {assessment.assessment.prakriti && (
                        <div className="bg-white border-2 border-green-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-xs text-green-600 font-bold uppercase tracking-wide">Prakriti</p>
                            <p className="text-sm font-bold text-green-800 mt-1">{assessment.assessment.prakriti}</p>
                        </div>
                    )}
                    {assessment.assessment.vikriti && (
                        <div className="bg-white border-2 border-orange-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-xs text-orange-600 font-bold uppercase tracking-wide">Vikriti</p>
                            <p className="text-sm font-bold text-orange-800 mt-1">{assessment.assessment.vikriti}</p>
                        </div>
                    )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="space-y-4 border-t-2 border-gray-200 pt-5">
                        {assessment.healthHistory && (
                            <div className="bg-white border-2 border-blue-100 p-5 rounded-xl shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-blue-100 rounded-lg p-2">
                                        <Heart className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <h4 className="font-bold text-blue-900 text-base">Health History</h4>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{assessment.healthHistory}</p>
                            </div>
                        )}

                        {assessment.medicalConditions && (
                            <div className="bg-white border-2 border-red-100 p-5 rounded-xl shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-red-100 rounded-lg p-2">
                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                    </div>
                                    <h4 className="font-bold text-red-900 text-base">Medical Conditions</h4>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{assessment.medicalConditions}</p>
                            </div>
                        )}

                        {assessment.lifestyle && (
                            <div className="bg-white border-2 border-purple-100 p-5 rounded-xl shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-purple-100 rounded-lg p-2">
                                        <Activity className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <h4 className="font-bold text-purple-900 text-base">Lifestyle</h4>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{assessment.lifestyle}</p>
                            </div>
                        )}

                        {assessment.dietaryHabits && (
                            <div className="bg-white border-2 border-green-100 p-5 rounded-xl shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-green-100 rounded-lg p-2">
                                        <Utensils className="h-4 w-4 text-green-600" />
                                    </div>
                                    <h4 className="font-bold text-green-900 text-base">Dietary Habits</h4>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{assessment.dietaryHabits}</p>
                            </div>
                        )}

                        {assessment.symptoms && (
                            <div className="bg-white border-2 border-orange-100 p-5 rounded-xl shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-orange-100 rounded-lg p-2">
                                        <AlertCircle className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <h4 className="font-bold text-orange-900 text-base">Symptoms</h4>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{assessment.symptoms}</p>
                            </div>
                        )}

                        {assessment.notes && (
                            <div className="bg-white border-2 border-gray-300 p-5 rounded-xl shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-gray-200 rounded-lg p-2">
                                        <StickyNote className="h-4 w-4 text-gray-700" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-base">Doctor's Notes</h4>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{assessment.notes}</p>
                            </div>
                        )}

                        {assessment.updatedAt && assessment.updatedAt !== assessment.createdAt && (
                            <div className="text-xs text-gray-500 text-right font-medium">
                                Last updated: {new Intl.DateTimeFormat('en-IN', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                    timeZone: 'Asia/Kolkata'
                                }).format(new Date(assessment.updatedAt))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
