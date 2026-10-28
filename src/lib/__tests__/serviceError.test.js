import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crearManejadorDeErrores } from '../serviceError';

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));

describe('crearManejadorDeErrores', () => {
  it('registra con el nombre del servicio y lanza el mensaje del servidor', () => {
    const manejar = crearManejadorDeErrores('pruebaService');
    expect(() => manejar({ message: 'Este pedido ya fue tomado' }, 'Aceptando')).toThrow('Este pedido ya fue tomado');
    expect(console.error).toHaveBeenCalledWith('[pruebaService] Aceptando:', { message: 'Este pedido ya fue tomado' });
  });

  it('usa el contexto si el error no trae mensaje (o es nulo)', () => {
    const manejar = crearManejadorDeErrores('pruebaService');
    expect(() => manejar({}, 'No se pudo cargar')).toThrow('No se pudo cargar');
    expect(() => manejar(null, 'No se pudo cargar')).toThrow('No se pudo cargar');
  });

  it('aplica la traducción de códigos solo cuando reconoce el error', () => {
    const manejar = crearManejadorDeErrores('pruebaService', {
      traducirCodigo: (e) => (e.code === '23505' ? 'Ya existe un registro con esos datos' : undefined),
    });
    expect(() => manejar({ code: '23505', message: 'duplicate key' }, 'x')).toThrow('Ya existe un registro con esos datos');
    expect(() => manejar({ code: '42501', message: 'permiso denegado' }, 'x')).toThrow('permiso denegado');
  });
});
