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
    if (!prakriti) return 'from-gray-400 to-gray-500';

    const lower = prakriti.toLowerCase();
    if (lower.includes('vata')) return 'from-blue-400 to-cyan-500';
    if (lower.includes('pitta')) return 'from-orange-400 to-red-500';
    if (lower.includes('kapha')) return 'from-green-400 to-emerald-500';
    return 'from-purple-400 to-pink-500';
};

export function AssessmentCard({ assessment, showPatientName = false }: AssessmentCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const prakritiColor = getPrakritiColor(assessment.assessment.prakriti);
    const createdDate = new Date(assessment.createdAt);

    return (
        <Card className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader className={`bg-gradient-to-r ${prakritiColor} text-white p-4`}>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-5 w-5" />
                            <h3 className="font-bold text-lg">
                                Assessment - {new Intl.DateTimeFormat('en-IN', {
                                    dateStyle: 'long',
                                    timeZone: 'Asia/Kolkata'
                                }).format(createdDate)}
                            </h3>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm">
                            {showPatientName && assessment.patientName && (
                                <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded">
                                    <User className="h-3 w-3" />
                                    <span>{assessment.patientName}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded">
                                <User className="h-3 w-3" />
                                <span>Dr. {assessment.doctorName}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded">
                                <Calendar className="h-3 w-3" />
                                <span>
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
                        className="text-white hover:bg-white/20"
                    >
                        {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                        ) : (
                            <ChevronDown className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-4">
                {/* Quick Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {assessment.assessment.age && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs text-blue-600 font-semibold">Age</p>
                            <p className="text-lg font-bold text-blue-800">{assessment.assessment.age}</p>
                        </div>
                    )}
                    {assessment.assessment.gender && (
                        <div className="bg-purple-50 p-3 rounded-lg">
                            <p className="text-xs text-purple-600 font-semibold">Gender</p>
                            <p className="text-lg font-bold text-purple-800">{assessment.assessment.gender}</p>
                        </div>
                    )}
                    {assessment.assessment.prakriti && (
                        <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-xs text-green-600 font-semibold">Prakriti</p>
                            <p className="text-sm font-bold text-green-800">{assessment.assessment.prakriti}</p>
                        </div>
                    )}
                    {assessment.assessment.vikriti && (
                        <div className="bg-orange-50 p-3 rounded-lg">
                            <p className="text-xs text-orange-600 font-semibold">Vikriti</p>
                            <p className="text-sm font-bold text-orange-800">{assessment.assessment.vikriti}</p>
                        </div>
                    )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="space-y-4 border-t pt-4">
                        {assessment.healthHistory && (
                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Heart className="h-4 w-4 text-blue-600" />
                                    <h4 className="font-semibold text-blue-800">Health History</h4>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{assessment.healthHistory}</p>
                            </div>
                        )}

                        {assessment.medicalConditions && (
                            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <h4 className="font-semibold text-red-800">Medical Conditions</h4>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{assessment.medicalConditions}</p>
                            </div>
                        )}

                        {assessment.lifestyle && (
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className="h-4 w-4 text-purple-600" />
                                    <h4 className="font-semibold text-purple-800">Lifestyle</h4>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{assessment.lifestyle}</p>
                            </div>
                        )}

                        {assessment.dietaryHabits && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Utensils className="h-4 w-4 text-green-600" />
                                    <h4 className="font-semibold text-green-800">Dietary Habits</h4>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{assessment.dietaryHabits}</p>
                            </div>
                        )}

                        {assessment.symptoms && (
                            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                    <h4 className="font-semibold text-orange-800">Symptoms</h4>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{assessment.symptoms}</p>
                            </div>
                        )}

                        {assessment.notes && (
                            <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border-2 border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <StickyNote className="h-4 w-4 text-gray-600" />
                                    <h4 className="font-semibold text-gray-800">Doctor's Notes</h4>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{assessment.notes}</p>
                            </div>
                        )}

                        {assessment.updatedAt && assessment.updatedAt !== assessment.createdAt && (
                            <div className="text-xs text-gray-500 text-right">
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
