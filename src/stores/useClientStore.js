
import { create } from 'zustand';
import { customerService } from '@/services/customerService';
import { supabase } from '@/lib/customSupabaseClient';

export const useClientStore = create((set, get) => ({
  profile: null,
  activeOrders: [],
  orderHistory: [],
  addresses: [],
  isLoading: false,
  error: null,

  setProfile: (profile) => set({ profile }),

  fetchClientData: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Get Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) set({ profile });

      // 2. Get Active Orders (Parallel fetch could be optimized here)
      const activeOrders = await customerService.getActiveOrders(userId);
      set({ activeOrders });

    } catch (error) {
      console.error("Client data fetch error:", error);
      set({ error: "Error cargando datos del cliente." });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAddresses: async (userId) => {
    try {
        const { data } = await supabase.from('user_addresses').select('*').eq('user_id', userId);
        set({ addresses: data || [] });
    } catch (err) {
        console.error(err);
    }
  },
  
  refreshOrders: async (userId) => {
      const activeOrders = await customerService.getActiveOrders(userId);
      set({ activeOrders });
  }
}));
