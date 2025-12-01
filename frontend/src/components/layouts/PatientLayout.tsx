'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    FileText,
    Activity,
    Calendar,
    MessageSquare,
    LogOut,
    Menu,
    X,
    ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Route protection: redirect if not logged in or not a patient
    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'patient') {
                router.push('/practitioner/dashboard'); // Redirect to practitioner dashboard if not patient
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
    if (!user || user.role !== 'patient') {
        return null;
    }

    const navItems = [
        { href: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/patient/diet-plan', label: 'My Diet', icon: FileText },
        { href: '/patient/assessment', label: 'Assessment', icon: ClipboardList },
        { href: '/patient/track', label: 'Track Progress', icon: Activity },
        { href: '/patient/appointments', label: 'Appointments', icon: Calendar },
    ];

    return (
        <div className="min-h-screen bg-[#F5F5DC] flex flex-col">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-[#D7D4C8] sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <h1 className="text-2xl font-bold font-serif text-[#2E7D32]">AyurWell</h1>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isActive
                                                ? 'border-[#E07A5F] text-[#E07A5F]'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                                }`}
                                        >
                                            <item.icon className="h-4 w-4 mr-2" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:items-center">
                            <div className="ml-3 relative flex items-center space-x-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                                    <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={logout}
                                    className="text-gray-500 hover:text-[#E07A5F]"
                                >
                                    <LogOut className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="-mr-2 flex items-center sm:hidden">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="sm:hidden bg-white border-t border-gray-200"
                        >
                            <div className="pt-2 pb-3 space-y-1">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive
                                                ? 'bg-[#FFF3E0] border-[#E07A5F] text-[#E07A5F]'
                                                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                                                }`}
                                        >
                                            <div className="flex items-center">
                                                <item.icon className="h-5 w-5 mr-3" />
                                                {item.label}
                                            </div>
                                        </Link>
                                    );
                                })}
                                <div className="pt-4 pb-3 border-t border-gray-200">
                                    <div className="flex items-center px-4">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-[#E07A5F] flex items-center justify-center text-white font-bold">
                                                {user?.name?.charAt(0)}
                                            </div>
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-base font-medium text-gray-800">{user?.name}</div>
                                            <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-1">
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                                            onClick={logout}
                                        >
                                            <LogOut className="h-5 w-5 mr-3" />
                                            Sign out
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
