import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrderChat from '../OrderChat';
import { chatService } from '@/services/chatService';

vi.mock('@/contexts/SupabaseAuthContext', () => ({ useAuth: () => ({ user: { id: 'yo' } }) }));
vi.mock('@/components/ui/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/services/chatService', () => ({
  chatService: {
    obtenerMensajes: vi.fn(),
    enviarMensaje: vi.fn(),
    marcarLeidos: vi.fn(),
    reportarConversacion: vi.fn(),
    suscribirse: vi.fn(() => () => {}),
  },
}));

const mensaje = (id, extra = {}) => ({
  id, order_id: 'p1', sender_id: 'otro', sender_role: 'domiciliario', body: `texto ${id}`,
  created_at: `2026-11-08T10:00:0${id}Z`, read_at: null, ...extra,
});

const abrir = async (props = {}) => {
  render(<OrderChat orderId="p1" status="En curso" role="cliente" {...props} />);
  fireEvent.click(await screen.findByRole('button', { name: /mensajes/i }));
};

beforeEach(() => {
  vi.clearAllMocks();
  chatService.obtenerMensajes.mockResolvedValue([]);
  chatService.marcarLeidos.mockResolvedValue();
  chatService.suscribirse.mockReturnValue(() => {});
});

describe('OrderChat', () => {
  it('muestra la conversación y marca como leídos los mensajes de la otra parte al abrirla', async () => {
    chatService.obtenerMensajes.mockResolvedValue([mensaje(1), mensaje(2, { sender_id: 'yo', sender_role: 'cliente' })]);
    await abrir();
    expect(await screen.findByText('texto 1')).toBeTruthy();
    expect(screen.getByText('texto 2')).toBeTruthy();
    await waitFor(() => expect(chatService.marcarLeidos).toHaveBeenCalledWith('p1'));
  });

  it('el botón avisa cuántos mensajes están sin leer', async () => {
    chatService.obtenerMensajes.mockResolvedValue([mensaje(1), mensaje(2)]);
    render(<OrderChat orderId="p1" status="En curso" role="cliente" />);
    expect((await screen.findByLabelText('2 sin leer')).textContent).toBe('2');
  });

  it('envía lo escrito y lo muestra', async () => {
    chatService.enviarMensaje.mockResolvedValue(mensaje(5, { sender_id: 'yo', sender_role: 'cliente', body: 'Ya bajo en un minuto' }));
    await abrir();
    fireEvent.change(await screen.findByLabelText('Mensaje'), { target: { value: '  Ya bajo en un minuto ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await waitFor(() => expect(chatService.enviarMensaje).toHaveBeenCalledWith('p1', 'Ya bajo en un minuto'));
    expect(await screen.findByText('Ya bajo en un minuto')).toBeTruthy();
  });

  it('las respuestas rápidas se envían con un toque', async () => {
    chatService.enviarMensaje.mockResolvedValue(mensaje(6, { sender_id: 'yo', body: 'Ya llegué' }));
    await abrir({ role: 'domiciliario' });
    fireEvent.click(await screen.findByRole('button', { name: 'Ya llegué' }));
    await waitFor(() => expect(chatService.enviarMensaje).toHaveBeenCalledWith('p1', 'Ya llegué'));
  });

  it('no deja enviar un mensaje vacío', async () => {
    await abrir();
    await screen.findByLabelText('Mensaje');
    expect(screen.getByRole('button', { name: 'Enviar' }).disabled).toBe(true);
  });

  it('con el pedido terminado queda de solo lectura y no consulta hasta abrirlo', async () => {
    chatService.obtenerMensajes.mockResolvedValue([mensaje(1)]);
    render(<OrderChat orderId="p1" status="Entregado" role="cliente" />);
    expect(chatService.obtenerMensajes).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /ver mensajes/i }));
    expect(await screen.findByText('texto 1')).toBeTruthy();
    expect(screen.getByText(/queda solo para leer/i)).toBeTruthy();
    expect(screen.queryByLabelText('Mensaje')).toBeNull();
  });

  it('muestra el motivo si el servidor rechaza el envío', async () => {
    const { toast } = await import('@/components/ui/use-toast');
    chatService.enviarMensaje.mockRejectedValue(new Error('Estás enviando mensajes muy rápido.'));
    await abrir();
    fireEvent.change(await screen.findByLabelText('Mensaje'), { target: { value: 'hola' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Estás enviando mensajes muy rápido.' })));
  });

  it('permite reportar la conversación con un motivo', async () => {
    chatService.obtenerMensajes.mockResolvedValue([mensaje(1)]);
    chatService.reportarConversacion.mockResolvedValue('rep-1');
    await abrir();
    fireEvent.click(await screen.findByText(/reportar esta conversación/i));
    fireEvent.change(screen.getByLabelText('Motivo del reporte'), { target: { value: 'Me trató mal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar reporte' }));
    await waitFor(() => expect(chatService.reportarConversacion).toHaveBeenCalledWith('p1', 'Me trató mal'));
  });
});
