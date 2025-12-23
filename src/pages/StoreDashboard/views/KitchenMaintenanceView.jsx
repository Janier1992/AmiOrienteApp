
import React, { useState } from 'react';
import { Wrench, Calendar, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const KitchenMaintenanceView = () => {
    // Mock Data
    const [equipment, setEquipment] = useState([
        { id: 1, name: 'Horno Industrial A', lastService: '2023-11-15', nextService: '2024-01-15', status: 'ok' },
        { id: 2, name: 'Nevera Carnes', lastService: '2023-10-01', nextService: '2023-12-01', status: 'urgent' },
        { id: 3, name: 'Batidora 20L', lastService: '2023-12-01', nextService: '2024-03-01', status: 'ok' },
    ]);

    return (
        <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl">
                <h1 className="text-3xl font-extrabold text-orange-900 flex items-center gap-3">
                    <Wrench className="h-8 w-8 text-orange-600" />
                    Mantenimiento de Equipos
                </h1>
                <p className="text-orange-800 mt-2">Gestiona el estado y cronograma de mantenimiento de tu maquinaria para evitar paradas.</p>
            </div>

            <div className="flex justify-end">
                <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="h-4 w-4 mr-2" /> Registrar Equipo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {equipment.map((item) => (
                    <Card key={item.id} className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-bold text-gray-800">{item.name}</CardTitle>
                                {item.status === 'ok' ? (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Operativo</Badge>
                                ) : (
                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none animate-pulse">Servicio Req.</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center text-gray-600">
                                    <CheckCircle className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>Último: {item.lastService}</span>
                                </div>
                                <div className={`flex items-center font-medium ${item.status === 'urgent' ? 'text-red-600' : 'text-blue-600'}`}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    <span>Próximo: {item.nextService}</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                                <Button variant="outline" size="sm" className="w-full text-xs">Bitácora</Button>
                                <Button size="sm" className="w-full text-xs bg-slate-800 text-white">Programar</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default KitchenMaintenanceView;
