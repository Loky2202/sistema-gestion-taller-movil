import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario } from '../types';
import * as db from '../db';
import { getToken } from '../api/client';

interface AuthState {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setOnline: (online: boolean) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isOnline: navigator.onLine,
      login: async (email: string, password: string) => {
        const user = await db.login(email, password);
        set({ user, token: getToken(), isAuthenticated: !!user });
      },
      logout: () => {
        db.logout();
        set({ user: null, token: null, isAuthenticated: false });
      },
      setOnline: (online: boolean) => set({ isOnline: online }),
    }),
    {
      name: 'taller-auth',
    }
  )
);
