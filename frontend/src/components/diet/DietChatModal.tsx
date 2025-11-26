'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { useRouter } from 'next/navigation';

interface Message {
    role: 'bot' | 'user';
    content: string;
}

interface DietChatModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDietGenerated?: () => void;
}

export function DietChatModal({ open, onOpenChange, onDietGenerated }: DietChatModalProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0);
    const [userData, setUserData] = useState({
        age: '',
        gender: '',
        prakriti: '',
        vikriti: ''
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (open) {
            // Reset and start conversation
            setMessages([
                {
                    role: 'bot',
                    content: '🙏 Namaste! I\'m your AI Ayurvedic Nutritionist. I\'ll help you create a personalized diet plan based on Ayurvedic principles. Let\'s start with a few questions.'
                },
                {
                    role: 'bot',
                    content: 'First, may I know your age?'
                }
            ]);
            setStep(0);
            setUserData({ age: '', gender: '', prakriti: '', vikriti: '' });
        }
    }, [open]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInput('');
        setLoading(true);

        // Simulate thinking delay
        await new Promise(resolve => setTimeout(resolve, 800));

        let botResponse = '';
        let nextStep = step + 1;

        switch (step) {
            case 0: // Age
                setUserData(prev => ({ ...prev, age: userMessage }));
                botResponse = 'Great! And what is your gender? (Male/Female/Other)';
                break;

            case 1: // Gender
                setUserData(prev => ({ ...prev, gender: userMessage }));
                botResponse = 'Perfect! Now, let\'s determine your Prakriti (body constitution). Which best describes you?\n\n• Vata (Air/Ether) - Light frame, creative, energetic\n• Pitta (Fire/Water) - Medium build, focused, warm\n• Kapha (Earth/Water) - Sturdy build, calm, steady\n• Vata-Pitta, Pitta-Kapha, Vata-Kapha (Dual)\n• Tridosha (Balanced)';
                break;

            case 2: // Prakriti
                setUserData(prev => ({ ...prev, prakriti: userMessage }));
                botResponse = 'Excellent! Finally, what is your current Vikriti (imbalance)?\n\n• Vata - Anxiety, dryness, bloating\n• Pitta - Acidity, heat, anger\n• Kapha - Lethargy, weight gain, congestion';
                break;

            case 3: // Vikriti - Generate diet
                setUserData(prev => ({ ...prev, vikriti: userMessage }));
                botResponse = '✨ Perfect! I have all the information I need. Let me generate your personalized Ayurvedic diet plan...';
                setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);

                // Generate diet plan
                await generateDietPlan({ ...userData, vikriti: userMessage });
                setLoading(false);
                return;
        }

        setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
        setStep(nextStep);
        setLoading(false);
    };

    const generateDietPlan = async (data: typeof userData) => {
        try {
            const userId = user?.uid;
            if (!userId) {
                setMessages(prev => [...prev, {
                    role: 'bot',
                    content: '❌ Sorry, I couldn\'t identify your user account. Please try logging in again.'
                }]);
                return;
            }

            // First, update patient assessment
            await api.put(`/patients/${userId}`, {
                assessment: {
                    age: parseInt(data.age),
                    gender: data.gender,
                    prakriti: data.prakriti,
                    vikriti: data.vikriti
                }
            });

            // Then generate diet plan
            const response = await api.post('/generate-diet', {
                patient_id: userId
            });

            const dietPlan = response.data.diet_plan;

            setMessages(prev => [...prev, {
                role: 'bot',
                content: `✅ Your personalized ${dietPlan.doshaImbalance} balancing diet plan has been created!\n\n📋 **Key Recommendations:**\n• ${dietPlan.recommendedFoods.slice(0, 3).join(', ')}\n\n🚫 **Foods to Avoid:**\n• ${dietPlan.avoidFoods.slice(0, 3).join(', ')}\n\n💡 **Rationale:** ${dietPlan.rationale}\n\nYour complete 7-day meal plan is ready!`
            }]);

            setMessages(prev => [...prev, {
                role: 'bot',
                content: '🎉 Would you like to view your complete diet plan now?'
            }]);

            setStep(4); // Final step

            // Notify parent component
            if (onDietGenerated) {
                onDietGenerated();
            }

        } catch (error: any) {
            console.error('Error generating diet:', error);
            setMessages(prev => [...prev, {
                role: 'bot',
                content: '❌ Sorry, I encountered an error while generating your diet plan. Please try again or contact support.'
            }]);
        }
    };

    const handleViewPlan = () => {
        onOpenChange(false);
        router.push('/patient/diet-plan');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleSend();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="h-5 w-5 text-[#2E7D32]" />
                        AI Ayurvedic Nutritionist
                    </DialogTitle>
                </DialogHeader>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                        ? 'bg-[#2E7D32] text-white'
                                        : 'bg-gray-100 text-gray-900'
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-line">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-2xl px-4 py-3">
                                <Loader2 className="h-5 w-5 animate-spin text-[#2E7D32]" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-6 py-4 border-t bg-gray-50">
                    {step < 4 ? (
                        <div className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your answer..."
                                disabled={loading}
                                className="flex-1"
                            />
                            <Button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="bg-[#2E7D32] hover:bg-[#1B5E20]"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                onClick={handleViewPlan}
                                className="flex-1 bg-[#2E7D32] hover:bg-[#1B5E20]"
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                View Complete Diet Plan
                            </Button>
                            <Button
                                onClick={() => onOpenChange(false)}
                                variant="outline"
                            >
                                Close
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
