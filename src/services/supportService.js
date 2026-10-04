
import { supabase } from '@/lib/customSupabaseClient';

export const supportService = {
    async crearTicket({ storeId, subject, message }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Debes iniciar sesión para crear un ticket.');

        const { data, error } = await supabase
            .from('support_tickets')
            .insert({
                created_by: user.id,
                store_id: storeId || null,
                subject,
                message,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async obtenerMisTickets(userId) {
        const { data, error } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('created_by', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[supportService] Error obteniendo tickets:', error);
            return [];
        }
        return data || [];
    },

    async obtenerTodosLosTickets() {
        const { data, error } = await supabase
            .from('support_tickets')
            .select(`
                *,
                stores ( name ),
                profiles:created_by ( full_name, email, phone )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[supportService] Error obteniendo tickets:', error);
            return [];
        }
        return data || [];
    },

    async actualizarTicket(ticketId, { status, admin_response }) {
        const { data, error } = await supabase
            .from('support_tickets')
            .update({ status, admin_response, updated_at: new Date().toISOString() })
            .eq('id', ticketId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },
};

export default supportService;
