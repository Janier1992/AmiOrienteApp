import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LEGAL_VERSION } from '@/config/legal';

globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };

vi.mock('react-helmet', () => ({ Helmet: () => null }));
vi.mock('framer-motion', () => {
  const Div = ({ children, initial, animate, transition, ...p }) => <div {...p}>{children}</div>;
  return { motion: { div: Div }, AnimatePresence: ({ children }) => <>{children}</> };
});

const mockRpc = vi.fn();
vi.mock('@/lib/customSupabaseClient', () => ({ supabase: { rpc: (...a) => mockRpc(...a) } }));
const mockSignUp = vi.fn();
vi.mock('@/contexts/SupabaseAuthContext', () => ({ useAuth: () => ({ signUp: mockSignUp, user: null }) }));
const toast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({ toast: (...a) => toast(...a) }));

// El lienzo de firma no funciona en jsdom: un botón entrega una firma de prueba.
vi.mock('@/components/auth/SignaturePad', () => ({
  default: ({ onChange }) => (
    <button type="button" onClick={() => onChange(`data:image/png;base64,${'A'.repeat(400)}`)}>Firmar (prueba)</button>
  ),
}));

const nextYear = `${new Date().getFullYear() + 1}-06-30`;

const fillEverything = () => {
  const typeIn = (placeholderOrLabel, value, by = 'placeholder') => {
    const el = by === 'label' ? screen.getByLabelText(placeholderOrLabel) : screen.getByPlaceholderText(placeholderOrLabel);
    fireEvent.change(el, { target: { value } });
  };
  typeIn('Nombre Completo', 'Dora Domi');
  typeIn('Correo Electrónico', 'dora@correo.com');
  typeIn('Teléfono', '3001112233');
  typeIn(/Dirección/, 'Calle 1');
  typeIn(/Contraseña/, 'Abcdef1!');
  typeIn('Número de documento', '1037000111', 'label');
  typeIn('Placa del vehículo', 'ABC12D', 'label');
  typeIn('Licencia de conducción No.', 'LIC123', 'label');
  typeIn('Vencimiento de la licencia', nextYear, 'label');
  typeIn('Aseguradora del SOAT', 'Bolívar', 'label');
  typeIn('Vencimiento del SOAT', nextYear, 'label');
  typeIn('Vencimiento de la revisión técnico-mecánica', nextYear, 'label');
  typeIn('Salud (EPS)', 'Sura', 'label');
  typeIn('Fondo de pensión', 'Porvenir', 'label');
  typeIn('Riesgos laborales (ARL)', 'Positiva', 'label');
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRpc.mockResolvedValue({ data: 'decl-uuid-123', error: null });
  mockSignUp.mockResolvedValue({ user: { identities: [{ id: '1' }] }, session: null, error: null });
});

describe('registro de domiciliario con declaración firmada', () => {
  it('no se puede crear la cuenta sin firma ni aceptación', async () => {
    const { default: DeliveryRegister } = await import('../DeliveryRegister');
    render(<MemoryRouter><DeliveryRegister /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Crear Cuenta' }).disabled).toBe(true);
  });

  it('con documentos vencidos se rechaza antes de guardar nada', async () => {
    const { default: DeliveryRegister } = await import('../DeliveryRegister');
    render(<MemoryRouter><DeliveryRegister /></MemoryRouter>);
    fillEverything();
    fireEvent.change(screen.getByLabelText('Vencimiento del SOAT'), { target: { value: '2020-01-01' } });
    screen.getAllByRole('checkbox').forEach((c) => fireEvent.click(c));
    fireEvent.click(screen.getByText('Firmar (prueba)'));
    fireEvent.click(screen.getByRole('button', { name: 'Crear Cuenta' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: expect.stringMatching(/SOAT está vencido/) })));
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('firma la declaración primero y luego crea la cuenta vinculándola', async () => {
    const { default: DeliveryRegister } = await import('../DeliveryRegister');
    render(<MemoryRouter><DeliveryRegister /></MemoryRouter>);
    fillEverything();
    screen.getAllByRole('checkbox').forEach((c) => fireEvent.click(c));
    fireEvent.click(screen.getByText('Firmar (prueba)'));
    fireEvent.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    await waitFor(() => expect(mockSignUp).toHaveBeenCalled());
    expect(mockRpc).toHaveBeenCalledWith('submit_driver_declaration', expect.objectContaining({
      p_email: 'dora@correo.com',
      p_full_name: 'Dora Domi',
      p_document_number: '1037000111',
      p_legal_version: LEGAL_VERSION,
    }));
    const rpcArgs = mockRpc.mock.calls[0][1];
    expect(rpcArgs.p_document_text).toContain('declaro bajo la gravedad del juramento');
    expect(rpcArgs.p_signature_png).toMatch(/^data:image\/png;base64,/);
    expect(mockRpc.mock.invocationCallOrder[0]).toBeLessThan(mockSignUp.mock.invocationCallOrder[0]);
    expect(mockSignUp.mock.calls[0][2].data).toMatchObject({
      role: 'domiciliario',
      declaration_id: 'decl-uuid-123',
      accepted_terms: true,
      driver_independent_declared: true,
    });
  });

  it('si el servidor rechaza la declaración no se crea la cuenta', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Firma inválida: dibuja tu firma en el recuadro.' } });
    const { default: DeliveryRegister } = await import('../DeliveryRegister');
    render(<MemoryRouter><DeliveryRegister /></MemoryRouter>);
    fillEverything();
    screen.getAllByRole('checkbox').forEach((c) => fireEvent.click(c));
    fireEvent.click(screen.getByText('Firmar (prueba)'));
    fireEvent.click(screen.getByRole('button', { name: 'Crear Cuenta' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'No se pudo guardar tu declaración' })));
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});
