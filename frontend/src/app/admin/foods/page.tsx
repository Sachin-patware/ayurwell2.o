'use client';

import { useState } from 'react';
import PractitionerLayout from '@/components/layouts/PractitionerLayout'; // Using Practitioner layout for admin for now
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Edit, Trash2, Filter } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function AdminFoodsPage() {
    const [searchTerm, setSearchTerm] = useState('');

    // Mock data
    const foods = [
        { id: '1', name: 'Moong Dal', category: 'Legumes', rasa: 'Sweet, Astringent', dosha: 'Tridoshic' },
        { id: '2', name: 'Ginger', category: 'Spices', rasa: 'Pungent', dosha: 'Kapha-Vata' },
        { id: '3', name: 'Ghee', category: 'Fats', rasa: 'Sweet', dosha: 'Vata-Pitta' },
        { id: '4', name: 'Basmati Rice', category: 'Grains', rasa: 'Sweet', dosha: 'Vata-Pitta' },
        { id: '5', name: 'Spinach', category: 'Vegetables', rasa: 'Bitter, Astringent', dosha: 'Pitta-Kapha' },
    ];

    const filteredFoods = foods.filter(food =>
        food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <PractitionerLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Food Database</h2>
                        <p className="text-gray-500 mt-1">Manage Ayurvedic food properties</p>
                    </div>
                    <Link href="/admin/foods/new">
                        <Button className="bg-[#2E7D32] hover:bg-[#1B5E20]">
                            <Plus className="mr-2 h-4 w-4" /> Add New Food
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Search foods..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 font-medium">
                                    <tr>
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Rasa (Taste)</th>
                                        <th className="p-4">Dosha Effect</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredFoods.map((food) => (
                                        <tr key={food.id} className="hover:bg-gray-50">
                                            <td className="p-4 font-medium">{food.name}</td>
                                            <td className="p-4">{food.category}</td>
                                            <td className="p-4">{food.rasa}</td>
                                            <td className="p-4">
                                                <Badge variant="outline" className={`
                                                    ${food.dosha.includes('Vata') ? 'border-blue-200 bg-blue-50 text-blue-700' : ''}
                                                    ${food.dosha.includes('Pitta') ? 'border-red-200 bg-red-50 text-red-700' : ''}
                                                    ${food.dosha.includes('Kapha') ? 'border-green-200 bg-green-50 text-green-700' : ''}
                                                    ${food.dosha === 'Tridoshic' ? 'border-purple-200 bg-purple-50 text-purple-700' : ''}
                                                `}>
                                                    {food.dosha}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <Link href={`/admin/foods/${food.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Edit className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                </Link>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PractitionerLayout>
    );
}
