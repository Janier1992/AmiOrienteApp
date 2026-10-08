
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Store, Building2, Ban, CheckCircle2, LogOut, SlidersHorizontal, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { adminService } from '@/services/adminService';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { SupportTicketsPanel } from '@/components/admin/SupportTicketsPanel';
import DriverDeclarationsPanel from '@/components/admin/DriverDeclarationsPanel';
import { getStoreTypeConfig } from '@/config/storeTypes';
import { FEATURE_MODULE_LABELS, COMMON_MODULE_LABELS } from '@/config/dashboardModules';
import { planService } from '@/services/planService';
import { FALLBACK_PLANS } from '@/config/plans';

const STATUS_LABEL = {
    active: { label: 'Activa', variant: 'default' },
    suspended: { label: 'Suspendida', variant: 'destructive' },
    pending: { label: 'Pendiente', variant: 'secondary' },
};

const AdminDashboard = () => {
    const { signOut } = useAuth();
    const [stores, setStores] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [updatingId, setUpdatingId] = useState(null);
    const [moduleEditingStore, setModuleEditingStore] = useState(null);
    const [pendingDisabled, setPendingDisabled] = useState([]);
    const [savingModules, setSavingModules] = useState(false);
    const [plans, setPlans] = useState(FALLBACK_PLANS);

    const fetchStores = useCallback(async () => {
        setIsLoading(true);
        const data = await adminService.obtenerTodasLasTiendas();
        setStores(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchStores();
        planService.listarPlanes().then(setPlans);
    }, [fetchStores]);

    const handleChangePlan = async (store, planId) => {
        setUpdatingId(store.id);
        try {
            await planService.cambiarPlanDelNegocio(store.id, planId);
            toast({ title: 'Plan actualizado', description: `${store.name} ahora tiene el plan ${plans.find(p => p.id === planId)?.name || planId}.` });
            await fetchStores();
        } catch (error) {
            toast({ title: 'No se pudo cambiar el plan', description: error.message, variant: 'destructive' });
        } finally {
            setUpdatingId(null);
        }
    };

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

    const handleOpenModules = (store) => {
        setModuleEditingStore(store);
        setPendingDisabled(store.disabled_modules || []);
    };

    const handleToggleModule = (moduleKey) => {
        setPendingDisabled(prev =>
            prev.includes(moduleKey) ? prev.filter(m => m !== moduleKey) : [...prev, moduleKey]
        );
    };

    const handleSaveModules = async () => {
        if (!moduleEditingStore) return;
        setSavingModules(true);
        try {
            await adminService.actualizarModulosTienda(moduleEditingStore.id, pendingDisabled);
            toast({ title: 'Módulos actualizados', description: moduleEditingStore.name });
            setModuleEditingStore(null);
            fetchStores();
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudieron guardar los módulos.', variant: 'destructive' });
        } finally {
            setSavingModules(false);
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
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Building2 className="h-7 w-7" /> Panel de Administración
                        </h1>
                        <p className="text-muted-foreground">Gestiona todos los negocios registrados en la plataforma.</p>
                    </div>
                    <Button variant="outline" onClick={signOut}>
                        <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
                    </Button>
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
                            <div className="text-2xl font-bold text-green-700">{stats.active}</div>
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
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStores.map(store => {
                                        const statusInfo = STATUS_LABEL[store.status] || STATUS_LABEL.active;
                                        return (
                                            <TableRow key={store.id}>
                                                <TableCell className="font-medium">
                                                    <button
                                                        onClick={() => handleOpenModules(store)}
                                                        className="hover:underline hover:text-primary text-left"
                                                        title="Ver y editar módulos de este negocio"
                                                    >
                                                        {store.name}
                                                    </button>
                                                </TableCell>
                                                <TableCell>{store.category || '—'}</TableCell>
                                                <TableCell>
                                                    <div>{store.profiles?.full_name || '—'}</div>
                                                    <div className="text-xs text-muted-foreground">{store.profiles?.email}</div>
                                                </TableCell>
                                                <TableCell>{new Date(store.created_at).toLocaleDateString('es-CO')}</TableCell>
                                                <TableCell>
                                                    <select
                                                        aria-label={`Plan de ${store.name}`}
                                                        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                                                        value={(Array.isArray(store.subscriptions) ? store.subscriptions[0] : store.subscriptions)?.plan_id || 'basic'}
                                                        disabled={updatingId === store.id}
                                                        onChange={(e) => handleChangePlan(store, e.target.value)}
                                                    >
                                                        {plans.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
                                                    </select>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleOpenModules(store)}
                                                    >
                                                        <SlidersHorizontal className="h-4 w-4 mr-1" /> Módulos
                                                    </Button>
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

                <DriverDeclarationsPanel />
            </div>

            <Dialog open={!!moduleEditingStore} onOpenChange={(open) => !open && setModuleEditingStore(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Módulos visibles — {moduleEditingStore?.name}</DialogTitle>
                        <DialogDescription>
                            Desmarca los módulos que no quieras que aparezcan en el dashboard de este negocio.
                        </DialogDescription>
                    </DialogHeader>
                    {moduleEditingStore && (() => {
                        const typeConfig = getStoreTypeConfig(
                            moduleEditingStore.service_categories?.name || moduleEditingStore.category
                        );
                        const featureKeys = (typeConfig?.features || []).filter(k => FEATURE_MODULE_LABELS[k]);
                        const commonKeys = Object.keys(COMMON_MODULE_LABELS);

                        const renderCheckbox = (key, label) => (
                            <label key={key} className="flex items-center gap-2 py-1.5 text-sm cursor-pointer">
                                <Checkbox
                                    checked={!pendingDisabled.includes(key)}
                                    onCheckedChange={() => handleToggleModule(key)}
                                />
                                {label}
                            </label>
                        );

                        return (
                            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                                {featureKeys.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                                            Específicos de {typeConfig.label}
                                        </p>
                                        {featureKeys.map(k => renderCheckbox(k, FEATURE_MODULE_LABELS[k]))}
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                                        Comunes a toda tienda
                                    </p>
                                    {commonKeys.map(k => renderCheckbox(k, COMMON_MODULE_LABELS[k]))}
                                </div>
                                <p className="text-xs text-muted-foreground italic">
                                    Resumen, Configuración y Soporte siempre están visibles.
                                </p>
                            </div>
                        );
                    })()}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModuleEditingStore(null)}>Cancelar</Button>
                        <Button onClick={handleSaveModules} disabled={savingModules}>
                            {savingModules && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AdminDashboard;
