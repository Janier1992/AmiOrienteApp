
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, Search, RefreshCw, AlertCircle, Plus, Trash2, Pencil, FileImage as ImageIcon, Loader2 } from 'lucide-react';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Vista de Inventario Rápido Híbrida
 * Permite edición en línea (Excel-style) Y gestión completa (CRUD + Imágenes).
 */
const QuickGridProductView = ({ storeId }) => {
    const { products, fetchProducts, updateProduct, addProduct, deleteProduct, isLoadingProducts } = useStoreDashboard();
    const [localProducts, setLocalProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modifiedRows, setModifiedRows] = useState(new Set());
    const [isSaving, setIsSaving] = useState(false);

    // Modal & CRUD State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', price: '', description: '', stock: '1', category: 'Cosecha', image_url: ''
    });
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        if (storeId) {
            fetchProducts(storeId);
        }
    }, [storeId, fetchProducts]);

    useEffect(() => {
        // Sync local state when products fetch completes or updates
        // Only if not currently editing (basic implementation)
        if (products.length > 0 && (localProducts.length === 0 || modifiedRows.size === 0)) {
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
                    name: product.name
                };
            });

            for (const update of updates) {
                const { id, ...data } = update;
                await updateProduct(id, data);
            }

            toast({ title: "Inventario actualizado", description: `${updates.length} productos guardados.` });
            setModifiedRows(new Set());
            fetchProducts(storeId);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudieron guardar algunos cambios.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    // --- CRUD Handlers ---

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const uploadFile = async (file, bucket, path) => {
        const { error: uploadError, data: uploadData } = await supabase.storage
            .from(bucket)
            .upload(path, file);

        if (uploadError) throw new Error(`Error al subir archivo: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);
        return urlData.publicUrl;
    };

    const openAddModal = () => {
        setEditingId(null);
        setFormData({ name: '', price: '', description: '', stock: '1', category: 'Cosecha', image_url: '' });
        setImageFile(null);
        setIsAddOpen(true);
    };

    const handleEditFull = (product) => {
        setEditingId(product.id);
        setFormData({
            name: product.name,
            price: product.price,
            description: product.description || '',
            stock: product.stock,
            category: product.category || 'Cosecha',
            image_url: product.image_url || ''
        });
        setImageFile(null);
        setIsAddOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let imageUrl = formData.image_url;
            if (imageFile) {
                const imagePath = `${storeId}/${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                imageUrl = await uploadFile(imageFile, 'product-images', imagePath);
            }

            const productPayload = {
                ...formData,
                store_id: storeId,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                product_type: 'physical',
                requires_shipping: true,
                image_url: imageUrl
            };

            if (editingId) {
                await updateProduct(editingId, productPayload);
                toast({ title: "Producto actualizado" });
            } else {
                await addProduct(productPayload);
                toast({ title: "Producto creado" });
            }

            setIsAddOpen(false);
            setEditingId(null);
            fetchProducts(storeId); // Refresh data
        } catch (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres eliminar este producto?")) return;
        try {
            await deleteProduct(id);
            toast({ title: "Producto eliminado" });
            setLocalProducts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
        }
    };

    const filtered = localProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Card className="h-full border-none shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-4">
                <div>
                    <CardTitle className="text-xl">Inventario y Cosechas</CardTitle>
                    <CardDescription>Gestión rápida y detallada de tus productos.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {modifiedRows.size > 0 && (
                        <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-md text-sm font-medium animate-pulse">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {modifiedRows.size} sin guardar
                        </div>
                    )}
                    <Button
                        onClick={handleSaveBatch}
                        disabled={isSaving || modifiedRows.size === 0}
                        className={`${modifiedRows.size > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 text-gray-400'}`}
                        size="sm"
                    >
                        {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Guardar Cambios
                    </Button>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-2" /> Nuevo Producto
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingId ? "Editar Producto" : "Agregar Nuevo Producto"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nombre</Label>
                                    <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Precio</Label>
                                        <Input type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Stock</Label>
                                        <Input type="number" required value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Categoría</Label>
                                    <Input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Imagen</Label>
                                    <div className="flex items-center gap-4">
                                        {formData.image_url && <img src={formData.image_url} alt="Preview" className="h-10 w-10 object-cover rounded border" />}
                                        <Input type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Descripción</Label>
                                    <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
                                </div>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Guardar"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filtrar productos..."
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
                                <TableHead className="w-[50px]">Img</TableHead>
                                <TableHead className="w-[30%]">Producto</TableHead>
                                <TableHead className="w-[15%]">Precio</TableHead>
                                <TableHead className="w-[15%]">Stock</TableHead>
                                <TableHead className="w-[15%] text-right">Estado</TableHead>
                                <TableHead className="w-[15%] text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingProducts && localProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">Cargando...</TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No hay productos.</TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((product) => {
                                    const isModified = modifiedRows.has(product.id);
                                    return (
                                        <TableRow key={product.id} className={isModified ? "bg-amber-50/50" : ""}>
                                            <TableCell className="p-2">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                                                ) : (
                                                    <div className="h-8 w-8 bg-slate-100 rounded flex items-center justify-center text-slate-300"><ImageIcon className="h-4 w-4" /></div>
                                                )}
                                            </TableCell>
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
                                                    <Badge variant="outline" className="border-gray-200 text-gray-500">Sync</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right p-2">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => handleEditFull(product)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(product.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
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
