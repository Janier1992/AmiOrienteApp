import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const StoreConfigTab = ({ store: initialStore, setStore, user, onStoreCreated }) => {
  const [storeConfig, setStoreConfig] = useState({
    name: '',
    description: '',
    logo_url: '',
    address: '',
    contact_email: '',
    contact_phone: '',
    whatsapp: '',
    facebook_url: '',
    instagram_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);

  const handleLogoFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile]);

  useEffect(() => {
    if (initialStore) {
      setStoreConfig({
        name: initialStore.name || '',
        description: initialStore.description || '',
        logo_url: initialStore.logo_url || '',
        address: initialStore.address || '',
        contact_email: initialStore.contact_email || '',
        contact_phone: initialStore.contact_phone || '',
        whatsapp: initialStore.whatsapp || '',
        facebook_url: initialStore.facebook_url || '',
        instagram_url: initialStore.instagram_url || '',
      });
    }
  }, [initialStore]);

  const handleConfigChange = (e) => {
    setStoreConfig({ ...storeConfig, [e.target.name]: e.target.value });
  };

  const handleSaveConfig = async () => {
    if (!user) {
        toast({ title: "Error", description: "Debes iniciar sesión para guardar.", variant: "destructive" });
        return;
    }

    setLoading(true);
    let updatedStore;

    if (initialStore) {
        let payload = storeConfig;
        if (logoFile) {
            try {
                const logoPath = `logos/${initialStore.id}-${Date.now()}_${logoFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const { error: uploadError, data: uploadData } = await supabase.storage
                    .from('product-images')
                    .upload(logoPath, logoFile);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(uploadData.path);
                payload = { ...storeConfig, logo_url: urlData.publicUrl };
            } catch (uploadError) {
                toast({ title: "Error al subir el logo", description: uploadError.message, variant: "destructive" });
                setLoading(false);
                return;
            }
        }

        const { data, error } = await supabase
            .from('stores')
            .update(payload)
            .eq('id', initialStore.id)
            .select('*, service_categories(name)')
            .single();
        if (error) {
            toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Configuración guardada", description: "Los cambios se han guardado exitosamente" });
            updatedStore = data;
        }
    } else {
        toast({ title: "Error", description: "No se encontró una tienda para actualizar.", variant: "destructive" });
    }
    
    if (updatedStore) {
      setStore(updatedStore);
      setLogoFile(null);
      if(onStoreCreated) onStoreCreated();
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración del Negocio</CardTitle>
        <p className="text-sm text-gray-600">Actualiza los detalles públicos de tu negocio.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="config-name" className="block text-sm font-medium text-gray-700 mb-2">Nombre del Negocio</label>
            <Input id="config-name" type="text" name="name" value={storeConfig.name} onChange={handleConfigChange} />
          </div>
          <div>
            <label htmlFor="config-description" className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            <Textarea id="config-description" name="description" value={storeConfig.description} onChange={handleConfigChange} rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logotipo</label>
            <div className="flex items-center gap-4">
              {(logoPreviewUrl || storeConfig.logo_url) && (
                <img
                  src={logoPreviewUrl || storeConfig.logo_url}
                  alt="Logo actual"
                  className="h-16 w-16 rounded-lg object-cover border"
                />
              )}
              <Input id="config-logo-file" type="file" accept="image/*" onChange={handleLogoFileChange} className="max-w-xs" />
            </div>
            <Input
              id="config-logo_url"
              type="url"
              name="logo_url"
              value={storeConfig.logo_url}
              onChange={handleConfigChange}
              placeholder="O pega una URL de imagen directamente"
              className="mt-2"
            />
          </div>
          <div>
            <label htmlFor="config-address" className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
            <Input id="config-address" type="text" name="address" value={storeConfig.address} onChange={handleConfigChange} />
          </div>

          <div className="pt-2">
            <h3 className="font-semibold text-gray-900 border-b pb-1 mb-4">Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="config-contact_email">Correo de Contacto</Label>
                <Input id="config-contact_email" type="email" name="contact_email" value={storeConfig.contact_email} onChange={handleConfigChange} placeholder="correo@ejemplo.com" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="config-contact_phone">Teléfono / Celular</Label>
                <Input id="config-contact_phone" name="contact_phone" value={storeConfig.contact_phone} onChange={handleConfigChange} placeholder="+57 300..." className="mt-2" />
              </div>
              <div>
                <Label htmlFor="config-whatsapp">WhatsApp</Label>
                <Input id="config-whatsapp" name="whatsapp" value={storeConfig.whatsapp} onChange={handleConfigChange} placeholder="573001234567" className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">Usado para "Pedir/Reservar por WhatsApp" en turismo. Solo números, con indicativo del país.</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="font-semibold text-gray-900 border-b pb-1 mb-4">Redes Sociales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="config-facebook_url">Facebook</Label>
                <Input id="config-facebook_url" name="facebook_url" value={storeConfig.facebook_url} onChange={handleConfigChange} placeholder="https://facebook.com/..." className="mt-2" />
              </div>
              <div>
                <Label htmlFor="config-instagram_url">Instagram</Label>
                <Input id="config-instagram_url" name="instagram_url" value={storeConfig.instagram_url} onChange={handleConfigChange} placeholder="https://instagram.com/..." className="mt-2" />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveConfig} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
            <Settings className="mr-2 h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StoreConfigTab;