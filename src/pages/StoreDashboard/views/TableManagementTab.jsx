import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const TableManagementTab = ({ storeId }) => {
    const [tables, setTables] = useState([]);

    useEffect(() => {
        if (storeId) fetchTables();
    }, [storeId]);

    const fetchTables = async () => {
        const { data } = await supabase.from('restaurant_tables').select('*').eq('store_id', storeId).order('number');
        if (data) setTables(data);
    };

    const addTable = async () => {
        const number = prompt("Número de mesa:");
        if (!number) return;
        const { error } = await supabase.from('restaurant_tables').insert({ store_id: storeId, number, capacity: 4 });
        if (error) toast({ title: "Error", description: error.message });
        else fetchTables();
    };

    const toggleStatus = async (table) => {
        const newStatus = table.status === 'available' ? 'occupied' : 'available';
        await supabase.from('restaurant_tables').update({ status: newStatus }).eq('id', table.id);
        fetchTables();
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestión de Mesas</CardTitle>
                <Button onClick={addTable}>+ Agregar Mesa</Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {tables.map(table => (
                        <div
                            key={table.id}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${table.status === 'occupied' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                                }`}
                            onClick={() => toggleStatus(table)}
                        >
                            <div className="text-2xl font-bold text-center mb-2">{table.number}</div>
                            <Badge variant={table.status === 'occupied' ? 'destructive' : 'default'} className="w-full justify-center">
                                {table.status === 'occupied' ? 'Ocupada' : 'Libre'}
                            </Badge>
                        </div>
                    ))}
                    {tables.length === 0 && <p className="col-span-full text-center text-gray-500">Agrega mesas para gestionarlas aquí.</p>}
                </div>
            </CardContent>
        </Card>
    );
};

export default TableManagementTab;
