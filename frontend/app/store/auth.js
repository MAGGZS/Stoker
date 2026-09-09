import { create } from 'zustand';
import { api } from '../lib/api';
import { clearTokens, getAccessToken, setTokens } from '../lib/session';

export const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: true,

  initAuth: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ user: null, isLoading: false });
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, isLoading: false });
    }
  },

  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    setTokens(data.accessToken, data.refreshToken);
    set({ user: data.user, isLoading: false });
    return data;
  },

  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setTokens(data.accessToken, data.refreshToken);
    set({ user: data.user, isLoading: false });
    return data;
  },

  logout: () => {
    clearTokens();
    set({ user: null, isLoading: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
}));

