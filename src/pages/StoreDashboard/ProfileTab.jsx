
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

/**
 * Componente para editar la configuración y perfil del negocio.
 * Permite actualizar nombre, dirección, descripción y datos de contacto.
 */
const ProfileTab = () => {
    const { store, setStore } = useStoreDashboard();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: store?.name || '',
        address: store?.address || '',
        description: store?.description || '',
        contact_email: store?.contact_email || '',
        contact_phone: store?.contact_phone || '',
        whatsapp: store?.whatsapp || '',
        facebook_url: store?.facebook_url || '',
        instagram_url: store?.instagram_url || '',
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
                <form onSubmit={handleSave} className="space-y-6 max-w-lg">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b pb-1">Información Básica</h3>
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
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b pb-1">Contacto</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contact_email">Correo de Contacto</Label>
                                <Input id="contact_email" name="contact_email" type="email" value={formData.contact_email} onChange={handleChange} placeholder="correo@ejemplo.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact_phone">Teléfono / Celular</Label>
                                <Input id="contact_phone" name="contact_phone" value={formData.contact_phone} onChange={handleChange} placeholder="+57 300..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="whatsapp">WhatsApp (Link o Número)</Label>
                                <Input id="whatsapp" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="57300..." />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b pb-1">Redes Sociales</h3>
                        <div className="space-y-2">
                            <Label htmlFor="facebook_url">Facebook URL</Label>
                            <Input id="facebook_url" name="facebook_url" value={formData.facebook_url} onChange={handleChange} placeholder="https://facebook.com/..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instagram_url">Instagram URL</Label>
                            <Input id="instagram_url" name="instagram_url" value={formData.instagram_url} onChange={handleChange} placeholder="https://instagram.com/..." />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 w-full md:w-auto">
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
