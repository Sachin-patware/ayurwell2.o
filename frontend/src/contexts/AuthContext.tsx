'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface User {
    uid: string;
    name: string;
    email: string;
    role: 'patient' | 'doctor' | 'admin';
}

interface AuthContextType {
    user: User | null;
    login: (userData: User, token: string) => void;
    logout: () => void;
    refreshUser: (updates: Partial<User>) => void;
    isLoading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = () => {
            const token = Cookies.get('token');
            const userData = Cookies.get('user');

            if (token && userData) {
                try {
                    setUser(JSON.parse(userData));
                } catch (error) {
                    console.error('Failed to parse user data', error);
                    Cookies.remove('token');
                    Cookies.remove('user');
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = (userData: User, token: string) => {
        Cookies.set('token', token, { expires: 7 }); // 7 days
        Cookies.set('user', JSON.stringify(userData), { expires: 7 });
        setUser(userData);
    };

    const logout = () => {
        Cookies.remove('token');
        Cookies.remove('user');
        setUser(null);
        router.push('/login');
    };

    const refreshUser = (updates: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...updates };
            setUser(updatedUser);
            Cookies.set('user', JSON.stringify(updatedUser), { expires: 7 });
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            refreshUser,
            isLoading,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
