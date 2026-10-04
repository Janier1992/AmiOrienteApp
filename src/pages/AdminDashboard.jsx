
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Store, Building2, Ban, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { adminService } from '@/services/adminService';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { SupportTicketsPanel } from '@/components/admin/SupportTicketsPanel';

const STATUS_LABEL = {
    active: { label: 'Activa', variant: 'default' },
    suspended: { label: 'Suspendida', variant: 'destructive' },
    pending: { label: 'Pendiente', variant: 'secondary' },
};

const AdminDashboard = () => {
    const [stores, setStores] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    const fetchStores = useCallback(async () => {
        setIsLoading(true);
        const data = await adminService.obtenerTodasLasTiendas();
        setStores(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    const handleToggleStatus = async (store) => {
        const newStatus = store.status === 'suspended' ? 'active' : 'suspended';
        setUpdatingId(store.id);
        try {
            await adminService.actualizarEstadoTienda(store.id, newStatus);
            toast({
                title: newStatus === 'suspended' ? 'Negocio suspendido' : 'Negocio reactivado',
                description: store.name,
            });
            fetchStores();
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo actualizar el estado.', variant: 'destructive' });
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredStores = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return stores;
        return stores.filter(s =>
            s.name?.toLowerCase().includes(term) ||
            s.category?.toLowerCase().includes(term) ||
            s.profiles?.full_name?.toLowerCase().includes(term) ||
            s.profiles?.email?.toLowerCase().includes(term)
        );
    }, [stores, search]);

    const stats = useMemo(() => ({
        total: stores.length,
        active: stores.filter(s => s.status === 'active').length,
        suspended: stores.filter(s => s.status === 'suspended').length,
    }), [stores]);

    if (isLoading) return <LoadingSpinner />;

    return (
        <>
            <Helmet>
                <title>Panel de Administración - AmiOriente</title>
            </Helmet>
            <div className="container mx-auto px-4 py-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Building2 className="h-7 w-7" /> Panel de Administración
                    </h1>
                    <p className="text-muted-foreground">Gestiona todos los negocios registrados en la plataforma.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Negocios Totales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Activos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Suspendidos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Negocios Registrados</CardTitle>
                        <CardDescription>Busca por nombre, categoría o dueño.</CardDescription>
                        <Input
                            placeholder="Buscar..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-sm mt-2"
                        />
                    </CardHeader>
                    <CardContent>
                        {filteredStores.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <Store className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                                No se encontraron negocios.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Dueño</TableHead>
                                        <TableHead>Registrado</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStores.map(store => {
                                        const statusInfo = STATUS_LABEL[store.status] || STATUS_LABEL.active;
                                        return (
                                            <TableRow key={store.id}>
                                                <TableCell className="font-medium">{store.name}</TableCell>
                                                <TableCell>{store.category || '—'}</TableCell>
                                                <TableCell>
                                                    <div>{store.profiles?.full_name || '—'}</div>
                                                    <div className="text-xs text-muted-foreground">{store.profiles?.email}</div>
                                                </TableCell>
                                                <TableCell>{new Date(store.created_at).toLocaleDateString('es-CO')}</TableCell>
                                                <TableCell>
                                                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant={store.status === 'suspended' ? 'outline' : 'destructive'}
                                                        onClick={() => handleToggleStatus(store)}
                                                        disabled={updatingId === store.id}
                                                    >
                                                        {store.status === 'suspended' ? (
                                                            <><CheckCircle2 className="h-4 w-4 mr-1" /> Reactivar</>
                                                        ) : (
                                                            <><Ban className="h-4 w-4 mr-1" /> Suspender</>
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <SupportTicketsPanel />
            </div>
        </>
    );
};

export default AdminDashboard;
