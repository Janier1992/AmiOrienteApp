import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatReportsPanel from '../ChatReportsPanel';
import { chatReportService } from '@/services/chatReportService';
import { chatService } from '@/services/chatService';

vi.mock('@/components/ui/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/services/chatReportService', () => ({ chatReportService: { listar: vi.fn(), resolver: vi.fn() } }));
vi.mock('@/services/chatService', () => ({ chatService: { obtenerMensajes: vi.fn() } }));

const reporte = (extra = {}) => ({
  id: 'r1', order_id: 'aaaaaaaa-0000-0000-0000-000000000000', reason: 'El cliente me insultó',
  created_at: '2026-11-08T10:00:00Z', resolved_at: null, resolution_note: null,
  reporter_name: 'Pablo Domi', reporter_role: 'domiciliario', store_name: 'Tienda Uno',
  order_status: 'En curso', customer_name: 'Ana Cliente', driver_name: 'Pablo Domi', message_count: 2, ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  chatReportService.listar.mockResolvedValue([reporte()]);
});

describe('ChatReportsPanel', () => {
  it('lista los reportes abiertos con su contexto', async () => {
    render(<ChatReportsPanel />);
    expect(await screen.findByText(/Pedido #aaaaaaaa · Tienda Uno/)).toBeTruthy();
    expect(screen.getByText(/El cliente me insultó/)).toBeTruthy();
    expect(screen.getByText(/Reportó: Pablo Domi \(Domiciliario\)/)).toBeTruthy();
    expect(screen.getByText(/2 mensajes/)).toBeTruthy();
    expect(chatReportService.listar).toHaveBeenCalledWith({ soloAbiertos: true });
  });

  it('muestra un mensaje cuando no hay reportes', async () => {
    chatReportService.listar.mockResolvedValue([]);
    render(<ChatReportsPanel />);
    expect(await screen.findByText(/No hay reportes abiertos por ahora/)).toBeTruthy();
  });

  it('distingue «falló» de «no hay» y permite reintentar', async () => {
    chatReportService.listar.mockRejectedValueOnce(new Error('sin conexión')).mockResolvedValueOnce([reporte()]);
    render(<ChatReportsPanel />);
    expect(await screen.findByText(/No pudimos cargar los reportes: sin conexión/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText(/Pedido #aaaaaaaa/)).toBeTruthy();
  });

  it('carga la conversación solo cuando el administrador la pide', async () => {
    chatService.obtenerMensajes.mockResolvedValue([
      { id: 'm1', sender_role: 'cliente', body: 'Hola', created_at: '2026-11-08T10:00:00Z' },
      { id: 'm2', sender_role: 'domiciliario', body: 'Voy en camino', created_at: '2026-11-08T10:01:00Z' },
    ]);
    render(<ChatReportsPanel />);
    await screen.findByText(/Pedido #aaaaaaaa/);
    expect(chatService.obtenerMensajes).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Ver conversación' }));
    expect(await screen.findByText(/Voy en camino/)).toBeTruthy();
    expect(chatService.obtenerMensajes).toHaveBeenCalledWith('aaaaaaaa-0000-0000-0000-000000000000');
  });

  it('resuelve con la nota y recarga la lista', async () => {
    chatReportService.resolver.mockResolvedValue();
    render(<ChatReportsPanel />);
    await screen.findByText(/Pedido #aaaaaaaa/);
    fireEvent.change(screen.getByLabelText('Nota de resolución'), { target: { value: 'Se advirtió al cliente' } });
    fireEvent.click(screen.getByRole('button', { name: 'Marcar resuelto' }));
    await waitFor(() => expect(chatReportService.resolver).toHaveBeenCalledWith('r1', 'Se advirtió al cliente'));
    await waitFor(() => expect(chatReportService.listar).toHaveBeenCalledTimes(2));
  });

  it('con «mostrar resueltos» pide todos y muestra la resolución sin ofrecer leer el chat', async () => {
    chatReportService.listar.mockResolvedValue([reporte({ resolved_at: '2026-11-09T10:00:00Z', resolution_note: 'Se advirtió al cliente' })]);
    render(<ChatReportsPanel />);
    fireEvent.click(await screen.findByRole('button', { name: /mostrar también los resueltos/i }));
    await waitFor(() => expect(chatReportService.listar).toHaveBeenLastCalledWith({ soloAbiertos: false }));
    expect(await screen.findByText(/Resolución:/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Ver conversación' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Marcar resuelto' })).toBeNull();
  });
});
