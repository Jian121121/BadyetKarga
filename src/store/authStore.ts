import { create } from 'zustand';
import { registerUser, loginUser, getUserById, type User } from '../../../services/database/userRepository';
import { saveSession, getSession, clearSession } from '../../../services/database/sessionService';

interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  isLoading: boolean;
  isInitializing: boolean; // true while checking for an existing session on app launch
  error: string | null;

  register: (fullName: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  currentUser: null,
  isLoading: false,
  isInitializing: true,
  error: null,

  register: async (fullName, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await registerUser(fullName, email, password);
      await saveSession(user.id);
      set({ currentUser: user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      set({ error: message, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await loginUser(email, password);
      if (!user) {
        set({ error: 'Invalid email or password.', isLoading: false });
        return;
      }
      await saveSession(user.id);
      set({ currentUser: user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed.';
      set({ error: message, isLoading: false });
    }
  },

  logout: async () => {
    await clearSession();
    set({ currentUser: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),

  // Called once, when the app first launches
  initializeAuth: async () => {
    try {
      const userId = await getSession();
      if (!userId) {
        set({ isInitializing: false });
        return;
      }
      const user = await getUserById(userId);
      if (user) {
        set({ currentUser: user, isAuthenticated: true, isInitializing: false });
      } else {
        // Session pointed to a user that no longer exists — clear it
        await clearSession();
        set({ isInitializing: false });
      }
    } catch {
      set({ isInitializing: false });
    }
  },
}));