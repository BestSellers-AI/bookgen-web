"use client";

const API_URL = process.env.NEXT_PUBLIC_XANO_AUTH_API_URL;
const ACCOUNT_API_URL = process.env.NEXT_PUBLIC_XANO_ACCOUNT_API_URL;

export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    created_at: number;
}

export interface AuthResponse {
    authToken: string;
}

export const authService = {
    async signup(data: any): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Signup failed');
        }

        return response.json();
    },

    async login(data: any): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }

        return response.json();
    },

    async getMe(token: string): Promise<User> {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user');
        }

        return response.json();
    },

    setToken(token: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token);
        }
    },

    getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('auth_token');
        }
        return null;
    },

    removeToken() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
        }
    },

    async updateProfile(token: string, data: { name?: string, email?: string }): Promise<User> {
        const response = await fetch(`${ACCOUNT_API_URL}/user/edit_profile`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Update profile failed');
        }

        return response.json();
    },

    async updatePassword(token: string, data: { current_password?: string, password: string, confirm_password: string }): Promise<void> {
        const response = await fetch(`${API_URL}/reset/update_password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Update password failed');
        }
    },

    async requestPasswordReset(email: string): Promise<void> {
        const baseUrl = "https://x8ki-letl-twmt.n7.xano.io/api:p1yFAeVg";
        const url = new URL(`${baseUrl}/reset/request-reset-link`);
        url.searchParams.append('email', email);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to request password reset');
        }
    }
};
