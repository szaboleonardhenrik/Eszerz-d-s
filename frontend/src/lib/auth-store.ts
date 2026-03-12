import { create } from 'zustand';
import api from './api';

interface User {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  subscriptionTier: string;
  role?: string;
  notifyOnSign?: boolean;
  notifyOnDecline?: boolean;
  notifyOnExpire?: boolean;
  notifyOnComment?: boolean;
  notifyOnComplete?: boolean;
  notifyMarketing?: boolean;
  emailDigest?: string;
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
  token: null,
  loading: true,
  requiresConsentUpdate: false,
  consentVersion: null,

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const data = res.data.data;
    if (data.requiresMfa) {
      return { requiresMfa: true, mfaToken: data.mfaToken };
    }
    const { user } = data;
    set({
      user,
      token: null,
      requiresConsentUpdate: !!data.requiresConsentUpdate,
      consentVersion: data.consentVersion || null,
    });
    return null;
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data);
    const { user } = res.data.data;
    set({ user, token: null });
  },

  loadProfile: async () => {
    try {
      // httpOnly cookie is sent automatically via withCredentials.
      const res = await api.get('/auth/profile');
      const profile = res.data.data;
      // If consentVersion is missing (e.g. Google OAuth new user), prompt consent modal
      const needsConsent = !profile.consentVersion;
      set({
        user: profile,
        token: null,
        loading: false,
        requiresConsentUpdate: needsConsent,
        consentVersion: profile.consentVersion || null,
      });
    } catch {
      set({ user: null, token: null, loading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors — clear local state regardless
    }
    set({ user: null, token: null, requiresConsentUpdate: false, consentVersion: null });
    window.location.href = '/login';
  },

  clearConsentUpdate: () => {
    set({ requiresConsentUpdate: false, consentVersion: null });
  },
}));
