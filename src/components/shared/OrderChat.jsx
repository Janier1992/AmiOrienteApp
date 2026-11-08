import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Flag, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useOrderChat } from '@/hooks/use-order-chat';
import { chatService } from '@/services/chatService';
import { CHAT_RETENTION_DAYS, MAX_CHAT_LENGTH, RESPUESTAS_RAPIDAS, chatEstaAbierto } from '@/lib/orderChat';

const hora = (fecha) => new Date(fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

/**
 * Botón «Mensajes» y conversación de un pedido entre el cliente y su domiciliario.
 * Solo se escribe mientras el pedido está en curso; después queda de solo lectura
 * (quien lo use decide hasta cuándo ofrecerlo: el servidor lo borra a los 30 días).
 *
 * @param {string} orderId
 * @param {string} status Estado actual del pedido.
 * @param {'cliente'|'domiciliario'} role Quién usa el chat (define las respuestas rápidas).
 * @param {string} [otraParte] Cómo llamar a la otra persona en los textos.
 */
const OrderChat = ({ orderId, status, role, otraParte = role === 'cliente' ? 'tu domiciliario' : 'el cliente' }) => {
  const { user } = useAuth();
  const abierto = chatEstaAbierto(status);
  const [visible, setVisible] = useState(false);
  const [texto, setTexto] = useState('');
  const [reportando, setReportando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const fin = useRef(null);
  const noLeidosPrevios = useRef(0);
  // Un chat archivado no consulta nada hasta que se abre (evita una consulta por cada pedido del historial).
  const { mensajes, cargando, error, enviando, noLeidos, enviar, marcarLeidos } = useOrderChat({
    orderId, userId: user?.id, abierto, activo: abierto || visible,
  });

  // Avisa de un mensaje nuevo cuando la conversación está cerrada en pantalla.
  useEffect(() => {
    if (!visible && noLeidos > noLeidosPrevios.current) {
      toast({ title: `Mensaje de ${otraParte}`, description: 'Ábrelo en «Mensajes».' });
    }
    noLeidosPrevios.current = noLeidos;
  }, [noLeidos, visible, otraParte]);

  // Al verla, se marcan como leídos y se baja hasta el último mensaje.
  useEffect(() => {
    if (!visible) return;
    if (noLeidos > 0) marcarLeidos();
    fin.current?.scrollIntoView?.({ block: 'end' });
  }, [visible, mensajes, noLeidos, marcarLeidos]);

  const mandar = async (contenido) => {
    const limpio = contenido.trim();
    if (!limpio) return;
    try {
      await enviar(limpio);
      setTexto('');
    } catch (e) {
      toast({ title: 'No se pudo enviar', description: e.message, variant: 'destructive' });
    }
  };

  const reportar = async () => {
    try {
      await chatService.reportarConversacion(orderId, motivo);
      toast({ title: 'Reporte enviado', description: 'El equipo de AmiOriente lo revisará.' });
      setReportando(false);
      setMotivo('');
    } catch (e) {
      toast({ title: 'No se pudo enviar el reporte', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setVisible(true)} className="relative">
        <MessageCircle className="h-4 w-4 mr-2" aria-hidden="true" />
        {abierto ? 'Mensajes' : 'Ver mensajes'}
        {noLeidos > 0 && (
          <span className="ml-2 rounded-full bg-red-600 px-1.5 text-xs font-bold text-white" aria-label={`${noLeidos} sin leer`}>{noLeidos}</span>
        )}
      </Button>

      <Dialog open={visible} onOpenChange={setVisible}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mensajes con {otraParte}</DialogTitle>
            <DialogDescription>
              Pedido #{orderId?.substring(0, 8)}. No compartas contraseñas ni datos bancarios.
            </DialogDescription>
          </DialogHeader>

          <div className="h-64 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-3" role="log" aria-live="polite" aria-label="Conversación">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {!error && !cargando && mensajes.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">Aún no hay mensajes. Escribe el primero.</p>
            )}
            {mensajes.map((m) => {
              const mio = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${mio ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mio ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={`mt-1 text-[10px] ${mio ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{hora(m.created_at)}</p>
                  </div>
                </div>
              );
            })}
            <div ref={fin} />
          </div>

          {abierto ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {RESPUESTAS_RAPIDAS[role]?.map((r) => (
                  <Button key={r} type="button" variant="secondary" size="sm" disabled={enviando} onClick={() => mandar(r)}>{r}</Button>
                ))}
              </div>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); mandar(texto); }}>
                <Input value={texto} maxLength={MAX_CHAT_LENGTH} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe un mensaje" aria-label="Mensaje" />
                <Button type="submit" disabled={enviando || !texto.trim()}>Enviar</Button>
              </form>
            </div>
          ) : (
            <p className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              La conversación terminó con el pedido y queda solo para leer. Se elimina {CHAT_RETENTION_DAYS} días después.
            </p>
          )}

          {reportando ? (
            <div className="space-y-2">
              <Input value={motivo} maxLength={500} onChange={(e) => setMotivo(e.target.value)} placeholder="Cuéntanos qué pasó" aria-label="Motivo del reporte" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setReportando(false)}>Volver</Button>
                <Button variant="destructive" size="sm" disabled={!motivo.trim()} onClick={reportar}>Enviar reporte</Button>
              </div>
            </div>
          ) : (
            mensajes.length > 0 && (
              <button type="button" onClick={() => setReportando(true)} className="flex items-center gap-1 self-start text-xs text-muted-foreground underline">
                <Flag className="h-3 w-3" aria-hidden="true" /> Reportar esta conversación
              </button>
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderChat;
