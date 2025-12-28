
import React, { useState, useEffect } from 'react';
import { Wrench, Calendar, CheckCircle, AlertTriangle, Plus, History, Save, Trash2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import storeService from '@/services/storeService';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const KitchenMaintenanceView = ({ storeId }) => {
    const [equipment, setEquipment] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Dialog States
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [logs, setLogs] = useState([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    // Form States
    const [newEquipo, setNewEquipo] = useState({ name: '', serial_number: '', purchase_date: '', status: 'operational', next_maintenance_date: '' });
    const [newLog, setNewLog] = useState({ type: 'preventive', description: '', cost: '', performed_by: '', date: new Date().toISOString().split('T')[0] });

    // Fetch Equipment
    const loadEquipment = async () => {
        if (!storeId) return;
        setIsLoading(true);
        try {
            const data = await storeService.getEquipment(storeId);
            setEquipment(data);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los equipos.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadEquipment();
    }, [storeId]);

    // Handlers
    const handleAddEquipment = async () => {
        if (!newEquipo.name) {
            toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
            return;
        }
        try {
            await storeService.addEquipment({ ...newEquipo, store_id: storeId });
            toast({ title: "Éxito", description: "Equipo registrado correctamente." });
            setIsAddOpen(false);
            setNewEquipo({ name: '', serial_number: '', purchase_date: '', status: 'operational', next_maintenance_date: '' });
            loadEquipment();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo registrar el equipo.", variant: "destructive" });
        }
    };

    const handleDeleteEquipment = async (id) => {
        if (!confirm("¿Estás seguro de eliminar este equipo? Se borrará su historial.")) return;
        try {
            await storeService.deleteEquipment(id);
            toast({ title: "Eliminado", description: "Equipo eliminado del sistema." });
            loadEquipment();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
        }
    };

    const openLogs = async (equipo) => {
        setSelectedEquipment(equipo);
        setIsLogOpen(true);
        setIsLoadingLogs(true);
        try {
            const data = await storeService.getMaintenanceLogs(equipo.id);
            setLogs(data);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cargar la bitácora." });
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const handleAddLog = async () => {
        if (!newLog.description) return;
        try {
            await storeService.addMaintenanceLog({ ...newLog, equipment_id: selectedEquipment.id });

            // Logic: If corrective, maybe set status to in_repair? 
            // Logic: If preventive, updates next maintenance?
            // For now, simple logging.

            toast({ title: "Registrado", description: "Mantenimiento registrado." });

            // Refresh logs
            const data = await storeService.getMaintenanceLogs(selectedEquipment.id);
            setLogs(data);
            setNewLog({ type: 'preventive', description: '', cost: '', performed_by: '', date: new Date().toISOString().split('T')[0] });

            // Should verify if we need to update equipment status or dates based on this log?
            // Let's assume user manually updates equipment details separately or we enhance this later.
        } catch (error) {
            toast({ title: "Error", description: "Fallo al registrar mantenimiento.", variant: "destructive" });
        }
    };

    if (isLoading) return <LoadingSpinner text="Cargando inventario..." />;

    return (
        <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-orange-900 flex items-center gap-3">
                        <Wrench className="h-8 w-8 text-orange-600" />
                        Mantenimiento de Equipos
                    </h1>
                    <p className="text-orange-800 mt-2">Gestiona el estado y cronograma de mantenimiento de tu maquinaria.</p>
                </div>
                <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setIsAddOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Registrar Equipo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {equipment.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <Wrench className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No hay equipos registrados aún.</p>
                    </div>
                )}

                {equipment.map((item) => (
                    <Card key={item.id} className={`border-l-4 shadow-sm hover:shadow-md transition-shadow ${item.status === 'maintenance_needed' || item.status === 'in_repair' ? 'border-l-red-500' : 'border-l-green-500'
                        }`}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-bold text-gray-800 truncate" title={item.name}>{item.name}</CardTitle>
                                <Badge variant={item.status === 'operational' ? 'default' : 'destructive'} className={item.status === 'operational' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                                    {item.status === 'operational' ? 'Operativo' : item.status === 'maintenance_needed' ? 'Mantenimiento Req.' : item.status === 'in_repair' ? 'En Reparación' : 'Retirado'}
                                </Badge>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{item.serial_number ? `S/N: ${item.serial_number}` : 'Sin N/S'}</p>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm">
                                <div className={`flex items-center font-medium ${item.next_maintenance_date && new Date(item.next_maintenance_date) < new Date() ? 'text-red-600' : 'text-blue-600'
                                    }`}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    <span>Próximo: {item.next_maintenance_date || 'No programado'}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-2 flex gap-2 border-t">
                            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openLogs(item)}>
                                <History className="h-3 w-3 mr-1" /> Bitácora
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2" onClick={() => handleDeleteEquipment(item.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Add Equipment Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Nuevo Equipo</DialogTitle>
                        <DialogDescription>Ingresa los datos técnicos del equipo.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre del Equipo</Label>
                            <Input value={newEquipo.name} onChange={e => setNewEquipo({ ...newEquipo, name: e.target.value })} placeholder="Ej. Horno Industrial" />
                        </div>
                        <div className="space-y-2">
                            <Label>Número de Serie</Label>
                            <Input value={newEquipo.serial_number} onChange={e => setNewEquipo({ ...newEquipo, serial_number: e.target.value })} placeholder="Opcional" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Fecha Compra</Label>
                                <Input type="date" value={newEquipo.purchase_date} onChange={e => setNewEquipo({ ...newEquipo, purchase_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Prox. Mantenimiento</Label>
                                <Input type="date" value={newEquipo.next_maintenance_date} onChange={e => setNewEquipo({ ...newEquipo, next_maintenance_date: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddEquipment}>Guardar Equipo</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Maintenance Logs Dialog */}
            <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Bitácora: {selectedEquipment?.name}</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
                        {/* List */}
                        <div className="border rounded-lg p-4 overflow-y-auto space-y-3 bg-slate-50">
                            <h4 className="font-semibold text-sm mb-2 flex items-center"><History className="h-4 w-4 mr-2" /> Historial</h4>
                            {isLoadingLogs ? <p className="text-xs text-gray-500">Cargando...</p> : logs.length === 0 ? <p className="text-xs text-gray-400 italic">Sin registros.</p> : (
                                logs.map(log => (
                                    <div key={log.id} className="bg-white p-3 rounded border text-sm shadow-sm">
                                        <div className="flex justify-between font-semibold text-xs text-gray-500 mb-1">
                                            <span>{log.date}</span>
                                            <span className={log.type === 'corrective' ? 'text-red-500' : 'text-blue-500 uppercase'}>{log.type}</span>
                                        </div>
                                        <p className="text-gray-800">{log.description}</p>
                                        {(log.cost > 0 || log.performed_by) && (
                                            <div className="mt-2 text-xs text-gray-500 flex gap-4 pt-1 border-t border-gray-100">
                                                {log.cost > 0 && <span>Coste: ${Number(log.cost).toLocaleString()}</span>}
                                                {log.performed_by && <span>Por: {log.performed_by}</span>}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Form */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm mb-2 flex items-center"><FileText className="h-4 w-4 mr-2" /> Nuevo Registro</h4>
                            <div className="bg-white p-4 rounded-lg border space-y-3">
                                <div>
                                    <Label className="text-xs">Tipo</Label>
                                    <Select value={newLog.type} onValueChange={v => setNewLog({ ...newLog, type: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="preventive">Preventivo</SelectItem>
                                            <SelectItem value="corrective">Correctivo (Reparación)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs">Fecha</Label>
                                        <Input type="date" className="h-8" value={newLog.date} onChange={e => setNewLog({ ...newLog, date: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Costo</Label>
                                        <Input type="number" className="h-8" placeholder="0" value={newLog.cost} onChange={e => setNewLog({ ...newLog, cost: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Realizado por</Label>
                                    <Input className="h-8" placeholder="Técnico / Empresa" value={newLog.performed_by} onChange={e => setNewLog({ ...newLog, performed_by: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="text-xs">Descripción</Label>
                                    <Textarea className="h-20 text-xs" placeholder="Detalle del trabajo realizado..." value={newLog.description} onChange={e => setNewLog({ ...newLog, description: e.target.value })} />
                                </div>
                                <Button className="w-full" size="sm" onClick={handleAddLog}>
                                    <Save className="h-3 w-3 mr-2" /> Guardar Registro
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLogOpen(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default KitchenMaintenanceView;
