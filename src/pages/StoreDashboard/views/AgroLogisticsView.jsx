
import React from 'react';
import { Truck, MapPin, Package, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AgroLogisticsView = () => {
    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                <h1 className="text-3xl font-extrabold text-blue-900 flex items-center gap-3">
                    <Truck className="h-8 w-8 text-blue-600" />
                    Logística y Envíos
                </h1>
                <p className="text-blue-700 mt-2">Gestiona el despacho de tus cosechas, genera guías de transporte y rastrea envíos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-blue-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Pedidos por Despachar</CardTitle>
                        <div className="text-3xl font-bold text-slate-800">12</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-blue-600 flex items-center mt-1">
                            <Package className="h-3 w-3 mr-1" />
                            3 urgentes para hoy
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-blue-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">En Tránsito</CardTitle>
                        <div className="text-3xl font-bold text-slate-800">5</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-green-600 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            Llegada estimada: Hoy
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-blue-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Costo Logístico (Mes)</CardTitle>
                        <div className="text-3xl font-bold text-slate-800">$1.2M</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                            Promedio $15.000 / envío
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-gray-200">
                <CardHeader>
                    <CardTitle>Operación Logística</CardTitle>
                    <CardDescription>Conexión directa con transportadoras y SIPOST</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="pending" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="pending">Pendientes de Guía</TabsTrigger>
                            <TabsTrigger value="guides">Guías Generadas</TabsTrigger>
                            <TabsTrigger value="config">Configuración Tarifa</TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending" className="space-y-4">
                            <div className="rounded-md border border-gray-100 overflow-hidden">
                                <div className="bg-gray-50 p-3 text-sm font-medium text-gray-700 grid grid-cols-4">
                                    <span>Pedido</span>
                                    <span>Destino</span>
                                    <span>Peso Est.</span>
                                    <span>Acción</span>
                                </div>
                                {/* Mock Rows */}
                                <div className="p-3 text-sm text-gray-600 grid grid-cols-4 items-center border-t border-gray-50 hover:bg-gray-50">
                                    <span className="font-bold">#ORD-001</span>
                                    <span>Medellín, Pob...</span>
                                    <span>50 Kg</span>
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8">
                                        Generar Guía
                                    </Button>
                                </div>
                                <div className="p-3 text-sm text-gray-600 grid grid-cols-4 items-center border-t border-gray-50 hover:bg-gray-50">
                                    <span className="font-bold">#ORD-003</span>
                                    <span>Rionegro, Cen...</span>
                                    <span>120 Kg</span>
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8">
                                        Generar Guía
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="guides">
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <FileText className="h-12 w-12 mb-2 opacity-50" />
                                <p>No hay guías generadas recientemente</p>
                            </div>
                        </TabsContent>

                        <TabsContent value="config">
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-yellow-800 text-sm flex items-start gap-3">
                                <ExternalLink className="h-5 w-5 mt-0.5" />
                                <div>
                                    <strong>Integración SIPOST no configurada</strong>
                                    <p className="mt-1">Para habilitar la generación automática de guías, debes conectar tu cuenta de SIPOST o Transportadora aliada.</p>
                                    <Button variant="outline" size="sm" className="mt-2 bg-yellow-100 border-yellow-200 hover:bg-yellow-200 text-yellow-900">
                                        Conectar ahora
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default AgroLogisticsView;
