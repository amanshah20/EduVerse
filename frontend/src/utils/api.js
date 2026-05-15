import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      console.error('🔴 401 Unauthorized:', {
        url: err.config?.url,
        method: err.config?.method,
        message: err.response?.data?.message,
        hasToken: !!localStorage.getItem('token'),
        user: JSON.parse(localStorage.getItem('user') || '{}')
      });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
