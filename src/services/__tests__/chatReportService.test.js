import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatReportService } from '../chatReportService';

const sim = vi.hoisted(() => ({ actual: null }));
vi.mock('@/lib/customSupabaseClient', async () => {
  const { crearSupabaseSimulado: crear } = await import('./helpers/supabaseSimulado');
  sim.actual = crear();
  return { supabase: sim.actual.supabase };
});

const rpc = () => sim.actual.supabase.rpc;

beforeEach(() => {
  rpc().mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('chatReportService', () => {
  it('lista solo los abiertos por defecto', async () => {
    rpc().mockResolvedValue({ data: [{ id: 'r1' }], error: null });
    expect(await chatReportService.listar()).toEqual([{ id: 'r1' }]);
    expect(rpc()).toHaveBeenCalledWith('admin_list_order_chat_reports', { p_only_open: true });
  });

  it('puede pedir también los resueltos', async () => {
    rpc().mockResolvedValue({ data: [], error: null });
    await chatReportService.listar({ soloAbiertos: false });
    expect(rpc()).toHaveBeenCalledWith('admin_list_order_chat_reports', { p_only_open: false });
  });

  it('propaga el error del servidor (p. ej. no es administrador)', async () => {
    rpc().mockResolvedValue({ data: null, error: { message: 'Solo el administrador puede ver los reportes.' } });
    await expect(chatReportService.listar()).rejects.toThrow(/administrador/);
  });

  it('resuelve con la nota recortada, o sin nota si viene vacía', async () => {
    rpc().mockResolvedValue({ error: null });
    await chatReportService.resolver('r1', '  Se advirtió al cliente ');
    expect(rpc()).toHaveBeenLastCalledWith('resolve_order_chat_report', { p_report_id: 'r1', p_note: 'Se advirtió al cliente' });
    await chatReportService.resolver('r1', '   ');
    expect(rpc()).toHaveBeenLastCalledWith('resolve_order_chat_report', { p_report_id: 'r1', p_note: null });
  });

  it('exige el reporte y propaga los errores al resolver', async () => {
    await expect(chatReportService.resolver('', 'x')).rejects.toThrow(/reporte es requerido/);
    rpc().mockResolvedValue({ error: { message: 'El reporte no existe o ya fue resuelto.' } });
    await expect(chatReportService.resolver('r1', 'x')).rejects.toThrow(/ya fue resuelto/);
  });
});
