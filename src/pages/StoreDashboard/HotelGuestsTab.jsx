
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { Search, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HotelGuestsTab = ({ storeId }) => {
  const [guests, setGuests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeId) fetchGuests();
  }, [storeId]);

  const fetchGuests = async () => {
    setLoading(true);
    // We derive guests from past orders since we store guest details there
    const { data: orders } = await supabase
        .from('orders')
        .select('delivery_address, created_at')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

    const guestMap = new Map();

    orders?.forEach(order => {
        try {
            const meta = order.delivery_address ? JSON.parse(order.delivery_address) : null;
            if (meta && meta.guest && meta.guest.email) {
                // Use email as unique identifier
                if (!guestMap.has(meta.guest.email)) {
                    guestMap.set(meta.guest.email, {
                        ...meta.guest,
                        lastStay: order.created_at,
                        stays: 1
                    });
                } else {
                    const existing = guestMap.get(meta.guest.email);
                    existing.stays += 1;
                    // Keep most recent info if needed, or oldest
                }
            }
        } catch (e) {
            // Skip invalid json
        }
    });

    setGuests(Array.from(guestMap.values()));
    setLoading(false);
  };

  const filteredGuests = guests.filter(g => 
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      g.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
        <CardHeader>
            <CardTitle>Historial de Huéspedes</CardTitle>
            <CardDescription>Base de datos de clientes basada en reservas anteriores</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="mb-4 flex gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por nombre o email..." 
                        className="pl-9" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={fetchGuests}>Actualizar Lista</Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead className="hidden md:table-cell">Dirección</TableHead>
                            <TableHead className="text-right">Estancias</TableHead>
                            <TableHead className="text-right">Última Visita</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Cargando huéspedes...</TableCell>
                            </TableRow>
                        ) : filteredGuests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No se encontraron huéspedes registrados.</TableCell>
                            </TableRow>
                        ) : (
                            filteredGuests.map((guest, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium">{guest.name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3"/> {guest.email}</span>
                                            {guest.phone && <span className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3"/> {guest.phone}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-sm truncate max-w-[200px]" title={guest.address}>
                                        {guest.address}
                                    </TableCell>
                                    <TableCell className="text-right">{guest.stays}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {new Date(guest.lastStay).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
  );
};

export default HotelGuestsTab;
