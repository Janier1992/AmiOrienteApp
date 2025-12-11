import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Landmark } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

export const TaxesTab = ({ storeId }) => {
  const [taxes, setTaxes] = useState([]);
  const [newTax, setNewTax] = useState({ name: '', rate: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    const { data, error } = await supabase.from('taxes').select('*').eq('store_id', storeId);
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los impuestos.", variant: "destructive" });
    } else {
      setTaxes(data);
    }
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddTax = async () => {
    const { data, error } = await supabase.from('taxes').insert({
      ...newTax,
      store_id: storeId,
      rate: parseFloat(newTax.rate) / 100,
    }).select().single();

    if (error) {
      toast({ title: "Error", description: "No se pudo agregar el impuesto.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Impuesto agregado." });
      setTaxes([...taxes, data]);
      setNewTax({ name: '', rate: '' });
    }
  };

  const handleDeleteTax = async (taxId) => {
    const { error } = await supabase.from('taxes').delete().eq('id', taxId);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar el impuesto.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Impuesto eliminado." });
      fetchData();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impuestos</CardTitle>
        <CardDescription>Configura las tasas de impuestos para tus productos.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4 p-4 border rounded-lg">
          <Input placeholder="Nombre del impuesto (ej. IVA)" value={newTax.name} onChange={(e) => setNewTax({ ...newTax, name: e.target.value })} />
          <Input type="number" placeholder="Tasa (%)" value={newTax.rate} onChange={(e) => setNewTax({ ...newTax, rate: e.target.value })} />
          <Button onClick={handleAddTax}><Plus className="mr-2 h-4 w-4" /> Agregar Impuesto</Button>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Tasa</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxes.map(tax => (
                <TableRow key={tax.id}>
                  <TableCell>{tax.name}</TableCell>
                  <TableCell className="text-right">{(tax.rate * 100).toFixed(2)}%</TableCell>
                  <TableCell className="text-right">
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteTax(tax.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {taxes.length === 0 && !loading && (
          <div className="text-center py-10 border-dashed border-2 rounded-lg">
            <Landmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p>Aún no has configurado ninguna tasa de impuesto.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};