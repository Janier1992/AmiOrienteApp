import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/customSupabaseClient';
import { MapPin, Plus, Trash2, Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AddressesTab = ({ userId }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: '', address_line: '', city: 'Rionegro', is_default: false });

  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });
      if (error) throw error;
      setAddresses(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.address_line || !newAddress.name) {
      toast({ variant: "destructive", title: "Error", description: "Completa los campos obligatorios." });
      return;
    }
    
    try {
      if (newAddress.is_default && addresses.length > 0) {
        // Unset other defaults
        await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', userId);
      }

      const { data, error } = await supabase
        .from('user_addresses')
        .insert([{ ...newAddress, user_id: userId }])
        .select();

      if (error) throw error;

      setAddresses([...(newAddress.is_default ? [] : addresses), data[0], ...(newAddress.is_default ? addresses : [])]);
      setIsAdding(false);
      setNewAddress({ name: '', address_line: '', city: 'Rionegro', is_default: false });
      toast({ title: "Dirección agregada", description: "Tu nueva dirección ha sido guardada." });
      fetchAddresses(); // Refresh to ensure order
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('user_addresses').delete().eq('id', id);
      if (error) throw error;
      setAddresses(addresses.filter(a => a.id !== id));
      toast({ title: "Eliminado", description: "Dirección eliminada correctamente." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar." });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Mis Direcciones</CardTitle>
          <CardDescription>Gestiona tus lugares de entrega frecuentes.</CardDescription>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Nueva Dirección</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nueva Dirección</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre (ej. Casa, Trabajo)</label>
                <Input value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} placeholder="Ej: Apartamento Centro" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dirección Completa</label>
                <Input value={newAddress.address_line} onChange={e => setNewAddress({...newAddress, address_line: e.target.value})} placeholder="Calle 123 # 45-67" />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="default-addr"
                  checked={newAddress.is_default} 
                  onChange={e => setNewAddress({...newAddress, is_default: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <label htmlFor="default-addr" className="text-sm">Establecer como predeterminada</label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddAddress}>Guardar Dirección</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="flex items-start justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
              <div className="flex gap-3">
                <div className={`p-2 rounded-full ${addr.is_default ? 'bg-primary/10 text-primary' : 'bg-secondary'}`}>
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{addr.name}</h4>
                    {addr.is_default && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Predeterminada</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{addr.address_line}</p>
                  <p className="text-xs text-muted-foreground">{addr.city}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(addr.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {!loading && addresses.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No tienes direcciones guardadas.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AddressesTab;