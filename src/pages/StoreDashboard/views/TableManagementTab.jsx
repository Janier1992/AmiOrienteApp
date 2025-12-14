import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useRestaurantStore } from '@/stores/useRestaurantStore';

const TableManagementTab = ({ storeId }) => {
    // Modular Logic from specialized store
    const { tables, fetchTables, addTable, toggleTableStatus, isLoadingTables, error } = useRestaurantStore();

    useEffect(() => {
        if (storeId) fetchTables(storeId);
    }, [storeId, fetchTables]);

    const handleAddTable = async () => {
        const number = prompt("Número de mesa:");
        if (!number) return;

        try {
            await addTable({ store_id: storeId, number, capacity: 4 });
            toast({ title: "Mesa agregada" });
        } catch (err) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    if (isLoadingTables && tables.length === 0) return <div className="p-4">Cargando mesas...</div>;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestión de Mesas</CardTitle>
                <Button onClick={handleAddTable}>+ Agregar Mesa</Button>
            </CardHeader>
            <CardContent>
                {error && <p className="text-red-500 mb-4">Error: {error}</p>}

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {tables.map(table => (
                        <div
                            key={table.id}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${table.status === 'occupied' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                                }`}
                            onClick={() => toggleTableStatus(table.id, table.status)}
                        >
                            <div className="text-2xl font-bold text-center mb-2">{table.number}</div>
                            <Badge variant={table.status === 'occupied' ? 'destructive' : 'default'} className="w-full justify-center">
                                {table.status === 'occupied' ? 'Ocupada' : 'Libre'}
                            </Badge>
                        </div>
                    ))}
                    {tables.length === 0 && !isLoadingTables && <p className="col-span-full text-center text-gray-500">Agrega mesas para gestionarlas aquí.</p>}
                </div>
            </CardContent>
        </Card>
    );
};

export default TableManagementTab;
