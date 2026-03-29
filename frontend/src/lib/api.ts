import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor — attach access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${token}`,
          };
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refresh_token;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefresh } = data.data;
        useAuthStore.getState().setTokens(access_token, newRefresh);
        processQueue(null, access_token);

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${access_token}`,
        };
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Auth
export const authApi = {
  signup: (data: { email: string; password: string; company_name: string; country: string }) =>
    apiClient.post('/api/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/api/auth/login', data),
  refresh: (refresh_token: string) =>
    apiClient.post('/api/auth/refresh', { refresh_token }),
  logout: (refresh_token: string) =>
    apiClient.post('/api/auth/logout', { refresh_token }),
};

// Expenses
export const expenseApi = {
  submit: (data: object) => apiClient.post('/api/expenses', data),
  getMyExpenses: () => apiClient.get('/api/expenses/me'),
  getPending: () => apiClient.get('/api/expenses/pending'),
  getAll: (params?: object) => apiClient.get('/api/expenses', { params }),
  approve: (id: string, comment?: string) =>
    apiClient.patch(`/api/expenses/${id}/approve`, { comment }),
  reject: (id: string, comment: string) =>
    apiClient.patch(`/api/expenses/${id}/reject`, { comment }),
  ocr: (image_base64: string, mime_type: string) =>
    apiClient.post('/api/expenses/ocr', { image_base64, mime_type }),
  getAudit: (id: string) => apiClient.get(`/api/expenses/${id}/audit`),
};

// Users
export const userApi = {
  getAll: () => apiClient.get('/api/users'),
  create: (data: object) => apiClient.post('/api/users', data),
  updateRole: (id: string, role: string) => apiClient.patch(`/api/users/${id}/role`, { role }),
  assignManager: (id: string, data: { manager_id?: string; is_manager_approver?: boolean }) =>
    apiClient.patch(`/api/users/${id}/manager`, data),
};

// Policies
export const policyApi = {
  create: (data: object) => apiClient.post('/api/approvals/policies', data),
  getAll: () => apiClient.get('/api/approvals/policies'),
};

// Currencies
export const currencyApi = {
  getRates: (base?: string) => apiClient.get('/api/currencies', { params: { base } }),
};
