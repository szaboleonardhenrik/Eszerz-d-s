import axios from 'axios';
import { captureException } from './sentry';

// Maintenance mode state — shared across the app
let maintenanceListeners: Array<(msg: string | null) => void> = [];
let maintenanceMessage: string | null = null;

export function onMaintenanceChange(listener: (msg: string | null) => void) {
  maintenanceListeners.push(listener);
  return () => {
    maintenanceListeners = maintenanceListeners.filter((l) => l !== listener);
  };
}

export function getMaintenanceMessage() {
  return maintenanceMessage;
}

function setMaintenance(msg: string | null) {
  maintenanceMessage = msg;
  maintenanceListeners.forEach((l) => l(msg));
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Send httpOnly cookies with every request
});

api.interceptors.response.use(
  (res) => {
    // Clear maintenance if a request succeeds
    if (maintenanceMessage) setMaintenance(null);
    return res;
  },
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Don't redirect on auth endpoints — let the login/register page handle the error
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/verify');
      if (!isAuthEndpoint) {
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 503 && error.response?.data?.error?.code === 'MAINTENANCE') {
      setMaintenance(error.response.data.error.message);
    }
    if (error.response?.status >= 500 && error.response?.status !== 503) {
      captureException(error, { url: error.config?.url, method: error.config?.method });
    }
    return Promise.reject(error);
  },
);

export default api;
