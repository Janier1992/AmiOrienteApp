import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LEGAL_VERSION } from '@/config/legal';

// Radix (Checkbox) usa ResizeObserver, que jsdom no trae.
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };

vi.mock('react-helmet', () => ({ Helmet: () => null }));
vi.mock('framer-motion', () => {
  const Div = ({ children, initial, animate, transition, ...p }) => <div {...p}>{children}</div>;
  return { motion: { div: Div }, AnimatePresence: ({ children }) => <>{children}</> };
});

const mockInsert = vi.fn().mockResolvedValue({ error: null });
vi.mock('@/lib/customSupabaseClient', () => ({
  supabase: { from: () => ({ insert: (...a) => mockInsert(...a) }) },
}));

const mockSignUp = vi.fn().mockResolvedValue({ user: { identities: [{ id: '1' }] }, session: null, error: null });
vi.mock('@/contexts/SupabaseAuthContext', () => ({ useAuth: () => ({ signUp: mockSignUp, user: null }) }));
vi.mock('@/components/ui/use-toast', () => ({ toast: vi.fn() }));

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => vi.clearAllMocks());

describe('documentos legales', () => {
  it('los Términos describen al domiciliario como independiente y marcan los datos legales pendientes', async () => {
    const { default: TermsPage } = await import('../TermsPage');
    wrap(<TermsPage />);
    expect(screen.getAllByText(/trabajador independiente y autónomo/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('[POR DEFINIR]').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Stripe/)).toBeNull();
    expect(screen.queryByText(/Domicilios MiOriente/)).toBeNull();
  });

  it('la Política de Privacidad cita la ley, los plazos y el canal de solicitudes', async () => {
    const { default: PrivacyPolicyPage } = await import('../PrivacyPolicyPage');
    wrap(<PrivacyPolicyPage />);
    expect(screen.getAllByText(/Ley 1581 de\s+2012/).length).toBeGreaterThan(0);
    expect(screen.getByText(/diez \(10\) días hábiles/)).toBeTruthy();
    expect(screen.getByText(/quince \(15\) días hábiles/)).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /formulario/i }).length).toBeGreaterThan(0);
  });
});

describe('solicitudes sobre datos personales', () => {
  it('envía la solicitud con el tipo y queda guardada para el administrador', async () => {
    const { default: DataRequestPage } = await import('../DataRequestPage');
    wrap(<DataRequestPage />);
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { name: 'name', value: 'Ana Pérez' } });
    fireEvent.change(screen.getByLabelText('Correo de tu cuenta en AmiOriente'), { target: { name: 'email', value: 'ana@correo.com' } });
    fireEvent.change(screen.getByLabelText('Describe tu solicitud'), { target: { name: 'message', value: 'Quiero borrar mi cuenta' } });
    const send = screen.getByRole('button', { name: 'Enviar solicitud' });
    expect(send.disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(send);
    await waitFor(() => expect(mockInsert).toHaveBeenCalled());
    const row = mockInsert.mock.calls[0][0];
    expect(row.subject).toContain('[Datos personales]');
    expect(row.message).toContain('Quiero borrar mi cuenta');
    expect(await screen.findByText('Recibimos tu solicitud.')).toBeTruthy();
  });
});

describe('autorización en los registros', () => {
  it('el cliente no puede crear la cuenta sin aceptar y, al aceptar, se envía la versión', async () => {
    const { default: CustomerRegister } = await import('../CustomerRegister');
    wrap(<CustomerRegister />);
    const button = screen.getByRole('button', { name: 'Crear Cuenta' });
    expect(button.disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(button.disabled).toBe(false);
    fireEvent.change(screen.getByPlaceholderText('Nombre Completo'), { target: { name: 'name', value: 'Ana' } });
    fireEvent.change(screen.getByPlaceholderText('Correo Electrónico'), { target: { name: 'email', value: 'a@a.co' } });
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), { target: { name: 'phone', value: '3001112233' } });
    fireEvent.change(screen.getByPlaceholderText(/Dirección/), { target: { name: 'address', value: 'Calle 1' } });
    fireEvent.change(screen.getByPlaceholderText(/Contraseña/), { target: { name: 'password', value: 'Abcdef1!' } });
    fireEvent.click(button);
    await waitFor(() => expect(mockSignUp).toHaveBeenCalled());
    const meta = mockSignUp.mock.calls[0][2].data;
    expect(meta).toMatchObject({ role: 'cliente', accepted_terms: true, legal_version: LEGAL_VERSION });
  });

  it('el domiciliario debe aceptar además la declaración de independencia', async () => {
    const { default: DeliveryRegister } = await import('../DeliveryRegister');
    wrap(<DeliveryRegister />);
    const button = screen.getByRole('button', { name: 'Crear Cuenta' });
    const [terms, declaration] = screen.getAllByRole('checkbox');
    fireEvent.click(terms);
    expect(button.disabled).toBe(true);
    fireEvent.click(declaration);
    expect(button.disabled).toBe(false);
  });
});
