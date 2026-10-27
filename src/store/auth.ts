import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario } from '../types';
import * as db from '../db';

interface AuthState {
  user: Usuario | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setOnline: (online: boolean) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isOnline: navigator.onLine,
      login: (email: string, password: string) => {
        const user = db.login(email, password);
        if (user) {
          set({ user, isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      setOnline: (online: boolean) => set({ isOnline: online }),
    }),
    {
      name: 'taller-auth',
    }
  )
);
