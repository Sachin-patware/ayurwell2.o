'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    Users,
    Calendar,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function PractitionerLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Close profile dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Route protection
    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'doctor') {
                router.push('/patient/dashboard');
            }
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5DC]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E7D32]"></div>
            </div>
        );
    }

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
        <div className="min-h-screen bg-[#F5F5DC] flex flex-col">
            {/* Top Navbar */}
            <nav className="bg-white shadow-md border-b-2 border-[#2E7D32]/20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo and Nav Items */}
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center gap-3">
                                <Image
                                    src="/logo.jpg"
                                    alt="AyurWell Logo"
                                    width={40}
                                    height={40}
                                    className="rounded-lg"
                                />
                                <div>
                                    <h1 className="text-2xl font-bold font-serif text-[#2E7D32]">AyurWell</h1>
                                    <span className="text-xs text-gray-500 hidden md:block">Practitioner Portal</span>
                                </div>
                            </div>
                            <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isActive
                                                ? 'border-[#2E7D32] text-[#2E7D32]'
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

                        {/* Profile Dropdown - Desktop */}
                        <div className="hidden sm:ml-6 sm:flex sm:items-center">
                            <div className="ml-3 relative" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-semibold text-gray-900">{user?.name}</span>
                                        <span className="text-xs text-gray-500">Practitioner</span>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] flex items-center justify-center text-white font-bold shadow-md">
                                        {user?.name?.charAt(0) || 'D'}
                                    </div>
                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border-2 border-gray-200 overflow-hidden"
                                        >
                                            {/* Profile Info */}
                                            <div className="bg-gradient-to-r from-[#F1F8F4] to-[#E8F5E9] p-4 border-b-2 border-[#2E7D32]/20">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                        {user?.name?.charAt(0) || 'D'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                                                        <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                                                        <p className="text-xs text-[#2E7D32] font-semibold mt-0.5">Practitioner</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Menu Items */}
                                            <div className="py-2">
                                                <Link
                                                    href="/practitioner/profile"
                                                    onClick={() => setIsProfileOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="bg-blue-100 rounded-lg p-2">
                                                        <User className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">My Profile</p>
                                                        <p className="text-xs text-gray-500">View and edit profile</p>
                                                    </div>
                                                </Link>


                                            </div>

                                            {/* Logout Button */}
                                            <div className="border-t-2 border-gray-100 p-2">
                                                <button
                                                    onClick={() => {
                                                        setIsProfileOpen(false);
                                                        logout();
                                                    }}
                                                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-50 transition-colors rounded-lg"
                                                >
                                                    <div className="bg-red-100 rounded-lg p-2">
                                                        <LogOut className="h-4 w-4 text-red-600" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-semibold text-red-600">Logout</p>
                                                        <p className="text-xs text-gray-500">Sign out of your account</p>
                                                    </div>
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Mobile menu button */}
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
                                                ? 'bg-green-50 border-[#2E7D32] text-[#2E7D32]'
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
                            </div>

                            {/* Mobile Profile Section */}
                            <div className="pt-4 pb-3 border-t border-gray-200 bg-gradient-to-r from-[#F1F8F4] to-[#E8F5E9]">
                                <div className="flex items-center px-4">
                                    <div className="flex-shrink-0">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] flex items-center justify-center text-white font-bold text-lg shadow-md">
                                            {user?.name?.charAt(0) || 'D'}
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-base font-bold text-gray-900">{user?.name}</div>
                                        <div className="text-sm text-gray-600">{user?.email}</div>
                                        <div className="text-xs text-[#2E7D32] font-semibold mt-0.5">Practitioner</div>
                                    </div>
                                </div>
                                <div className="mt-3 space-y-1 px-2">
                                    <Link
                                        href="/practitioner/profile"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/60 transition-colors"
                                    >
                                        <User className="h-5 w-5 text-gray-600" />
                                        <span className="text-base font-medium text-gray-700">My Profile</span>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            logout();
                                        }}
                                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="h-5 w-5 text-red-600" />
                                        <span className="text-base font-medium text-red-600">Logout</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
