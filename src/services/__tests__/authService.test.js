import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../authService';

const auth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
  getSession: vi.fn(),
};
vi.mock('@/lib/customSupabaseClient', () => ({ supabase: { auth: new Proxy({}, { get: (_, k) => (...a) => auth[k](...a) }) } }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('authService.iniciarSesion', () => {
  it('no consulta al servidor con un correo o contraseña inválidos', async () => {
    await expect(authService.iniciarSesion('no-es-correo', 'secreto123')).rejects.toThrow(/correo/i);
    await expect(authService.iniciarSesion('a@b.co', '123')).rejects.toThrow(/6 caracteres/);
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('devuelve usuario y sesión cuando las credenciales son correctas', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' }, session: { token: 't' } }, error: null });
    const r = await authService.iniciarSesion('a@b.co', 'secreto123');
    expect(r.user.id).toBe('u1');
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.co', password: 'secreto123' });
  });

  it.each([
    ['Invalid login credentials', 'Correo electrónico o contraseña incorrectos'],
    ['Email not confirmed', 'Por favor confirma tu correo electrónico antes de continuar'],
  ])('traduce el error «%s» a un mensaje claro en español', async (original, esperado) => {
    auth.signInWithPassword.mockResolvedValue({ data: null, error: { message: original } });
    await expect(authService.iniciarSesion('a@b.co', 'secreto123')).rejects.toThrow(esperado);
  });
});

describe('authService.registrarUsuario', () => {
  it('solo admite los roles de la plataforma (no se puede registrar un administrador)', async () => {
    await expect(authService.registrarUsuario('a@b.co', 'secreto123', { role: 'admin' })).rejects.toThrow(/Rol inválido/);
    await expect(authService.registrarUsuario('a@b.co', 'secreto123', {})).rejects.toThrow(/rol/i);
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it('envía los metadatos al registrar un rol válido', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { id: 'u2' } }, error: null });
    await authService.registrarUsuario('a@b.co', 'secreto123', { role: 'cliente', full_name: 'Ana' });
    expect(auth.signUp).toHaveBeenCalledWith({ email: 'a@b.co', password: 'secreto123', options: { data: { role: 'cliente', full_name: 'Ana' } } });
  });

  it('avisa si el correo ya está registrado', async () => {
    auth.signUp.mockResolvedValue({ data: null, error: { message: 'User already registered' } });
    await expect(authService.registrarUsuario('a@b.co', 'secreto123', { role: 'cliente' })).rejects.toThrow('Este correo electrónico ya está registrado');
  });
});

describe('authService.cerrarSesion', () => {
  it('ignora los errores de una sesión que ya no existe', async () => {
    auth.signOut.mockResolvedValue({ error: { message: 'Invalid Refresh Token' } });
    await expect(authService.cerrarSesion()).resolves.toBeUndefined();
  });

  it('informa los demás errores', async () => {
    auth.signOut.mockResolvedValue({ error: { message: 'boom', status: 500 } });
    await expect(authService.cerrarSesion()).rejects.toThrow(/cerrar la sesión/);
  });
});

describe('authService.obtenerUsuarioActual / obtenerSesion', () => {
  it('devuelven null (sin lanzar) si el servidor falla', async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'sin conexión' } });
    auth.getSession.mockRejectedValue(new Error('red'));
    expect(await authService.obtenerUsuarioActual()).toBeNull();
    expect(await authService.obtenerSesion()).toBeNull();
  });

  it('devuelven el usuario y la sesión vigentes', async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    auth.getSession.mockResolvedValue({ data: { session: { token: 't' } }, error: null });
    expect((await authService.obtenerUsuarioActual()).id).toBe('u1');
    expect((await authService.obtenerSesion()).token).toBe('t');
  });
});
