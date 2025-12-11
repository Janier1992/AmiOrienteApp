
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus } from 'lucide-react';

const AdminTab = ({ storeId }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Equipo de Trabajo</CardTitle>
                    <CardDescription>Gestiona quién tiene acceso a este panel.</CardDescription>
                </div>
                <Button variant="outline">
                    <UserPlus className="h-4 w-4 mr-2" /> Invitar Miembro
                </Button>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50">
                    <Users className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p>Aún no has agregado miembros a tu equipo.</p>
                    <p className="text-sm mt-1">Invita a administradores o empleados para ayudarte.</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default AdminTab;
