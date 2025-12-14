import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, ShoppingBag } from 'lucide-react';

/**
 * Pestaña de Clientes Genérica (Base Model)
 * Muestra lista de clientes basada en pedidos históricos.
 */
const StoreCustomersTab = () => {
    const { store, customers, fetchCustomers, isLoadingCustomers } = useStoreDashboard();

    useEffect(() => {
        if (store?.id) fetchCustomers(store.id);
    }, [store?.id]);

    if (isLoadingCustomers) return <div className="p-8 text-center text-muted-foreground">Cargando clientes...</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" /> Mis Clientes
                    </CardTitle>
                    <CardDescription>Personas que han realizado compras en tu negocio.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customers.map((customer) => (
                            <div key={customer.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={customer.avatar_url} />
                                    <AvatarFallback>{customer.full_name?.substring(0, 2).toUpperCase() || 'NA'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">{customer.full_name || 'Desconocido'}</p>
                                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="secondary" className="text-xs font-normal">
                                            <ShoppingBag className="h-3 w-3 mr-1" /> {customer.total_orders} pedidos
                                        </Badge>
                                        <span className="text-xs font-bold text-green-600">
                                            ${Number(customer.total_spent).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {customers.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">Aún no tienes clientes registrados.</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default StoreCustomersTab;
