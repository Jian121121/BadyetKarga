import { create } from 'zustand';
import {
  getUserById,
  loginUser,
  upsertGoogleUser,
  upsertLocalEmailUser,
  updateUserAvatar,
  changeUserPassword,
  type User,
} from '../services/database/userRepository';
import {
  saveSession,
  getSession,
  clearSession,
  setRememberedEmail,
  getRememberedEmail,
  getRememberMePreference,
} from '../services/database/sessionService';
import type { GoogleIdentity } from '../services/auth/googleAuth';
import {
  firebaseRegister,
  firebaseLogin,
  firebaseSignOut,
  firebaseChangePassword,
  firebaseSendPasswordReset,
} from '../services/auth/firebaseAuthService';
import { useHouseholdStore } from './householdStore';

interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;

  /** Creates Firebase + local account. Email is verified with a 6-digit code beforehand. */
  register: (fullName: string, email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  loginWithGoogle: (identity: GoogleIdentity, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateAvatar: (uri: string | null) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
  getRememberedLogin: () => Promise<{ email: string; rememberMe: boolean }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  currentUser: null,
  isLoading: false,
  isInitializing: true,
  error: null,

  register: async (fullName, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await firebaseRegister(fullName, email, password);
      await upsertLocalEmailUser(profile.fullName, profile.email, password);
      set({ isLoading: false });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      // If Firebase succeeded earlier but local already exists, still treat as ok path via message.
      set({ error: message, isLoading: false });
      return false;
    }
  },

  login: async (email, password, rememberMe = true) => {
    set({ isLoading: true, error: null });
    try {
      let user: User | null = null;

      try {
        const profile = await firebaseLogin(email, password);
        user = await upsertLocalEmailUser(profile.fullName, profile.email, password);
      } catch (firebaseErr) {
        // Legacy local-only accounts (created before Firebase) can still sign in.
        const message = firebaseErr instanceof Error ? firebaseErr.message : '';
        if (/not configured|Invalid Firebase API key/i.test(message)) {
          throw firebaseErr;
        }
        user = await loginUser(email, password);
        if (!user) {
          set({
            error: message || 'Invalid email or password.',
            isLoading: false,
          });
          return;
        }
      }

      await saveSession(user.id, rememberMe);
      // Email is persisted only when Remember Me is checked.
      await setRememberedEmail(rememberMe ? user.email : null);
      useHouseholdStore.getState().clearSettings();
      set({ currentUser: user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed.';
      set({ error: message, isLoading: false });
    }
  },

  sendPasswordReset: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await firebaseSendPasswordReset(email);
      set({ isLoading: false });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send reset email.';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  loginWithGoogle: async (identity, rememberMe = true) => {
    set({ isLoading: true, error: null });
    try {
      const user = await upsertGoogleUser(identity);
      await saveSession(user.id, rememberMe);
      await setRememberedEmail(rememberMe ? user.email : null);
      useHouseholdStore.getState().clearSettings();
      set({ currentUser: user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed.';
      set({ error: message, isLoading: false });
    }
  },

  logout: async () => {
    try {
      const keepEmail = await getRememberMePreference();
      await firebaseSignOut();
      await clearSession();
      // Keep saved email only if the user previously opted into Remember Me.
      if (!keepEmail) await setRememberedEmail(null);
    } finally {
      useHouseholdStore.getState().clearSettings();
      set({ currentUser: null, isAuthenticated: false });
    }
  },

  updateAvatar: async (uri) => {
    const user = get().currentUser;
    if (!user) return;
    const updated = await updateUserAvatar(user.id, uri);
    if (updated) set({ currentUser: updated });
    try {
      const { useFamilyStore } = await import('./familyStore');
      const family = useFamilyStore.getState();
      let members = family.members;
      if (members.length === 0) {
        await family.loadMembers(user.id);
        members = useFamilyStore.getState().members;
      }
      const self = members.find((m) => m.relationship === 'Self');
      if (self) {
        await family.updateMember(self.id, user.id, { avatarUri: uri });
      }
    } catch {
      // Non-fatal — profile photo still saved on user.
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    const user = get().currentUser;
    if (!user) throw new Error('Not signed in.');
    if (user.authProvider !== 'google') {
      try {
        await firebaseChangePassword(user.email, currentPassword, newPassword);
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        const allowLocalFallback =
          /not configured|Invalid Firebase API key|Invalid email or password/i.test(message);
        if (!allowLocalFallback) throw err instanceof Error ? err : new Error(message);
      }
    }
    await changeUserPassword(user.id, currentPassword, newPassword);
  },

  clearError: () => set({ error: null }),

  getRememberedLogin: async () => {
    const rememberMe = await getRememberMePreference();
    if (!rememberMe) {
      // Drop any leftover email from older sessions when Remember Me is off.
      await setRememberedEmail(null);
      return { email: '', rememberMe: false };
    }
    const email = (await getRememberedEmail()) ?? '';
    return { email, rememberMe: true };
  },

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
        await clearSession();
        set({ isInitializing: false });
      }
    } catch {
      set({ isInitializing: false });
    }
  },
}));
