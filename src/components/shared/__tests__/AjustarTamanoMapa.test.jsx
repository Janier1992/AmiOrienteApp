import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import AjustarTamanoMapa from '../AjustarTamanoMapa';

const mapa = vi.hoisted(() => ({ getContainer: vi.fn(), invalidateSize: vi.fn() }));
vi.mock('react-leaflet', () => ({ useMap: () => mapa }));

let avisar;
const desconectar = vi.fn();
const observar = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mapa.getContainer.mockReturnValue({ id: 'contenedor' });
  vi.stubGlobal('ResizeObserver', class { constructor(fn) { avisar = fn; } observe(el) { observar(el); } disconnect() { desconectar(); } });
});

describe('AjustarTamanoMapa', () => {
  it('observa el contenedor del mapa y recalcula su tamaño cuando cambia', () => {
    render(<AjustarTamanoMapa />);
    expect(observar).toHaveBeenCalledWith({ id: 'contenedor' });
    expect(mapa.invalidateSize).not.toHaveBeenCalled();
    avisar();
    avisar();
    expect(mapa.invalidateSize).toHaveBeenCalledTimes(2);
  });

  it('deja de observar al desmontarse', () => {
    const { unmount } = render(<AjustarTamanoMapa />);
    unmount();
    expect(desconectar).toHaveBeenCalledTimes(1);
  });
});
