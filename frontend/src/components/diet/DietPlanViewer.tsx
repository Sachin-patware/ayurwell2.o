'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Lightbulb, User } from 'lucide-react';

interface FoodItem {
    name: string;
    calories?: number;
    dosha?: string;
    [key: string]: any;
}

interface Meal {
    type: string;
    time: string;
    items: (string | FoodItem)[];
}

interface DayPlan {
    day: string;
    meals: Meal[];
}

interface DietPlan {
    doshaImbalance: string;
    prakriti?: string;
    recommendedFoods: string[];
    avoidFoods: string[];
    rationale: string;
    guidelines?: string[];
    mealPlan: DayPlan[];
}

interface DietPlanViewerProps {
    plan: DietPlan;
}

export function DietPlanViewer({ plan }: DietPlanViewerProps) {
    if (!plan || !plan.mealPlan || plan.mealPlan.length === 0) {
        return <div className="text-center text-gray-500 py-8">No plan data available</div>;
    }

    const mealPlan = plan.mealPlan;

    const renderItem = (item: string | FoodItem) => {
        if (typeof item === 'string') {
            return <span className="text-sm text-gray-700 leading-relaxed">{item}</span>;
        }
        return (
            <span className="text-sm text-gray-700 leading-relaxed flex items-center gap-2">
                {item.name}
                {item.calories && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {item.calories} kcal
                    </span>
                )}
            </span>
        );
    };

    return (
        <div className="w-full space-y-6">
            {/* Plan Overview - Top Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-green-900 flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Your Constitution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <p className="text-xs text-green-700 font-medium">Prakriti (Nature)</p>
                            <p className="text-sm text-green-900 font-semibold">{plan.prakriti || 'Not specified'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-green-700 font-medium">Vikriti (Imbalance)</p>
                            <p className="text-sm text-green-900 font-semibold">{plan.doshaImbalance}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-amber-900 flex items-center gap-2">
                            <Lightbulb className="h-5 w-5" />
                            Rationale
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-amber-900 leading-relaxed">{plan.rationale}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Guidelines Section */}
            {plan.guidelines && plan.guidelines.length > 0 && (
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
                            📋 Dietary Guidelines
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {plan.guidelines.map((guideline, idx) => (
                                <li key={idx} className="flex items-start gap-2 bg-white p-3 rounded-lg border border-purple-200">
                                    <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-purple-900">{guideline}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Recommended & Avoid Foods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Recommended Foods
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {plan.recommendedFoods?.map((food, idx) => (
                                <span key={idx} className="bg-white text-blue-800 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-200 shadow-sm">
                                    {food}
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg text-orange-900 flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            Foods to Avoid
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {plan.avoidFoods?.map((food, idx) => (
                                <span key={idx} className="bg-white text-orange-800 text-xs font-medium px-3 py-1.5 rounded-full border border-orange-200 shadow-sm">
                                    {food}
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Weekly Meal Plan */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl text-gray-900">🍽️ 7-Day Meal Plan</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue={mealPlan[0].day} className="w-full">
                        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto bg-gray-100 p-1">
                            {mealPlan.map((day) => (
                                <TabsTrigger
                                    key={day.day}
                                    value={day.day}
                                    className="min-w-[100px] data-[state=active]:bg-[#2E7D32] data-[state=active]:text-white"
                                >
                                    {day.day}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {mealPlan.map((day) => (
                            <TabsContent key={day.day} value={day.day} className="mt-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {day.meals.map((meal, idx) => (
                                        <Card key={idx} className="border-l-4 border-l-[#2E7D32] hover:shadow-lg transition-all">
                                            <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-transparent">
                                                <CardTitle className="text-base capitalize flex justify-between items-center">
                                                    <span className="font-bold text-gray-900">{meal.type}</span>
                                                    <span className="text-xs font-normal text-white bg-[#2E7D32] px-3 py-1 rounded-full">
                                                        {meal.time}
                                                    </span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-4">
                                                <ul className="space-y-2">
                                                    {meal.items.map((item, itemIdx) => (
                                                        <li key={itemIdx} className="flex items-start gap-2">
                                                            <span className="text-[#2E7D32] text-lg leading-none">•</span>
                                                            {renderItem(item)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
