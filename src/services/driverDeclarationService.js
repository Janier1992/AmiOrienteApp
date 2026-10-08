import { supabase } from '@/lib/customSupabaseClient';
import { LEGAL_VERSION } from '@/config/legal';
import { isPhotoDataUrl } from '@/lib/driverPhoto';
import { buildDeclarationPayload, buildDeclarationText, validateDeclaration } from '@/lib/driverDeclaration';

/**
 * Declaración firmada del domiciliario (tabla driver_declarations).
 * El servidor valida todo, calcula la huella y la deja inmodificable.
 */
export const driverDeclarationService = {
  /**
   * Firma y envía la declaración. Sin sesión (durante el registro) devuelve el
   * identificador que se pasa a signUp para vincularla a la cuenta.
   * @returns {Promise<string>} id de la declaración
   */
  async firmar({ email, fullName, values, signature }) {
    const error = validateDeclaration(values, signature);
    if (error) throw new Error(error);
    if (!fullName?.trim()) throw new Error('Escribe tu nombre completo.');

    const text = buildDeclarationText(values, { fullName, email, version: LEGAL_VERSION });
    const { data, error: rpcError } = await supabase.rpc('submit_driver_declaration_v2', {
      p_email: email,
      p_full_name: fullName,
      p_document_type: values.documentType,
      p_document_number: values.documentNumber,
      p_payload: buildDeclarationPayload(values),
      p_document_text: text,
      p_signature_png: signature,
      p_legal_version: LEGAL_VERSION,
      p_photo_jpeg: values.photo,
    });
    if (rpcError) throw new Error(rpcError.message || 'No se pudo guardar la declaración.');
    return data;
  },

  /**
   * Lo que le falta al domiciliario para poder aceptar pedidos.
   * Devuelve { declaration, photo } (true = ya lo tiene) o null si no se pudo saber
   * (no se bloquea por un fallo de red: el servidor igual lo exige).
   */
  async estadoDelDomiciliario(userId) {
    const [decl, photo] = await Promise.all([
      supabase.from('driver_declarations').select('id').eq('user_id', userId).limit(1),
      supabase.from('driver_photos').select('user_id').eq('user_id', userId).limit(1),
    ]);
    if (decl.error || photo.error) return null;
    return { declaration: (decl.data || []).length > 0, photo: (photo.data || []).length > 0 };
  },

  /** Agrega o cambia la fotografía de perfil (domiciliario con sesión). */
  async actualizarFoto(photo) {
    if (!isPhotoDataUrl(photo)) throw new Error('Tómate la fotografía con la cámara.');
    const { error } = await supabase.rpc('update_driver_photo', { p_photo_jpeg: photo });
    if (error) throw new Error(error.message || 'No se pudo guardar la fotografía.');
  },

  /** Solo administración (RLS): declaraciones más recientes primero. */
  async listarParaAdmin() {
    const { data, error } = await supabase
      .from('driver_declarations')
      .select('id, user_id, email, full_name, document_type, document_number, legal_version, signed_at, claimed_at, document_hash')
      .order('signed_at', { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message || 'No se pudieron cargar las declaraciones.');
    return data || [];
  },

  /** Documento completo (texto + firma) de una declaración, solo administración. */
  async obtenerCompleta(id) {
    const { data, error } = await supabase
      .from('driver_declarations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message || 'No se pudo cargar el documento.');
    return data;
  },
};
