
import { create } from 'zustand';
import { deliveryService } from '@/services/deliveryService';
import { supabase } from '@/lib/customSupabaseClient';

export const useDeliveryStore = create((set, get) => ({
  profile: null,
  availableOrders: [],
  currentDelivery: null,
  deliveryHistory: [],
  earnings: {
      today: 0,
      week: 0,
      total: 0
  },
  isOnline: false,
  isLoading: false,
  error: null,
  location: null,

  toggleOnlineStatus: (status) => set({ isOnline: status }),
  
  setLocation: (coords) => set({ location: coords }),

  fetchDashboardData: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch available orders if online
      const available = await deliveryService.getAvailableDeliveries();
      
      // Check for current active delivery
      const current = await deliveryService.getCurrentDelivery(userId);
      
      set({ 
          availableOrders: available || [], 
          currentDelivery: current 
      });

    } catch (error) {
      console.error("Delivery dashboard error:", error);
      set({ error: "Error cargando panel de domiciliario." });
    } finally {
      set({ isLoading: false });
    }
  },

  acceptOrder: async (orderId, userId) => {
      try {
          await deliveryService.acceptDelivery(orderId, userId);
          // Refresh state after accepting
          get().fetchDashboardData(userId);
          return true;
      } catch (error) {
          console.error(error);
          throw error;
      }
  },

  updateDeliveryStatus: async (orderId, newStatus) => {
      try {
          await deliveryService.updateDeliveryStatus(orderId, newStatus);
          // Optimistic update
          const current = get().currentDelivery;
          if (current && current.order_id === orderId) {
              set({ currentDelivery: { ...current, status: newStatus }});
          }
          return true;
      } catch (error) {
           console.error(error);
           throw error;
      }
  }
}));
