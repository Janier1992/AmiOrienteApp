
import { create } from 'zustand';
import { authService } from '@/services/authService';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,
  
  initialize: async () => {
    set({ loading: true });
    try {
      const session = await authService.getSession();
      set({ session, user: session?.user || null });
    } catch (error) {
      console.error("Auth init error:", error);
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const data = await authService.signIn(email, password);
      set({ user: data.user, session: data.session });
      return { success: true };
    } catch (error) {
      return { success: false, error };
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      await authService.signOut();
      set({ user: null, session: null });
    } catch (error) {
      console.error("Sign out error", error);
    }
  }
}));
