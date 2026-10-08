import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import LegalPage, { LegalSection, LegalValue } from '@/components/legal/LegalPage';
import { DATA_REQUEST_TYPES, LEGAL_ENTITY } from '@/config/legal';

/**
 * Canal para que los titulares ejerzan sus derechos sobre datos personales
 * (consulta, actualización, supresión, prueba de autorización, reclamo).
 * Se guarda en contact_submissions con el prefijo «[Datos personales]» y la
 * lee el administrador de la plataforma. Plazos: ver Política de Privacidad.
 */
const DataRequestPage = () => {
  const [form, setForm] = useState({ type: DATA_REQUEST_TYPES[0].value, name: '', email: '', document: '', message: '' });
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({ title: 'Faltan datos', description: 'Completa tu nombre, correo y la descripción de tu solicitud.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const label = DATA_REQUEST_TYPES.find((t) => t.value === form.type)?.label || form.type;
      const body = [
        `Tipo de solicitud: ${label}`,
        form.document.trim() && `Documento de identidad: ${form.document.trim()}`,
        '',
        form.message.trim(),
      ].filter((l) => l !== false).join('\n');

      const { error } = await supabase.from('contact_submissions').insert({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: `[Datos personales] ${label}`,
        message: body,
      });
      if (error) throw error;
      setSent(true);
    } catch {
      toast({ title: 'No se pudo enviar', description: 'Inténtalo de nuevo o escríbenos al correo indicado en esta página.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LegalPage
      title="Solicitudes sobre tus datos personales"
      description="Consulta, actualiza o solicita la supresión de tus datos personales en AmiOriente."
    >
      <p>
        Como titular de tus datos puedes conocerlos, actualizarlos, rectificarlos, pedir prueba de tu autorización,
        revocarla o solicitar su supresión (Ley 1581 de 2012). Cuéntanos qué necesitas; responderemos en los plazos de la{' '}
        <Link to="/privacidad" className="text-primary underline">Política de Privacidad</Link>: consultas en máximo 10 días
        hábiles y reclamos en máximo 15 días hábiles.
      </p>

      {sent ? (
        <div role="status" className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="font-semibold">Recibimos tu solicitud.</p>
          <p className="text-sm mt-1">Te responderemos al correo que indicaste, dentro de los plazos legales.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="type">¿Qué necesitas?</Label>
            <select
              id="type"
              name="type"
              value={form.type}
              onChange={update}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {DATA_REQUEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" name="name" value={form.name} onChange={update} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Correo de tu cuenta en AmiOriente</Label>
            <Input id="email" name="email" type="email" value={form.email} onChange={update} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="document">Documento de identidad (opcional, ayuda a verificar que eres el titular)</Label>
            <Input id="document" name="document" value={form.document} onChange={update} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="message">Describe tu solicitud</Label>
            <Textarea id="message" name="message" rows={5} value={form.message} onChange={update} required />
          </div>
          <div className="flex items-start gap-3 text-sm">
            <Checkbox id="confirm-owner" checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} className="mt-0.5" />
            <label htmlFor="confirm-owner" className="cursor-pointer">Confirmo que soy el titular de los datos o su representante autorizado.</label>
          </div>
          <Button type="submit" disabled={loading || !confirmed}>
            {loading ? 'Enviando...' : 'Enviar solicitud'}
          </Button>
        </form>
      )}

      <LegalSection title="Otros canales">
        <p>También puedes escribir a <LegalValue value={LEGAL_ENTITY.email} /> o a la dirección <LegalValue value={LEGAL_ENTITY.address} />. Si no estás conforme con nuestra respuesta, puedes presentar una queja ante la Superintendencia de Industria y Comercio (SIC).</p>
      </LegalSection>
    </LegalPage>
  );
};

export default DataRequestPage;
