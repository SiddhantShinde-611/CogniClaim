import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthStore {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  isAuthenticated: boolean;
  login: (user: User, access_token: string, refresh_token: string) => void;
  logout: () => void;
  setTokens: (access_token: string, refresh_token: string) => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      isAuthenticated: false,

      login: (user, access_token, refresh_token) => {
        set({ user, access_token, refresh_token, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, access_token: null, refresh_token: null, isAuthenticated: false });
      },

      setTokens: (access_token, refresh_token) => {
        set({ access_token, refresh_token });
      },

      updateUser: (partial) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...partial } });
        }
      },
    }),
    {
      name: 'cogniclaim-auth',
      partialize: (state) => ({
        user: state.user,
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
