import axios from 'axios';
import { captureException } from './sentry';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Send httpOnly cookies with every request
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    if (error.response?.status >= 500) {
      captureException(error, { url: error.config?.url, method: error.config?.method });
    }
    return Promise.reject(error);
  },
);

export default api;
