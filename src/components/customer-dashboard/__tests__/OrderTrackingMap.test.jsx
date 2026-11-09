import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import OrderTrackingMap from '../OrderTrackingMap';

const sim = vi.hoisted(() => ({ consultas: [], respuesta: { data: null }, canal: { on: vi.fn(), subscribe: vi.fn() }, removeChannel: vi.fn() }));

vi.mock('@/lib/customSupabaseClient', () => ({
  supabase: {
    from: (tabla) => {
      const cadena = { select: () => cadena, eq: () => cadena, single: () => { sim.consultas.push(tabla); return Promise.resolve(sim.respuesta); } };
      return cadena;
    },
    channel: () => sim.canal,
    removeChannel: (...a) => sim.removeChannel(...a),
  },
}));
vi.mock('@/lib/mapIcons', () => ({ iconoDomiciliario: {} }));
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="mapa">{children}</div>,
  TileLayer: ({ url }) => <span data-testid="teselas">{url}</span>,
  Marker: ({ children }) => <div data-testid="marcador">{children}</div>,
  Popup: ({ children }) => <span>{children}</span>,
  Polyline: () => null,
}));

beforeEach(() => {
  sim.consultas.length = 0;
  sim.respuesta = { data: null };
  sim.canal.on.mockReturnValue(sim.canal);
  sim.canal.subscribe.mockReturnValue(sim.canal);
});

describe('OrderTrackingMap', () => {
  it('avisa que aún no hay ubicación si no hay coordenadas ni posición del domiciliario', () => {
    render(<OrderTrackingMap delivery={{ delivery_person_id: 'd1' }} />);
    expect(screen.getByText(/Aún no tenemos la ubicación de tu domiciliario/)).toBeTruthy();
  });

  it('consulta la posición del domiciliario y la muestra con las teselas configuradas', async () => {
    sim.respuesta = { data: { lat: 6.17, lng: -75.33 } };
    render(<OrderTrackingMap delivery={{ delivery_person_id: 'd1', delivery_coords: [6.18, -75.34] }} />);
    await waitFor(() => expect(sim.consultas).toContain('delivery_locations'));
    expect(await screen.findAllByTestId('marcador')).toHaveLength(2);
    expect(screen.getByTestId('teselas').textContent).toContain('{z}/{x}/{y}');
  });
});
