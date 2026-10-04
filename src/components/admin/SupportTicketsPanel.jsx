
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { LifeBuoy } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supportService } from '@/services/supportService';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const STATUS_LABEL = {
    abierto: { label: 'Abierto', variant: 'destructive' },
    en_proceso: { label: 'En proceso', variant: 'secondary' },
    resuelto: { label: 'Resuelto', variant: 'default' },
};

const TicketRow = ({ ticket, onUpdated }) => {
    const [response, setResponse] = useState(ticket.admin_response || '');
    const [saving, setSaving] = useState(null); // holds the status being saved, or null

    const handleSave = async (status) => {
        setSaving(status);
        try {
            await supportService.actualizarTicket(ticket.id, { status, admin_response: response });
            toast({ title: 'Ticket actualizado' });
            onUpdated();
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo actualizar el ticket.', variant: 'destructive' });
        } finally {
            setSaving(null);
        }
    };

    const statusInfo = STATUS_LABEL[ticket.status] || STATUS_LABEL.abierto;

    return (
        <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground">
                        {ticket.stores?.name || 'Sin tienda'} · {ticket.profiles?.full_name || ticket.profiles?.email} · {new Date(ticket.created_at).toLocaleDateString('es-CO')}
                    </p>
                </div>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <p className="text-sm">{ticket.message}</p>
            <Textarea
                placeholder="Escribe una respuesta para el negocio..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={2}
            />
            <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={saving !== null} onClick={() => handleSave('en_proceso')}>
                    {saving === 'en_proceso' ? 'Guardando...' : 'Marcar en proceso'}
                </Button>
                <Button size="sm" disabled={saving !== null} onClick={() => handleSave('resuelto')}>
                    {saving === 'resuelto' ? 'Guardando...' : 'Marcar resuelto'}
                </Button>
            </div>
        </div>
    );
};

export const SupportTicketsPanel = () => {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTickets = useCallback(async () => {
        setIsLoading(true);
        const data = await supportService.obtenerTodosLosTickets();
        setTickets(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    if (isLoading) return <LoadingSpinner />;

    const open = tickets.filter(t => t.status !== 'resuelto');
    const resolved = tickets.filter(t => t.status === 'resuelto');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <LifeBuoy className="h-5 w-5" /> Solicitudes de Soporte
                </CardTitle>
                <CardDescription>
                    {open.length} abierta{open.length !== 1 ? 's' : ''} / pendiente{open.length !== 1 ? 's' : ''} de resolver.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {tickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No hay solicitudes de soporte todavía.</p>
                ) : (
                    [...open, ...resolved].map(ticket => (
                        <TicketRow key={ticket.id} ticket={ticket} onUpdated={fetchTickets} />
                    ))
                )}
            </CardContent>
        </Card>
    );
};

export default SupportTicketsPanel;
