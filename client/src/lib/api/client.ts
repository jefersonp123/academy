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
let refreshQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: any) => void }> = [];

function processQueue(error: Error | null, token: string | null) {
  refreshQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  refreshQueue = [];
}

apiClient.interceptors.response.use(
  (response) => {
    // Backend wraps every response in { success, data, meta, error }
    const body = response.data;
    if (body && typeof body === 'object' && 'success' in body) {
      if (body.meta !== null && typeof body.meta !== 'undefined') {
        return { data: body.data, meta: body.meta };
      }
      return body.data;
    }
    return body;
  },
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Wait for the refresh to complete
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(original));
            },
            reject: () => {
              reject({ code: 'UNAUTHORIZED', message: 'Session expired' });
            },
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
        processQueue(null, token);
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch (refreshError) {
        // Refresh failed - force logout and redirect
        processQueue(refreshError as Error, null);
        const store = await getAuthStore();
        store.logout();
        // Clear localStorage to prevent stale tokens
        localStorage.removeItem('club-auth');
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
