"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, User } from '@/lib/auth-service';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: any) => Promise<void>;
    signup: (data: any) => Promise<void>;
    logout: () => void;
    updateProfile: (data: { name?: string, email?: string, current_password?: string, password?: string, confirm_password?: string }) => Promise<void>;
    refreshWallet: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const refreshWallet = () => {
        window.dispatchEvent(new CustomEvent('refresh-wallet'));
    };

    useEffect(() => {
        async function initAuth() {
            const token = authService.getToken();
            if (token) {
                try {
                    const userData = await authService.getMe(token);
                    setUser(userData);
                } catch (error) {
                    console.error("Auth initialization failed:", error);
                    authService.removeToken();
                }
            }
            setIsLoading(false);
        }

        initAuth();
    }, []);

    const login = async (data: any) => {
        try {
            const response = await authService.login(data);
            authService.setToken(response.authToken);
            const userData = await authService.getMe(response.authToken);
            setUser(userData);
            router.push('/dashboard');
        } catch (error) {
            throw error;
        }
    };

    const signup = async (data: any) => {
        try {
            const response = await authService.signup(data);
            authService.setToken(response.authToken);
            const userData = await authService.getMe(response.authToken);
            setUser(userData);
            router.push('/dashboard');
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        authService.removeToken();
        setUser(null);
        router.push('/auth/login');
    };

    const updateProfile = async (data: any) => {
        const token = authService.getToken();
        if (!token) return;

        try {
            // Update name/email if provided
            if (data.name || data.email) {
                const updatedUser = await authService.updateProfile(token, { name: data.name, email: data.email });
                setUser(updatedUser);
            }

            // Update password if provided
            if (data.password) {
                await authService.updatePassword(token, {
                    current_password: data.current_password,
                    password: data.password,
                    confirm_password: data.confirm_password
                });
            }
        } catch (error) {
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            signup,
            logout,
            updateProfile,
            refreshWallet
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
