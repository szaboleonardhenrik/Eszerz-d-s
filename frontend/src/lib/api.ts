import axios from 'axios';
import { captureException } from './sentry';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Send httpOnly cookies with every request
});

// Fallback: if localStorage token exists (transition period), send as Bearer header
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    if (error.response?.status >= 500) {
      captureException(error, { url: error.config?.url, method: error.config?.method });
    }
    return Promise.reject(error);
  },
);

export default api;
