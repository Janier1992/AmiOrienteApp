import { create } from 'zustand';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * STORE ESPECÍFICO PARA MÓDULO HOTEL
 * Gestiona habitaciones, reservas y huéspedes.
 */
export const useHotelStore = create((set, get) => ({
    rooms: [],
    reservations: [],
    guests: [],
    isLoadingRooms: false,
    isLoadingReservations: false,
    error: null,

    // --- ACCIONES DE HABITACIONES ---
    fetchRooms: async (storeId) => {
        if (!storeId) return;
        set({ isLoadingRooms: true });
        try {
            const { data, error } = await supabase
                .from('hotel_rooms')
                .select('*')
                .eq('store_id', storeId)
                .order('room_number', { ascending: true }); // Assumes room_number exists or created_at

            if (error) throw error;
            set({ rooms: data || [] });
        } catch (err) {
            console.error('Error fetching rooms:', err);
            set({ error: err.message });
        } finally {
            set({ isLoadingRooms: false });
        }
    },

    toggleRoomStatus: async (roomId, currentStatus) => {
        const states = ['available', 'occupied', 'cleaning', 'maintenance'];
        const nextIdx = (states.indexOf(currentStatus) + 1) % states.length;
        const nextStatus = states[nextIdx];

        try {
            const { error } = await supabase
                .from('hotel_rooms')
                .update({ status: nextStatus })
                .eq('id', roomId);

            if (error) throw error;

            // Optimistic update
            set(state => ({
                rooms: state.rooms.map(r => r.id === roomId ? { ...r, status: nextStatus } : r)
            }));
        } catch (err) {
            console.error('Error toggling room status:', err);
            // Revert or show toast (handled by UI usually)
        }
    },

    addRoom: async (roomData) => {
        try {
            const { data, error } = await supabase
                .from('hotel_rooms')
                .insert(roomData)
                .select()
                .single();

            if (error) throw error;

            set(state => ({ rooms: [...state.rooms, data] }));
            return data;
        } catch (err) {
            throw err;
        }
    },

    // --- ACCIONES DE RESERVAS ---
    // (Simplificado por ahora, se puede expandir)
    fetchReservations: async (storeId) => {
        // Implementación futura o migración de lógica existente
    }
}));
