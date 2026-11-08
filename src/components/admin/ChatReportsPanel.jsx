import React, { useState, useEffect, useCallback } from 'react';
import { Flag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { chatReportService } from '@/services/chatReportService';
import { chatService } from '@/services/chatService';

const ROL = { cliente: 'Cliente', domiciliario: 'Domiciliario' };
const fecha = (iso) => new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

const ReporteFila = ({ reporte, onResuelto }) => {
  const [mensajes, setMensajes] = useState(null); // null = sin cargar
  const [cargando, setCargando] = useState(false);
  const [errorChat, setErrorChat] = useState(null);
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const abierto = !reporte.resolved_at;

  const verConversacion = async () => {
    setCargando(true);
    setErrorChat(null);
    try {
      setMensajes(await chatService.obtenerMensajes(reporte.order_id));
    } catch (e) {
      setErrorChat(e.message);
    } finally {
      setCargando(false);
    }
  };

  const resolver = async () => {
    setGuardando(true);
    try {
      await chatReportService.resolver(reporte.id, nota);
      toast({ title: 'Reporte resuelto' });
      onResuelto();
    } catch (e) {
      toast({ title: 'No se pudo resolver', description: e.message, variant: 'destructive' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3" data-testid="reporte-chat">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">Pedido #{reporte.order_id.substring(0, 8)} · {reporte.store_name || 'Sin tienda'}</p>
          <p className="text-xs text-muted-foreground">
            Reportó: {reporte.reporter_name || 'Sin nombre'} ({ROL[reporte.reporter_role] || reporte.reporter_role}) · {fecha(reporte.created_at)}
          </p>
          <p className="text-xs text-muted-foreground">
            Cliente: {reporte.customer_name || '—'} · Domiciliario: {reporte.driver_name || '—'} · {reporte.message_count} {Number(reporte.message_count) === 1 ? 'mensaje' : 'mensajes'}
          </p>
        </div>
        <Badge variant={abierto ? 'destructive' : 'default'}>{abierto ? 'Abierto' : 'Resuelto'}</Badge>
      </div>

      <p className="text-sm"><span className="font-medium">Motivo:</span> {reporte.reason}</p>

      {abierto && mensajes === null && (
        <Button size="sm" variant="outline" disabled={cargando} onClick={verConversacion}>
          {cargando ? 'Cargando...' : 'Ver conversación'}
        </Button>
      )}
      {errorChat && <p className="text-sm text-destructive">{errorChat}</p>}
      {mensajes && (
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border bg-muted/30 p-3 text-sm" role="log" aria-label="Conversación reportada">
          {mensajes.length === 0 && <p className="text-muted-foreground">La conversación no tiene mensajes.</p>}
          {mensajes.map((m) => (
            <p key={m.id}>
              <span className="font-medium">{ROL[m.sender_role] || m.sender_role}</span>{' '}
              <span className="text-xs text-muted-foreground">{fecha(m.created_at)}</span>: {m.body}
            </p>
          ))}
        </div>
      )}

      {abierto ? (
        <div className="space-y-2">
          <Textarea
            rows={2}
            maxLength={500}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Nota de resolución (qué se hizo)..."
            aria-label="Nota de resolución"
          />
          <Button size="sm" disabled={guardando} onClick={resolver}>{guardando ? 'Guardando...' : 'Marcar resuelto'}</Button>
          <p className="text-xs text-muted-foreground">Al resolverlo dejarás de ver la conversación. Léela con reserva y no la compartas.</p>
        </div>
      ) : (
        reporte.resolution_note && <p className="text-sm text-muted-foreground"><span className="font-medium">Resolución:</span> {reporte.resolution_note}</p>
      )}
    </div>
  );
};

/**
 * Reportes de conversaciones del chat entre cliente y domiciliario.
 * El administrador solo puede leer una conversación mientras su reporte esté abierto.
 */
const ChatReportsPanel = () => {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [verResueltos, setVerResueltos] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setReportes(await chatReportService.listar({ soloAbiertos: !verResueltos }));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [verResueltos]);

  useEffect(() => { cargar(); }, [cargar]);

  const abiertos = reportes.filter((r) => !r.resolved_at).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Flag className="h-5 w-5" /> Reportes de conversaciones</CardTitle>
        <CardDescription>
          {abiertos} {abiertos === 1 ? 'reporte abierto' : 'reportes abiertos'} del chat entre clientes y domiciliarios.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button size="sm" variant="outline" onClick={() => setVerResueltos((v) => !v)}>
          {verResueltos ? 'Ocultar resueltos' : 'Mostrar también los resueltos'}
        </Button>
        {cargando && <LoadingSpinner />}
        {!cargando && error && (
          <div className="text-center py-6 space-y-2">
            <p className="text-sm text-destructive">No pudimos cargar los reportes: {error}</p>
            <Button size="sm" variant="outline" onClick={cargar}>Reintentar</Button>
          </div>
        )}
        {!cargando && !error && reportes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No hay reportes {verResueltos ? '' : 'abiertos '}por ahora.</p>
        )}
        {!cargando && !error && reportes.map((r) => <ReporteFila key={r.id} reporte={r} onResuelto={cargar} />)}
      </CardContent>
    </Card>
  );
};

export default ChatReportsPanel;
