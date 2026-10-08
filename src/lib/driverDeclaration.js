/**
 * Declaración firmada del domiciliario independiente.
 *
 * Aquí viven (1) las listas de opciones del formulario, (2) la validación y
 * (3) la generación del TEXTO EXACTO que firma el domiciliario. Ese texto se
 * guarda tal cual en la base de datos (driver_declarations.document_text) para
 * que, ante un incidente, administración vea exactamente lo que se firmó,
 * aunque después cambie esta plantilla. Cada vez que cambie la plantilla hay
 * que subir LEGAL_VERSION (src/config/legal.js).
 */
import { LEGAL_ENTITY, PLATFORM_NAME } from '@/config/legal';

export const DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'PPT', label: 'Permiso por Protección Temporal' },
  { value: 'PEP', label: 'Permiso Especial de Permanencia' },
  { value: 'PAS', label: 'Pasaporte' },
];

export const VEHICLE_TYPES = [
  { value: 'moto', label: 'Motocicleta', motorized: true },
  { value: 'carro', label: 'Automóvil / camioneta', motorized: true },
  { value: 'bicicleta', label: 'Bicicleta', motorized: false },
  { value: 'pie', label: 'A pie', motorized: false },
];

export const isMotorized = (vehicleType) => VEHICLE_TYPES.find((v) => v.value === vehicleType)?.motorized === true;

/** Cada afirmación que firma el domiciliario (todas obligatorias). */
export const DECLARATION_STATEMENTS = [
  { key: 'independiente', text: 'Presto el servicio de entrega como trabajador independiente y autónomo. Decido libremente si me conecto, cuándo y qué pedidos acepto o rechazo. No existe relación laboral, subordinación, exclusividad ni horario mínimo con la Plataforma ni con los negocios.' },
  { key: 'medios', text: 'Uso mis propios medios (vehículo, celular, combustible y mantenimiento) y asumo sus costos y riesgos.' },
  { key: 'documentos', text: 'Los documentos y datos que declaro son veraces y están vigentes, y cuento con la licencia de conducción, el SOAT y la revisión técnico-mecánica que la ley exige para el vehículo que uso (cuando aplique).' },
  { key: 'afiliacion', text: 'Estoy afiliado al Sistema de Seguridad Social Integral (salud, pensión y riesgos laborales) en la modalidad que me corresponde como independiente, y cumpliré los aportes a mi cargo. Entiendo que la Plataforma aplicará los aportes, reportes y retenciones que la ley y sus reglamentos pongan a su cargo respecto de los trabajadores de reparto de plataformas digitales.' },
  { key: 'informar', text: 'Me comprometo a informar cualquier cambio o vencimiento de estos documentos y a no prestar el servicio si alguno está vencido.' },
  { key: 'verificacion', text: 'Autorizo a la Plataforma a conservar esta declaración como soporte y a verificar la información declarada ante las entidades competentes cuando sea necesario.' },
];

export const emptyDeclaration = () => ({
  documentType: 'CC',
  documentNumber: '',
  vehicleType: 'moto',
  plate: '',
  licenseNumber: '',
  licenseExpiry: '',
  soatInsurer: '',
  soatExpiry: '',
  techExpiry: '',
  health: '',
  pension: '',
  arl: '',
  statements: Object.fromEntries(DECLARATION_STATEMENTS.map((s) => [s.key, false])),
});

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Devuelve un mensaje de error en español o null si la declaración está completa y vigente. */
export const validateDeclaration = (values, signature, today = todayIso()) => {
  const v = values;
  if (!v.documentNumber.trim() || !/^[A-Za-z0-9.\- ]{4,30}$/.test(v.documentNumber.trim())) {
    return 'Escribe tu número de documento (entre 4 y 30 caracteres).';
  }
  if (isMotorized(v.vehicleType)) {
    if (!/^[A-Za-z]{3}[0-9]{2}[0-9A-Za-z]$/.test(v.plate.trim().replace(/[\s-]/g, ''))) {
      return 'Escribe la placa del vehículo (por ejemplo ABC12D o ABC123).';
    }
    if (!v.licenseNumber.trim()) return 'Escribe el número de tu licencia de conducción.';
    const checks = [
      ['licenseExpiry', 'la licencia de conducción'],
      ['soatExpiry', 'el SOAT'],
      ['techExpiry', 'la revisión técnico-mecánica'],
    ];
    for (const [field, label] of checks) {
      if (!v[field]) return `Indica la fecha de vencimiento de ${label}.`;
      if (v[field] < today) return `${label.charAt(0).toUpperCase()}${label.slice(1)} está vencido: renuévalo antes de registrarte.`;
    }
    if (!v.soatInsurer.trim()) return 'Escribe la aseguradora de tu SOAT.';
  }
  if (!v.health.trim() || !v.pension.trim() || !v.arl.trim()) {
    return 'Indica tu entidad de salud (EPS), de pensión y de riesgos laborales (ARL). Debes estar afiliado para operar.';
  }
  const pending = DECLARATION_STATEMENTS.find((s) => !v.statements[s.key]);
  if (pending) return 'Debes marcar todas las declaraciones para poder firmar.';
  if (!signature) return 'Dibuja tu firma en el recuadro.';
  return null;
};

const fmtDate = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : 'No aplica');

/**
 * Texto completo del documento que se firma (texto plano, listo para guardar y mostrar).
 * @param {object} values valores del formulario
 * @param {{fullName:string,email:string,version:string,signedAt?:Date}} meta
 */
export const buildDeclarationText = (values, { fullName, email, version, signedAt = new Date() }) => {
  const v = values;
  const docLabel = DOCUMENT_TYPES.find((d) => d.value === v.documentType)?.label || v.documentType;
  const vehicle = VEHICLE_TYPES.find((x) => x.value === v.vehicleType)?.label || v.vehicleType;
  const motor = isMotorized(v.vehicleType);
  const when = signedAt.toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' });

  return [
    `DECLARACIÓN Y COMPROMISO DE DOMICILIARIO INDEPENDIENTE`,
    `Plataforma ${PLATFORM_NAME} · ${LEGAL_ENTITY.name} (NIT ${LEGAL_ENTITY.nit})`,
    `Versión de los Términos: ${version}`,
    ``,
    `Yo, ${fullName.trim()}, identificado(a) con ${docLabel} No. ${v.documentNumber.trim()}, correo electrónico ${email.trim()}, declaro bajo la gravedad del juramento, que se entiende prestado con la firma de este documento, lo siguiente:`,
    ``,
    `DATOS DECLARADOS`,
    `- Medio de transporte: ${vehicle}`,
    motor ? `- Placa: ${v.plate.trim().toUpperCase()}` : null,
    motor ? `- Licencia de conducción No. ${v.licenseNumber.trim()}, vence el ${fmtDate(v.licenseExpiry)}` : null,
    motor ? `- SOAT: ${v.soatInsurer.trim()}, vence el ${fmtDate(v.soatExpiry)}` : null,
    motor ? `- Revisión técnico-mecánica vence el ${fmtDate(v.techExpiry)}` : null,
    `- Salud (EPS): ${v.health.trim()}`,
    `- Pensión: ${v.pension.trim()}`,
    `- Riesgos laborales (ARL): ${v.arl.trim()}`,
    ``,
    `DECLARACIONES`,
    ...DECLARATION_STATEMENTS.map((s, i) => `${i + 1}. ${s.text}`),
    ``,
    `Firmado electrónicamente el ${when}, mediante firma electrónica manuscrita digitalizada y aceptación expresa de este documento, con efectos probatorios (Ley 527 de 1999 y Decreto 2364 de 2012).`,
  ].filter((l) => l !== null).join('\n');
};

/** Datos estructurados que se guardan junto al texto (sin la firma ni las afirmaciones). */
export const buildDeclarationPayload = (values) => {
  const v = values;
  const motor = isMotorized(v.vehicleType);
  return {
    vehicleType: v.vehicleType,
    plate: motor ? v.plate.trim().toUpperCase() : null,
    licenseNumber: motor ? v.licenseNumber.trim() : null,
    licenseExpiry: motor ? v.licenseExpiry : null,
    soatInsurer: motor ? v.soatInsurer.trim() : null,
    soatExpiry: motor ? v.soatExpiry : null,
    techExpiry: motor ? v.techExpiry : null,
    health: v.health.trim(),
    pension: v.pension.trim(),
    arl: v.arl.trim(),
    statements: DECLARATION_STATEMENTS.map((s) => s.key),
  };
};
