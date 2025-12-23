
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, Search, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

/**
 * Vista de Inventario Rápido (Tipo Excel)
 * Permite edición en línea de precios y stock.
 */
const QuickGridProductView = ({ storeId }) => {
    const { products, fetchProducts, updateProduct } = useStoreDashboard();
    const [localProducts, setLocalProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modifiedRows, setModifiedRows] = useState(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (storeId) {
            setIsLoading(true);
            fetchProducts(storeId).finally(() => setIsLoading(false));
        }
    }, [storeId, fetchProducts]);

    useEffect(() => {
        // Sync local state when products fetch completes or updates
        // Only if not currently editing (basic implementation)
        // ideally we merge, but for now full sync
        if (products.length > 0 && localProducts.length === 0) {
            setLocalProducts(products);
        } else if (products.length > 0 && modifiedRows.size === 0) {
            // Keep sync if no unsaved changes
            setLocalProducts(products);
        }
    }, [products, modifiedRows.size]);

    const handleCellChange = (id, field, value) => {
        setLocalProducts(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, [field]: value };
            }
            return p;
        }));
        setModifiedRows(prev => new Set(prev).add(id));
    };

    const handleSaveBatch = async () => {
        if (modifiedRows.size === 0) return;
        setIsSaving(true);
        try {
            const updates = Array.from(modifiedRows).map(id => {
                const product = localProducts.find(p => p.id === id);
                return {
                    id: product.id,
                    price: parseFloat(product.price),
                    stock: parseInt(product.stock),
                    name: product.name // allow name edit too
                };
            });

            // Sequential updates (could be batch RPC in future)
            for (const update of updates) {
                const { id, ...data } = update;
                await updateProduct(id, data);
            }

            toast({ title: "Inventario actualizado", description: `${updates.length} productos guardados.` });
            setModifiedRows(new Set());
            // Fetch fresh data
            fetchProducts(storeId);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudieron guardar algunos cambios.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const filtered = localProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Card className="h-full border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-xl">Inventario Rápido</CardTitle>
                    <CardDescription>Edita precios y stock directamente como en una hoja de cálculo.</CardDescription>
                </div>
                <div className="flex gap-2">
                    {modifiedRows.size > 0 && (
                        <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-md text-sm font-medium animate-pulse">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {modifiedRows.size} cambios sin guardar
                        </div>
                    )}
                    <Button
                        onClick={handleSaveBatch}
                        disabled={isSaving || modifiedRows.size === 0}
                        className={`${modifiedRows.size > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 text-gray-400'}`}
                    >
                        {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Guardar Cambios
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filtar productos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 bg-gray-50 border-gray-200"
                        />
                    </div>
                </div>

                <div className="rounded-md border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead className="w-[40%]">Producto</TableHead>
                                <TableHead className="w-[20%]">Precio</TableHead>
                                <TableHead className="w-[20%]">Stock</TableHead>
                                <TableHead className="w-[20%] text-right">Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && localProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">Cargando...</TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No hay productos.</TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((product) => {
                                    const isModified = modifiedRows.has(product.id);
                                    return (
                                        <TableRow key={product.id} className={isModified ? "bg-amber-50/50" : ""}>
                                            <TableCell className="font-medium p-2">
                                                <Input
                                                    value={product.name}
                                                    onChange={(e) => handleCellChange(product.id, 'name', e.target.value)}
                                                    className="border-transparent hover:border-gray-200 focus:border-blue-500 h-8 px-2"
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    type="number"
                                                    value={product.price}
                                                    onChange={(e) => handleCellChange(product.id, 'price', e.target.value)}
                                                    className="border-transparent hover:border-gray-200 focus:border-blue-500 h-8 px-2 text-right font-mono"
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    type="number"
                                                    value={product.stock}
                                                    onChange={(e) => handleCellChange(product.id, 'stock', e.target.value)}
                                                    className={`border-transparent hover:border-gray-200 focus:border-blue-500 h-8 px-2 text-center ${product.stock < 5 ? 'text-red-600 font-bold' : ''}`}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right p-2">
                                                {isModified ? (
                                                    <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50">Editado</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-gray-200 text-gray-500">Sincronizado</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default QuickGridProductView;
