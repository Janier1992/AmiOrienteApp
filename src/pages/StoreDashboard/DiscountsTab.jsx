import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Percent } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const DiscountsTab = ({ storeId }) => {
  const [discounts, setDiscounts] = useState([]);
  const [newDiscount, setNewDiscount] = useState({
    code: '',
    discount_type: 'percentage',
    value: '',
    usage_limit: '',
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    const { data, error } = await supabase.from('discounts').select('*').eq('store_id', storeId);
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los descuentos.", variant: "destructive" });
    } else {
      setDiscounts(data);
    }
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    setNewDiscount({ ...newDiscount, [e.target.name]: e.target.value });
  };

  const handleAddDiscount = async () => {
    const { data, error } = await supabase.from('discounts').insert({
      ...newDiscount,
      store_id: storeId,
      value: parseFloat(newDiscount.value),
      usage_limit: newDiscount.usage_limit ? parseInt(newDiscount.usage_limit) : null,
    }).select().single();

    if (error) {
      toast({ title: "Error", description: "No se pudo agregar el descuento.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Descuento agregado." });
      setDiscounts([...discounts, data]);
      setNewDiscount({ code: '', discount_type: 'percentage', value: '', usage_limit: '' });
    }
  };

  const handleDeleteDiscount = async (discountId) => {
    const { error } = await supabase.from('discounts').delete().eq('id', discountId);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar el descuento.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Descuento eliminado." });
      fetchData();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Códigos de Descuento</CardTitle>
        <CardDescription>Crea y gestiona códigos de descuento para tus clientes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4 p-4 border rounded-lg">
          <Input name="code" placeholder="Código (ej. VERANO20)" value={newDiscount.code} onChange={handleInputChange} />
          <Select name="discount_type" value={newDiscount.discount_type} onValueChange={(v) => setNewDiscount({...newDiscount, discount_type: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Porcentaje</SelectItem>
              <SelectItem value="fixed_amount">Monto Fijo</SelectItem>
            </SelectContent>
          </Select>
          <Input name="value" type="number" placeholder="Valor" value={newDiscount.value} onChange={handleInputChange} />
          <Button onClick={handleAddDiscount}><Plus className="mr-2 h-4 w-4" /> Crear Descuento</Button>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono">{d.code}</TableCell>
                  <TableCell>{d.discount_type === 'percentage' ? 'Porcentaje' : 'Monto Fijo'}</TableCell>
                  <TableCell>{d.discount_type === 'percentage' ? `${d.value}%` : `$${Number(d.value).toLocaleString()}`}</TableCell>
                  <TableCell>{d.usage_count} / {d.usage_limit || '∞'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteDiscount(d.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {discounts.length === 0 && !loading && (
          <div className="text-center py-10 border-dashed border-2 rounded-lg">
            <Percent className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p>Aún no has creado ningún código de descuento.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscountsTab;