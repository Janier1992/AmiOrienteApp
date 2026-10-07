import { describe, it, expect } from 'vitest';
import { validatePassword, getPasswordError } from '../passwordPolicy';

describe('validatePassword', () => {
  it('acepta una contraseña fuerte', () => {
    expect(validatePassword('Abcdef1!').valid).toBe(true);
  });
  it('acepta símbolos comunes que antes se rechazaban (. _ - #)', () => {
    for (const pw of ['Clave.Segura1', 'Clave_Segura1', 'Clave-Segura1', 'Clave#Segura1']) {
      expect(validatePassword(pw).valid, pw).toBe(true);
    }
  });
  it('indica todo lo que falta', () => {
    const { valid, missing } = validatePassword('abc');
    expect(valid).toBe(false);
    expect(missing).toEqual(['al menos 8 caracteres', 'una mayúscula', 'un número', 'un símbolo']);
  });
  it('rechaza solo longitud insuficiente aunque tenga todo lo demás', () => {
    expect(validatePassword('Ab1!').missing).toEqual(['al menos 8 caracteres']);
  });
  it('el espacio no cuenta como símbolo', () => {
    expect(validatePassword('Abcdefg 1').valid).toBe(false);
  });
  it('tolera valores no string', () => {
    expect(validatePassword(undefined).valid).toBe(false);
    expect(validatePassword(null).valid).toBe(false);
  });
});

describe('getPasswordError', () => {
  it('devuelve null si es válida', () => {
    expect(getPasswordError('Abcdef1!')).toBeNull();
  });
  it('devuelve un mensaje con lo faltante', () => {
    expect(getPasswordError('abcdefgh')).toBe('Tu contraseña necesita una mayúscula, un número, un símbolo.');
  });
});
