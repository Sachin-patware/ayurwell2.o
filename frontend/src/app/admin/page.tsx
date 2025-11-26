'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

interface FoodItem {
    id: string;
    name: string;
    rasa: string;
    virya: string;
    vipaka: string;
    dosha_pacified: string[];
}

export default function AdminPage() {
    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [newFood, setNewFood] = useState({ name: '', rasa: '', virya: '', vipaka: '', dosha_pacified: '' });

    useEffect(() => {
        // In a real app, fetch from API. For now, mock or implement API.
        // fetchFoods();
    }, []);

    const handleAddFood = async (e: React.FormEvent) => {
        e.preventDefault();
        // Implement API call to add food
        console.log('Adding food:', newFood);
        alert('Food added (mock)');
        setNewFood({ name: '', rasa: '', virya: '', vipaka: '', dosha_pacified: '' });
    };

    return (
        <div className="min-h-screen bg-[#E9F7EF] p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-[#2E7D32] mb-8">Admin Dashboard</h1>

                <div className="grid gap-8 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-[#2E7D32]">Add New Food Item</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddFood} className="space-y-4">
                                <Input placeholder="Food Name" value={newFood.name} onChange={e => setNewFood({ ...newFood, name: e.target.value })} />
                                <Input placeholder="Rasa (Taste)" value={newFood.rasa} onChange={e => setNewFood({ ...newFood, rasa: e.target.value })} />
                                <Input placeholder="Virya (Potency)" value={newFood.virya} onChange={e => setNewFood({ ...newFood, virya: e.target.value })} />
                                <Input placeholder="Vipaka (Post-digestive)" value={newFood.vipaka} onChange={e => setNewFood({ ...newFood, vipaka: e.target.value })} />
                                <Input placeholder="Dosha Pacified (comma separated)" value={newFood.dosha_pacified} onChange={e => setNewFood({ ...newFood, dosha_pacified: e.target.value })} />
                                <Button type="submit" className="w-full bg-[#2E7D32] hover:bg-[#1B5E20]">
                                    <Plus size={18} className="mr-2" /> Add to Database
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-[#2E7D32]">Food Database</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="text-gray-500 italic">Database list will appear here.</p>
                                {/* List foods here */}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
