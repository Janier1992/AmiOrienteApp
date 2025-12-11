
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const ProfileTab = () => {
    const { store, setStore } = useStoreDashboard();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: store?.name || '',
        address: store?.address || '',
        description: store?.description || '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('stores')
                .update(formData)
                .eq('id', store.id)
                .select()
                .single();
            
            if (error) throw error;
            
            setStore(data);
            toast({ title: "Perfil actualizado", description: "Los cambios se han guardado correctamente." });
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron guardar los cambios.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configuración del Negocio</CardTitle>
                <CardDescription>Actualiza la información pública de tu negocio.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSave} className="space-y-4 max-w-lg">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Negocio</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Dirección Física</Label>
                        <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción Corta</Label>
                        <Input id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Ej: La mejor cosecha de Rionegro" />
                    </div>
                    <div className="pt-4">
                        <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default ProfileTab;
