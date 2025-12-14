import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Save, Store as StoreIcon } from 'lucide-react';

/**
 * Pestaña de Configuración Genérica (Base Model)
 * Permite editar nombre, descripción, etc.
 */
const StoreSettingsTab = () => {
    const { store, updateStoreSettings } = useStoreDashboard();
    const [formData, setFormData] = useState({
        name: store?.name || '',
        description: store?.description || '',
        phone: store?.phone || '',
        address: store?.address || ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateStoreSettings(formData);
            toast({ title: "Configuración guardada" });
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <StoreIcon className="h-5 w-5" /> Información del Negocio
                    </CardTitle>
                    <CardDescription>Detalles públicos de tu tienda en MiOriente</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nombre del Negocio</Label>
                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Teléfono de Contacto</Label>
                                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Dirección Física</Label>
                                <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default StoreSettingsTab;
