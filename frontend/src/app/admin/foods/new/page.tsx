'use client';

import { useState } from 'react';
import PractitionerLayout from '@/components/layouts/PractitionerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RasaWheel } from '@/components/food/RasaWheel';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AddFoodPage() {
    const router = useRouter();
    const [rasaValues, setRasaValues] = useState({
        sweet: 30,
        sour: 10,
        salty: 10,
        pungent: 20,
        bitter: 15,
        astringent: 15
    });

    const handleRasaChange = (key: string, value: string) => {
        setRasaValues(prev => ({
            ...prev,
            [key]: parseInt(value) || 0
        }));
    };

    const handleSave = () => {
        // Save logic
        router.push('/admin/foods');
    };

    return (
        <PractitionerLayout>
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/foods">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Add New Food</h2>
                        <p className="text-gray-500">Enter nutritional and Ayurvedic properties</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Food Name</label>
                                        <Input placeholder="e.g., Moong Dal" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Category</label>
                                        <Select>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="grains">Grains</SelectItem>
                                                <SelectItem value="legumes">Legumes</SelectItem>
                                                <SelectItem value="vegetables">Vegetables</SelectItem>
                                                <SelectItem value="fruits">Fruits</SelectItem>
                                                <SelectItem value="spices">Spices</SelectItem>
                                                <SelectItem value="dairy">Dairy</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Calories (per 100g)</label>
                                        <Input type="number" placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Virya (Potency)</label>
                                        <Select>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="heating">Heating (Ushna)</SelectItem>
                                                <SelectItem value="cooling">Cooling (Sheeta)</SelectItem>
                                                <SelectItem value="neutral">Neutral</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Vipaka (Post-Digestive)</label>
                                        <Select>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sweet">Sweet (Madhura)</SelectItem>
                                                <SelectItem value="sour">Sour (Amla)</SelectItem>
                                                <SelectItem value="pungent">Pungent (Katu)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Dosha Effect</label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select primary effect" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="vata">Vata Pacifying</SelectItem>
                                            <SelectItem value="pitta">Pitta Pacifying</SelectItem>
                                            <SelectItem value="kapha">Kapha Pacifying</SelectItem>
                                            <SelectItem value="tridoshic">Tridoshic (Balances All)</SelectItem>
                                            <SelectItem value="vata-aggravating">Vata Aggravating</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Rasa (Taste Profile)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.entries(rasaValues).map(([key, value]) => (
                                        <div key={key} className="space-y-2">
                                            <label className="text-sm font-medium capitalize">{key}</label>
                                            <Input
                                                type="number"
                                                value={value}
                                                onChange={(e) => handleRasaChange(key, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Taste Visualization</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RasaWheel rasas={rasaValues} />
                                <p className="text-sm text-gray-500 text-center mt-4">
                                    Adjust the values to see the taste profile distribution.
                                </p>
                            </CardContent>
                        </Card>

                        <Button onClick={handleSave} className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] h-12 text-lg">
                            <Save className="mr-2 h-5 w-5" /> Save Food Item
                        </Button>
                    </div>
                </div>
            </div>
        </PractitionerLayout>
    );
}
