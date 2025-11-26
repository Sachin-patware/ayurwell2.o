'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, X, GripVertical } from 'lucide-react';
import { FoodSearchModal } from './FoodSearchModal';

interface FoodItem {
    id: string;
    name: string;
    calories: number;
    rasa: string;
    dosha: string;
}

interface Meal {
    id: string;
    name: string;
    items: FoodItem[];
}

interface MealEditorProps {
    meals: Meal[];
    onChange: (meals: Meal[]) => void;
}

export function MealEditor({ meals, onChange }: MealEditorProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeMealId, setActiveMealId] = useState<string | null>(null);

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const { source, destination } = result;
        const newMeals = [...meals];

        const sourceMealIndex = newMeals.findIndex(m => m.id === source.droppableId);
        const destMealIndex = newMeals.findIndex(m => m.id === destination.droppableId);

        const sourceMeal = newMeals[sourceMealIndex];
        const destMeal = newMeals[destMealIndex];

        const [removed] = sourceMeal.items.splice(source.index, 1);
        destMeal.items.splice(destination.index, 0, removed);

        onChange(newMeals);
    };

    const handleAddItem = (item: any) => {
        if (!activeMealId) return;

        const newMeals = [...meals];
        const mealIndex = newMeals.findIndex(m => m.id === activeMealId);

        // Add unique ID for the list item
        const newItem = { ...item, id: `${item.id}-${Date.now()}` };
        newMeals[mealIndex].items.push(newItem);

        onChange(newMeals);
    };

    const handleRemoveItem = (mealId: string, index: number) => {
        const newMeals = [...meals];
        const mealIndex = newMeals.findIndex(m => m.id === mealId);
        newMeals[mealIndex].items.splice(index, 1);
        onChange(newMeals);
    };

    return (
        <div className="space-y-6">
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {meals.map((meal) => (
                        <Droppable key={meal.id} droppableId={meal.id}>
                            {(provided) => (
                                <Card className="border-l-4 border-l-[#A2B38B]">
                                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                        <CardTitle className="text-lg capitalize">{meal.name}</CardTitle>
                                        <span className="text-sm text-gray-500">
                                            {meal.items.reduce((acc, item) => acc + item.calories, 0)} kcal
                                        </span>
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="min-h-[100px] space-y-2"
                                        >
                                            {meal.items.map((item, index) => (
                                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="flex items-center justify-between p-2 bg-white border rounded-md shadow-sm group"
                                                        >
                                                            <div className="flex items-center">
                                                                <GripVertical className="h-4 w-4 text-gray-400 mr-2" />
                                                                <div>
                                                                    <p className="text-sm font-medium">{item.name}</p>
                                                                    <p className="text-xs text-gray-500">{item.calories} kcal</p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => handleRemoveItem(meal.id, index)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className="w-full mt-2 text-[#2E7D32] hover:text-[#1B5E20] hover:bg-[#E9F7EF] border border-dashed border-[#A2B38B]"
                                            onClick={() => {
                                                setActiveMealId(meal.id);
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Add Item
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>

            <FoodSearchModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleAddItem}
            />
        </div>
    );
}
