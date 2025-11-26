import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        label: string;
        positive?: boolean;
    };
    color?: "blue" | "green" | "purple" | "orange";
}

export function StatsCard({ title, value, icon: Icon, description, trend, color = "blue" }: StatsCardProps) {
    const colorStyles = {
        blue: "bg-blue-100 text-blue-600",
        green: "bg-green-100 text-green-600",
        purple: "bg-purple-100 text-purple-600",
        orange: "bg-orange-100 text-orange-600",
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
                        {description && (
                            <p className="text-sm text-gray-500 mt-1">{description}</p>
                        )}
                        {trend && (
                            <div className={`flex items-center mt-2 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                                <span className="font-medium">{trend.positive ? '+' : ''}{trend.value}%</span>
                                <span className="text-gray-500 ml-1">{trend.label}</span>
                            </div>
                        )}
                    </div>
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${colorStyles[color]}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
