import { create } from 'zustand';
import api from './api';

interface User {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  subscriptionTier: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  requiresConsentUpdate: boolean;
  consentVersion: string | null;
  login: (email: string, password: string) => Promise<any>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    companyName?: string;
    taxNumber?: string;
    acceptTerms: boolean;
  }) => Promise<void>;
  loadProfile: () => Promise<void>;
  logout: () => Promise<void>;
  clearConsentUpdate: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  loading: true,
  requiresConsentUpdate: false,
  consentVersion: null,

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const data = res.data.data;
    if (data.requiresMfa) {
      return { requiresMfa: true, mfaToken: data.mfaToken };
    }
    const { user, token } = data;
    // Keep localStorage as fallback during transition period
    if (token) localStorage.setItem('token', token);
    set({
      user,
      token,
      requiresConsentUpdate: !!data.requiresConsentUpdate,
      consentVersion: data.consentVersion || null,
    });
    return null;
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data);
    const { user, token } = res.data.data;
    // Keep localStorage as fallback during transition period
    if (token) localStorage.setItem('token', token);
    set({ user, token });
  },

  loadProfile: async () => {
    try {
      // httpOnly cookie is sent automatically via withCredentials.
      // Also check localStorage for backward compat (transition period).
      const res = await api.get('/auth/profile');
      const localToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      set({ user: res.data.data, token: localToken, loading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, loading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors — clear local state regardless
    }
    localStorage.removeItem('token');
    set({ user: null, token: null, requiresConsentUpdate: false, consentVersion: null });
    window.location.href = '/login';
  },

  clearConsentUpdate: () => {
    set({ requiresConsentUpdate: false, consentVersion: null });
  },
}));
