import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Lazy import to avoid circular deps
function getAuthStore() {
  return import('@/store/authStore').then((m) => m.useAuthStore.getState());
}

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const store = await getAuthStore();
    if (store.accessToken) {
      config.headers.Authorization = `Bearer ${store.accessToken}`;
    }
    if (store.activeAcademy?.id) {
      config.headers['x-academy-id'] = store.activeAcademy.id;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

apiClient.interceptors.response.use(
  (response) => {
    // Backend wraps every response in { success, data, meta, error }
    const body = response.data;
    if (body && typeof body === 'object' && 'success' in body) {
      return body.data;
    }
    return body;
  },
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const store = await getAuthStore();
        if (!store.refreshToken) throw new Error('No refresh token');
        await store.refreshTokens();
        const newStore = await getAuthStore();
        const token = newStore.accessToken!;
        refreshQueue.forEach((cb) => cb(token));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch {
        refreshQueue = [];
        const store = await getAuthStore();
        store.logout();
        window.location.href = '/login';
        return Promise.reject({ code: 'UNAUTHORIZED', message: 'Session expired' });
      } finally {
        isRefreshing = false;
      }
    }

    const errData = (error.response?.data as { error?: { code: string; message: string } })?.error;
    return Promise.reject(errData || { code: 'NETWORK_ERROR', message: error.message || 'Network error' });
  }
);

export default apiClient;
