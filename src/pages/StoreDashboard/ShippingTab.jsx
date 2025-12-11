import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit, Truck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const ShippingTab = ({ storeId }) => {
  const [zones, setZones] = useState([]);
  const [rates, setRates] = useState({});
  const [newZone, setNewZone] = useState({ name: '' });
  const [newRate, setNewRate] = useState({ zone_id: '', name: '', price: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    const { data: zonesData, error: zonesError } = await supabase.from('shipping_zones').select('*').eq('store_id', storeId);
    if (zonesError) {
      toast({ title: "Error", description: "No se pudieron cargar las zonas de envío.", variant: "destructive" });
    } else {
      setZones(zonesData);
      const ratesData = {};
      for (const zone of zonesData) {
        const { data: rateData, error: rateError } = await supabase.from('shipping_rates').select('*').eq('zone_id', zone.id);
        if (!rateError) {
          ratesData[zone.id] = rateData;
        }
      }
      setRates(ratesData);
    }
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddZone = async () => {
    const { data, error } = await supabase.from('shipping_zones').insert({ ...newZone, store_id: storeId }).select().single();
    if (error) {
      toast({ title: "Error", description: "No se pudo agregar la zona.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Zona de envío agregada." });
      setZones([...zones, data]);
      setNewZone({ name: '' });
    }
  };

  const handleDeleteZone = async (zoneId) => {
    const { error } = await supabase.from('shipping_zones').delete().eq('id', zoneId);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar la zona.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Zona eliminada." });
      fetchData();
    }
  };

  const handleAddRate = async (zoneId) => {
    const { data, error } = await supabase.from('shipping_rates').insert({ ...newRate, zone_id: zoneId, price: parseFloat(newRate.price) }).select().single();
    if (error) {
      toast({ title: "Error", description: "No se pudo agregar la tarifa.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Tarifa de envío agregada." });
      setRates(prev => ({ ...prev, [zoneId]: [...(prev[zoneId] || []), data] }));
      setNewRate({ zone_id: '', name: '', price: '' });
    }
  };

  const handleDeleteRate = async (rateId) => {
    const { error } = await supabase.from('shipping_rates').delete().eq('id', rateId);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar la tarifa.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Tarifa eliminada." });
      fetchData();
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Zonas de Envío</CardTitle>
          <CardDescription>Define las regiones a las que realizas envíos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Nombre de la nueva zona (ej. Local)" value={newZone.name} onChange={(e) => setNewZone({ name: e.target.value })} />
            <Button onClick={handleAddZone}><Plus className="mr-2 h-4 w-4" /> Agregar Zona</Button>
          </div>
          {zones.map(zone => (
            <Card key={zone.id} className="mb-4">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <CardTitle className="text-lg">{zone.name}</CardTitle>
                <Button variant="destructive" size="icon" onClick={() => handleDeleteZone(zone.id)}><Trash2 className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Tarifas para {zone.name}</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rates[zone.id]?.map(rate => (
                      <TableRow key={rate.id}>
                        <TableCell>{rate.name}</TableCell>
                        <TableCell className="text-right">${Number(rate.price).toLocaleString()}</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDeleteRate(rate.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex gap-2 mt-4">
                  <Input placeholder="Nombre de tarifa (ej. Estándar)" value={newRate.name} onChange={(e) => setNewRate({...newRate, name: e.target.value})} />
                  <Input type="number" placeholder="Precio" value={newRate.price} onChange={(e) => setNewRate({...newRate, price: e.target.value})} />
                  <Button onClick={() => handleAddRate(zone.id)}>Añadir Tarifa</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {zones.length === 0 && !loading && (
            <div className="text-center py-10 border-dashed border-2 rounded-lg">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>Aún no has configurado zonas de envío.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShippingTab;