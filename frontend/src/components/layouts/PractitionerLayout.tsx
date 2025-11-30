'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    Users,
    Calendar,
    FileText,
    MessageSquare,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function PractitionerLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Route protection: redirect if not logged in or not a doctor
    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'doctor') {
                router.push('/patient/dashboard'); // Redirect to patient dashboard if not doctor
            }
        }
    }, [user, isLoading, router]);

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5DC]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E7D32]"></div>
            </div>
        );
    }

    // Don't render if not authenticated
    if (!user || user.role !== 'doctor') {
        return null;
    }

    const navItems = [
        { href: '/practitioner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/practitioner/patients', label: 'Patients', icon: Users },
        { href: '/practitioner/appointments', label: 'Appointments', icon: Calendar },
        { href: '/practitioner/diet-plans', label: 'Diet Plans', icon: FileText },
    ];

    return (
        <div className="min-h-screen bg-[#F5F5DC] flex">
            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.aside
                        initial={{ x: -250 }}
                        animate={{ x: 0 }}
                        exit={{ x: -250 }}
                        className="fixed inset-y-0 left-0 z-50 w-64 bg-[#A2B38B] text-white shadow-lg lg:static"
                    >
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-[#8F9E7A]">
                                <h1 className="text-2xl font-bold font-serif">AyurWell</h1>
                                <p className="text-sm text-[#E9F7EF] mt-1">Practitioner Portal</p>
                            </div>

                            <nav className="flex-1 p-4 space-y-2">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link key={item.href} href={item.href}>
                                            <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                                ? 'bg-[#E07A5F] text-white shadow-md'
                                                : 'hover:bg-[#8F9E7A] text-[#F5F5DC]'
                                                }`}>
                                                <item.icon className="h-5 w-5" />
                                                <span className="font-medium">{item.label}</span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="p-4 border-t border-[#8F9E7A]">
                                <div className="flex items-center space-x-3 px-4 py-3 mb-2">
                                    <div className="h-8 w-8 rounded-full bg-[#E07A5F] flex items-center justify-center font-bold">
                                        {user?.name?.charAt(0) || 'D'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{user?.name}</p>
                                        <p className="text-xs text-[#E9F7EF] truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-[#F5F5DC] hover:bg-[#8F9E7A] hover:text-white"
                                    onClick={logout}
                                >
                                    <LogOut className="h-5 w-5 mr-3" />
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden bg-[#A2B38B] text-white p-4 flex items-center justify-between shadow-md">
                    <h1 className="text-xl font-bold">AyurWell</h1>
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
