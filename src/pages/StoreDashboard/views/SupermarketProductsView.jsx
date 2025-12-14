
import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    ShoppingCart,
    Loader2,
    Barcode,
    ListFilter,
    LayoutList,
    LayoutGrid,
    Pencil,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Trigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useStoreDashboard } from '@/stores/useStoreDashboard';

/**
 * Vista de Supermercado (Alta Densidad / Tabla)
 */
const SupermarketProductsView = () => {
    const { products, fetchProducts, addProduct, updateProduct, deleteProduct, store } = useStoreDashboard();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '',
        description: '', // Barcode stored here?
        category: 'Abarrotes',
        sku: '', // Native SKU if available or in description
        image_url: ''
    });

    useEffect(() => {
        if (store?.id) fetchProducts(store.id);
    }, [store?.id, fetchProducts]);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.includes(searchTerm))
    );

    const categories = ['Abarrotes', 'Lácteos', 'Carnes', 'Frutas/Verduras', 'Limpieza', 'Bebidas', 'Cuidado Personal'];

    const openCreateModal = () => {
        setEditingProduct(null);
        setFormData({ name: '', price: '', stock: '50', description: '', category: 'Abarrotes', sku: '', image_url: '' });
        setIsAddOpen(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            price: product.price,
            stock: product.stock,
            description: product.description || '',
            category: product.category || 'Abarrotes',
            sku: product.sku || '',
            image_url: product.image_url || ''
        });
        setIsAddOpen(true);
    };

    const handleQuickStockUpdate = async (product, newStock) => {
        try {
            await updateProduct(product.id, { stock: parseInt(newStock) });
            toast({ title: "Stock actualizado" });
        } catch (e) { /* silent fail or toast */ }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const productPayload = {
                name: formData.name,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                sku: formData.sku, // If DB supports it, else description hack
                description: formData.sku ? `${formData.description}\n\nSKU:${formData.sku}` : formData.description, // Fallback
                category: formData.category,
                store_id: store?.id,
                product_type: 'physical',
                requires_shipping: true
            };

            // Note: If real SKU col exists, use it. If not, the generic service might ignore it.
            // But for Supermarkets, SKUs are vital.

            if (editingProduct) {
                await updateProduct(editingProduct.id, productPayload);
                toast({ title: "Producto actualizado" });
            } else {
                await addProduct(productPayload);
                toast({ title: "Producto registrado" });
            }
            setIsAddOpen(false);
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm("¿Eliminar producto?")) await deleteProduct(id);
    };

    return (
        <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-t-xl flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-emerald-900 flex items-center gap-2">
                        <ShoppingCart className="h-8 w-8 text-emerald-600" />
                        Inventario Máster
                    </h1>
                    <p className="text-emerald-700">Gestión masiva de referencias, precios y existencias.</p>
                </div>
                <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" /> Nuevo Producto
                </Button>
            </div>

            <div className="flex gap-4 items-center bg-white p-2 border-b">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nombre, código de barras..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline"><Barcode className="h-4 w-4 mr-2" /> Escanear</Button>
            </div>

            {/* Table View */}
            <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="w-[100px]">Código/SKU</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-center w-[150px]">Stock</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-mono text-xs text-gray-500">
                                    {product.sku || product.description?.match(/SKU:(\w+)/)?.[1] || '---'}
                                </TableCell>
                                <TableCell className="font-medium text-slate-800">
                                    {product.name}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-normal">{product.category}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold text-emerald-700">
                                    ${Number(product.price).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Button
                                            variant="ghost"
                                            className="h-6 w-6 rounded-full p-0"
                                            onClick={() => handleQuickStockUpdate(product, Math.max(0, product.stock - 1))}
                                        >-</Button>
                                        <span className="w-8 text-center">{product.stock}</span>
                                        <Button
                                            variant="ghost"
                                            className="h-6 w-6 rounded-full p-0"
                                            onClick={() => handleQuickStockUpdate(product, product.stock + 1)}
                                        >+</Button>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => openEditModal(product)}>
                                        <Pencil className="h-4 w-4 text-blue-500" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Producto de Supermercado</DialogTitle></DialogHeader>
                    <form onSubmit={handleSaveProduct} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Nombre Producto</Label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Código Barras / SKU</Label>
                                <Input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Categoría</Label>
                                <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Precio</Label>
                                <Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Stock Inicial</Label>
                                <Input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} required />
                            </div>
                        </div>
                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>Guardar</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SupermarketProductsView;
