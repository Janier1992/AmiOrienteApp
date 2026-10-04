
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LifeBuoy } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supportService } from '@/services/supportService';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const STATUS_LABEL = {
    abierto: { label: 'Abierto', variant: 'destructive' },
    en_proceso: { label: 'En proceso', variant: 'secondary' },
    resuelto: { label: 'Resuelto', variant: 'default' },
};

const SupportTab = ({ storeId }) => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchTickets = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const data = await supportService.obtenerMisTickets(user.id);
        setTickets(data);
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) return;

        setSubmitting(true);
        try {
            await supportService.crearTicket({ storeId, subject, message });
            toast({ title: 'Solicitud enviada', description: 'El equipo de soporte la revisará pronto.' });
            setSubject('');
            setMessage('');
            fetchTickets();
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo enviar la solicitud.', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LifeBuoy className="h-5 w-5" /> Nueva Solicitud de Soporte
                    </CardTitle>
                    <CardDescription>¿Tienes un problema o una pregunta? Escríbele al equipo de AmiOriente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            placeholder="Asunto (ej. No puedo actualizar mi stock)"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                        />
                        <Textarea
                            placeholder="Describe el problema con el mayor detalle posible..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            required
                        />
                        <Button type="submit" disabled={submitting}>
                            {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Mis Solicitudes</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            <LifeBuoy className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                            Aún no has enviado ninguna solicitud.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tickets.map(ticket => {
                                const statusInfo = STATUS_LABEL[ticket.status] || STATUS_LABEL.abierto;
                                return (
                                    <div key={ticket.id} className="border rounded-lg p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-medium">{ticket.subject}</p>
                                                <p className="text-sm text-muted-foreground mt-1">{ticket.message}</p>
                                            </div>
                                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                                        </div>
                                        {ticket.admin_response && (
                                            <div className="mt-3 pt-3 border-t text-sm">
                                                <p className="font-medium text-primary">Respuesta del equipo:</p>
                                                <p className="text-muted-foreground mt-1">{ticket.admin_response}</p>
                                            </div>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {new Date(ticket.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default SupportTab;
