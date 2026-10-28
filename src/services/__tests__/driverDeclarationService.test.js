import { describe, it, expect, vi, beforeEach } from 'vitest';
import { driverDeclarationService } from '../driverDeclarationService';
import { DECLARATION_STATEMENTS, emptyDeclaration } from '@/lib/driverDeclaration';
import { LEGAL_VERSION } from '@/config/legal';

const mockRpc = vi.fn();
let tables = {};

/** Cadena mínima de consulta: resuelve con lo configurado para la tabla. */
vi.mock('@/lib/customSupabaseClient', () => ({
  supabase: {
    rpc: (...a) => mockRpc(...a),
    from: (tabla) => {
      const resultado = () => Promise.resolve(tables[tabla] ?? { data: [], error: null });
      const cadena = {
        select: () => cadena,
        eq: () => cadena,
        order: () => cadena,
        limit: () => resultado(),
        single: () => resultado(),
      };
      return cadena;
    },
  },
}));

const FIRMA = `data:image/png;base64,${'A'.repeat(400)}`;
const FOTO = `data:image/jpeg;base64,${'B'.repeat(2500)}`;

const valoresCompletos = () => ({
  ...emptyDeclaration(),
  documentNumber: '1037000111',
  photo: FOTO,
  plate: 'ABC12D',
  licenseNumber: 'LIC-998877',
  licenseExpiry: '2099-01-01',
  soatInsurer: 'Seguros Bolívar',
  soatExpiry: '2099-03-01',
  techExpiry: '2099-04-01',
  health: 'Sura',
  pension: 'Porvenir',
  arl: 'Positiva',
  statements: Object.fromEntries(DECLARATION_STATEMENTS.map((s) => [s.key, true])),
});

beforeEach(() => {
  vi.clearAllMocks();
  tables = {};
  mockRpc.mockResolvedValue({ data: 'decl-1', error: null });
});

describe('driverDeclarationService.firmar', () => {
  it('envía la declaración completa a submit_driver_declaration_v2 y devuelve su id', async () => {
    const id = await driverDeclarationService.firmar({
      email: 'dora@correo.co', fullName: 'Dora Domi Pérez', values: valoresCompletos(), signature: FIRMA,
    });

    expect(id).toBe('decl-1');
    const [nombre, args] = mockRpc.mock.calls[0];
    expect(nombre).toBe('submit_driver_declaration_v2');
    expect(args).toMatchObject({
      p_email: 'dora@correo.co',
      p_full_name: 'Dora Domi Pérez',
      p_document_number: '1037000111',
      p_signature_png: FIRMA,
      p_photo_jpeg: FOTO,
      p_legal_version: LEGAL_VERSION,
    });
    expect(args.p_document_text).toContain('Dora Domi Pérez');
  });

  it('no llama al servidor si falta la firma o la fotografía', async () => {
    await expect(driverDeclarationService.firmar({
      email: 'a@b.co', fullName: 'Dora', values: valoresCompletos(), signature: null,
    })).rejects.toThrow(/firma/i);
    await expect(driverDeclarationService.firmar({
      email: 'a@b.co', fullName: 'Dora', values: { ...valoresCompletos(), photo: null }, signature: FIRMA,
    })).rejects.toThrow(/fotograf/i);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('exige el nombre completo', async () => {
    await expect(driverDeclarationService.firmar({
      email: 'a@b.co', fullName: '   ', values: valoresCompletos(), signature: FIRMA,
    })).rejects.toThrow(/nombre/i);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('propaga el mensaje del servidor', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Foto inválida' } });
    await expect(driverDeclarationService.firmar({
      email: 'a@b.co', fullName: 'Dora', values: valoresCompletos(), signature: FIRMA,
    })).rejects.toThrow('Foto inválida');
  });
});

describe('driverDeclarationService.estadoDelDomiciliario', () => {
  it('indica qué le falta al domiciliario', async () => {
    tables = { driver_declarations: { data: [{ id: 'd1' }], error: null }, driver_photos: { data: [], error: null } };
    expect(await driverDeclarationService.estadoDelDomiciliario('u1')).toEqual({ declaration: true, photo: false });
  });

  it('devuelve null (sin bloquear) si no pudo consultar', async () => {
    tables = { driver_declarations: { data: null, error: { message: 'red' } }, driver_photos: { data: [], error: null } };
    expect(await driverDeclarationService.estadoDelDomiciliario('u1')).toBeNull();
  });
});

describe('driverDeclarationService.actualizarFoto', () => {
  it('rechaza imágenes que no vienen de la cámara', async () => {
    await expect(driverDeclarationService.actualizarFoto('https://x.co/foto.jpg')).rejects.toThrow(/cámara/i);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('guarda la fotografía por update_driver_photo', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    await driverDeclarationService.actualizarFoto(FOTO);
    expect(mockRpc).toHaveBeenCalledWith('update_driver_photo', { p_photo_jpeg: FOTO });
  });
});

describe('driverDeclarationService (administración)', () => {
  it('lista y obtiene documentos, y traduce los errores', async () => {
    tables = { driver_declarations: { data: [{ id: 'd1' }], error: null } };
    expect(await driverDeclarationService.listarParaAdmin()).toEqual([{ id: 'd1' }]);

    tables = { driver_declarations: { data: { id: 'd1', document_text: 'texto' }, error: null } };
    expect(await driverDeclarationService.obtenerCompleta('d1')).toMatchObject({ id: 'd1' });

    tables = { driver_declarations: { data: null, error: { message: 'No autorizado' } } };
    await expect(driverDeclarationService.obtenerCompleta('d1')).rejects.toThrow('No autorizado');
  });
});
