import { supabase } from '@/lib/customSupabaseClient';
import { crearManejadorDeErrores } from '@/lib/serviceError';

const manejarError = crearManejadorDeErrores('chatReportService');

/**
 * Reportes de conversaciones entre cliente y domiciliario, para el administrador.
 *
 * Todo pasa por funciones del servidor que comprueban que quien llama es administrador.
 * Los mensajes de un reporte abierto se leen con `chatService.obtenerMensajes`: la política
 * de la base solo se los muestra al administrador mientras el reporte siga abierto.
 */
export const chatReportService = {
  /** Reportes con el contexto del pedido; por defecto solo los abiertos. */
  async listar({ soloAbiertos = true } = {}) {
    const { data, error } = await supabase.rpc('admin_list_order_chat_reports', { p_only_open: soloAbiertos });
    if (error) manejarError(error, 'No se pudieron cargar los reportes');
    return data || [];
  },

  /** Cierra un reporte con una nota opcional. */
  async resolver(idReporte, nota) {
    if (!idReporte) throw new Error('El reporte es requerido');
    const { error } = await supabase.rpc('resolve_order_chat_report', {
      p_report_id: idReporte,
      p_note: nota?.trim() || null,
    });
    if (error) manejarError(error, 'No se pudo resolver el reporte');
  },
};
