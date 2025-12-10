'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Calendar,
    MessageSquare,
    Settings,
    LogOut,
    Menu,
    X,
    Utensils
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NavItem {
    name: string;
    href: string;
    icon: any;
    roles: string[];
}

const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['practitioner', 'patient'] },
    { name: 'Patients', href: '/patients', icon: Users, roles: ['practitioner'] },
    { name: 'Appointments', href: '/appointments', icon: Calendar, roles: ['practitioner', 'patient'] },
    { name: 'Chat', href: '/chat', icon: MessageSquare, roles: ['practitioner', 'patient'] },
    { name: 'Admin', href: '/admin', icon: Settings, roles: ['admin', 'practitioner'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const filteredNav = navigation.filter(item =>
        user && item.roles.includes(user.role)
    );

    return (
        <div className="min-h-screen bg-[#E9F7EF]">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div className="flex items-center space-x-2">
                            <Utensils className="h-8 w-8 text-[#2E7D32]" />
                            <span className="text-xl font-bold text-[#2E7D32]">Ayurwell</span>
                        </div>
                        <button
                            className="lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* User info */}
                    {user && (
                        <div className="p-4 border-b bg-[#E9F7EF]">
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                        </div>
                    )}

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {filteredNav.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                                            ? 'bg-[#2E7D32] text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }
                  `}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={logout}
                        >
                            <LogOut className="h-5 w-5 mr-3" />
                            Logout
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {children}
            </div>
        </div>
    );
}
