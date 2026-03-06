import { create } from 'zustand';
import api from './api';

interface User {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  subscriptionTier: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    companyName?: string;
    taxNumber?: string;
  }) => Promise<void>;
  loadProfile: () => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  loading: true,

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, token } = res.data.data;
    localStorage.setItem('token', token);
    set({ user, token });
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data);
    const { user, token } = res.data.data;
    localStorage.setItem('token', token);
    set({ user, token });
  },

  loadProfile: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        set({ loading: false });
        return;
      }
      const res = await api.get('/auth/profile');
      set({ user: res.data.data, token, loading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
    window.location.href = '/login';
  },
}));
