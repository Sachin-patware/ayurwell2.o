'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-toastify';

interface FoodItem {
    id: string;
    name: string;
    calories: number;
    rasa: string;
    virya: string;
    vipaka: string;
    dosha: string;
}

interface FoodSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: FoodItem) => void;
}

export function FoodSearchModal({ isOpen, onClose, onSelect }: FoodSearchModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [customFood, setCustomFood] = useState({
        name: '',
        calories: '',
        rasa: 'Sweet',
        virya: 'Neutral',
        vipaka: 'Sweet',
        dosha: 'Tridoshic'
    });

    // Expanded food database with more Ayurvedic foods
    const foodDatabase: FoodItem[] = [
        { id: '1', name: 'Moong Dal Soup', calories: 150, rasa: 'Sweet, Astringent', virya: 'Cooling', vipaka: 'Sweet', dosha: 'Tridoshic' },
        { id: '2', name: 'Basmati Rice', calories: 200, rasa: 'Sweet', virya: 'Cooling', vipaka: 'Sweet', dosha: 'Vata-Pitta' },
        { id: '3', name: 'Ghee', calories: 120, rasa: 'Sweet', virya: 'Cooling', vipaka: 'Sweet', dosha: 'Vata-Pitta' },
        { id: '4', name: 'Ginger Tea', calories: 10, rasa: 'Pungent', virya: 'Heating', vipaka: 'Pungent', dosha: 'Kapha-Vata' },
        { id: '5', name: 'Steamed Vegetables', calories: 80, rasa: 'Bitter, Astringent', virya: 'Neutral', vipaka: 'Pungent', dosha: 'Tridoshic' },
        { id: '6', name: 'Turmeric Milk', calories: 150, rasa: 'Bitter, Pungent', virya: 'Heating', vipaka: 'Pungent', dosha: 'Kapha' },
        { id: '7', name: 'Almonds', calories: 170, rasa: 'Sweet', virya: 'Heating', vipaka: 'Sweet', dosha: 'Vata' },
        { id: '8', name: 'Coconut Water', calories: 45, rasa: 'Sweet', virya: 'Cooling', vipaka: 'Sweet', dosha: 'Pitta' },
        { id: '9', name: 'Quinoa', calories: 220, rasa: 'Sweet', virya: 'Heating', vipaka: 'Sweet', dosha: 'Vata-Kapha' },
        { id: '10', name: 'Spinach', calories: 23, rasa: 'Astringent', virya: 'Cooling', vipaka: 'Pungent', dosha: 'Pitta-Kapha' },
        { id: '11', name: 'Sweet Potato', calories: 180, rasa: 'Sweet', virya: 'Heating', vipaka: 'Sweet', dosha: 'Vata' },
        { id: '12', name: 'Cumin Tea', calories: 5, rasa: 'Pungent, Bitter', virya: 'Cooling', vipaka: 'Pungent', dosha: 'Tridoshic' },
        { id: '13', name: 'Paneer', calories: 265, rasa: 'Sweet', virya: 'Cooling', vipaka: 'Sweet', dosha: 'Vata-Pitta' },
        { id: '14', name: 'Pomegranate', calories: 83, rasa: 'Sweet, Astringent', virya: 'Cooling', vipaka: 'Sweet', dosha: 'Pitta' },
        { id: '15', name: 'Oats', calories: 150, rasa: 'Sweet', virya: 'Cooling', vipaka: 'Sweet', dosha: 'Vata-Pitta' },
    ];

    const filteredFoods = foodDatabase.filter(food =>
        food.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddCustomFood = () => {
        if (!customFood.name || !customFood.calories) {
            toast.info('Please enter food name and calories');
            return;
        }

        const newFood: FoodItem = {
            id: `custom-${Date.now()}`,
            name: customFood.name,
            calories: parseInt(customFood.calories),
            rasa: customFood.rasa,
            virya: customFood.virya,
            vipaka: customFood.vipaka,
            dosha: customFood.dosha
        };

        onSelect(newFood);
        setCustomFood({
            name: '',
            calories: '',
            rasa: 'Sweet',
            virya: 'Neutral',
            vipaka: 'Sweet',
            dosha: 'Tridoshic'
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Add Food Item</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="search" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="search">Search Foods</TabsTrigger>
                        <TabsTrigger value="custom">Add Custom Food</TabsTrigger>
                    </TabsList>

                    {/* Search Tab */}
                    <TabsContent value="search" className="space-y-4 mt-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search for foods..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {filteredFoods.length > 0 ? (
                                filteredFoods.map((food) => (
                                    <div
                                        key={food.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => {
                                            onSelect(food);
                                            onClose();
                                        }}
                                    >
                                        <div>
                                            <h4 className="font-medium text-gray-900">{food.name}</h4>
                                            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                                <span>{food.calories} kcal</span>
                                                <span>•</span>
                                                <span>{food.rasa}</span>
                                                <span>•</span>
                                                <span>{food.virya}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant="outline" className={`
                                                ${food.dosha.includes('Vata') ? 'border-blue-200 bg-blue-50 text-blue-700' : ''}
                                                ${food.dosha.includes('Pitta') ? 'border-red-200 bg-red-50 text-red-700' : ''}
                                                ${food.dosha.includes('Kapha') ? 'border-green-200 bg-green-50 text-green-700' : ''}
                                                ${food.dosha === 'Tridoshic' ? 'border-purple-200 bg-purple-50 text-purple-700' : ''}
                                            `}>
                                                {food.dosha}
                                            </Badge>
                                            <Button size="sm" variant="ghost">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No foods found matching "{searchTerm}"</p>
                                    <p className="text-sm mt-2">Try adding a custom food instead!</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Custom Food Tab */}
                    <TabsContent value="custom" className="space-y-4 mt-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="foodName">Food Name *</Label>
                                <Input
                                    id="foodName"
                                    placeholder="e.g., Khichdi, Chapati, Dal"
                                    value={customFood.name}
                                    onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="calories">Calories (per serving) *</Label>
                                <Input
                                    id="calories"
                                    type="number"
                                    placeholder="e.g., 150"
                                    value={customFood.calories}
                                    onChange={(e) => setCustomFood({ ...customFood, calories: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="rasa">Rasa (Taste)</Label>
                                    <Select value={customFood.rasa} onValueChange={(value) => setCustomFood({ ...customFood, rasa: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Sweet">Sweet</SelectItem>
                                            <SelectItem value="Sour">Sour</SelectItem>
                                            <SelectItem value="Salty">Salty</SelectItem>
                                            <SelectItem value="Pungent">Pungent</SelectItem>
                                            <SelectItem value="Bitter">Bitter</SelectItem>
                                            <SelectItem value="Astringent">Astringent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="virya">Virya (Potency)</Label>
                                    <Select value={customFood.virya} onValueChange={(value) => setCustomFood({ ...customFood, virya: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Heating">Heating</SelectItem>
                                            <SelectItem value="Cooling">Cooling</SelectItem>
                                            <SelectItem value="Neutral">Neutral</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dosha">Balances Dosha</Label>
                                <Select value={customFood.dosha} onValueChange={(value) => setCustomFood({ ...customFood, dosha: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Tridoshic">Tridoshic (All)</SelectItem>
                                        <SelectItem value="Vata">Vata</SelectItem>
                                        <SelectItem value="Pitta">Pitta</SelectItem>
                                        <SelectItem value="Kapha">Kapha</SelectItem>
                                        <SelectItem value="Vata-Pitta">Vata-Pitta</SelectItem>
                                        <SelectItem value="Pitta-Kapha">Pitta-Kapha</SelectItem>
                                        <SelectItem value="Vata-Kapha">Vata-Kapha</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleAddCustomFood}
                                className="w-full bg-[#2E7D32] hover:bg-[#1B5E20]"
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Custom Food
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
