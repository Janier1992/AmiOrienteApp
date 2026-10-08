/**
 * Datos legales de la plataforma.
 *
 * La plataforma será operada por una persona jurídica que debe completar estos
 * datos ANTES de comercializar. Se definen con variables de entorno de Vite
 * (ver .env.example) para no tocar el código al cambiar de operador. Mientras
 * no estén definidos se muestra «[POR DEFINIR]» en los documentos legales, de
 * modo que no se pueda olvidar.
 *
 * Cada vez que cambie el texto de los Términos o de la Política de Privacidad
 * hay que subir LEGAL_VERSION: los registros guardan qué versión aceptó cada
 * persona (tabla legal_consents).
 */
export const LEGAL_VERSION = '2026-10-13';

const PENDING = '[POR DEFINIR]';
const env = import.meta.env;

export const LEGAL_ENTITY = {
  /** Razón social de la persona jurídica responsable. */
  name: env.VITE_LEGAL_NAME || PENDING,
  /** NIT con dígito de verificación. */
  nit: env.VITE_LEGAL_NIT || PENDING,
  /** Dirección de notificación judicial y de correspondencia. */
  address: env.VITE_LEGAL_ADDRESS || PENDING,
  /** Teléfono de contacto. */
  phone: env.VITE_LEGAL_PHONE || PENDING,
  /** Correo para PQRS y para solicitudes sobre datos personales. */
  email: env.VITE_LEGAL_EMAIL || PENDING,
};

export const PLATFORM_NAME = 'AmiOriente';

/** true cuando ya se completaron todos los datos de la persona jurídica. */
export const isLegalEntityConfigured = Object.values(LEGAL_ENTITY).every((v) => v !== PENDING);

/** Tipos de solicitud sobre datos personales (Ley 1581 de 2012, art. 8, 14 y 15). */
export const DATA_REQUEST_TYPES = [
  { value: 'consulta', label: 'Consultar mis datos' },
  { value: 'actualizacion', label: 'Actualizar o rectificar mis datos' },
  { value: 'supresion', label: 'Suprimir mis datos o revocar mi autorización' },
  { value: 'prueba_autorizacion', label: 'Solicitar prueba de mi autorización' },
  { value: 'reclamo', label: 'Presentar un reclamo sobre el tratamiento de mis datos' },
];
