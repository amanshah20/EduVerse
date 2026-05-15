import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

// Separate axios instance for token verification to avoid interceptor recursion
const verifyApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

verifyApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const originalRequest = err.config;
      
      if (!isRefreshing) {
        isRefreshing = true;
        const token = localStorage.getItem('token');
        
        if (token) {
          // Try to verify token one more time using separate axios instance
          return verifyApi.get('/auth/me')
            .then(res => {
              isRefreshing = false;
              processQueue(null, token);
              return api(originalRequest);
            })
            .catch(refreshErr => {
              isRefreshing = false;
              processQueue(refreshErr, null);
              console.error('🔴 Token verification failed:', {
                url: originalRequest?.url,
                message: err.response?.data?.message,
                hasToken: !!token
              });
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
              return Promise.reject(refreshErr);
            });
        } else {
          isRefreshing = false;
          window.location.href = '/login';
        }
      } else {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => api(originalRequest));
      }
    }
    return Promise.reject(err);
  }
);

export default api;
