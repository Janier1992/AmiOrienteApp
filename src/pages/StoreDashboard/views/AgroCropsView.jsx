
import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Grid,
    List,
    Loader2,
    FileImage as ImageIcon,
    Pencil,
    Trash2,
    Sprout
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import { useAgroStore } from '@/stores/useAgroStore';

/**
 * Tarjeta de cultivo para Agricultores.
 */
const AgroProductCard = ({ product, onEdit, onDelete }) => {
    // Workaround: usaremos el campo SKU como "Lote"
    const displayBatch = product.sku || product.description?.match(/Lote:\s*([^\n]+)/)?.[1] || 'Sin Lote';

    return (
        <Card className="rounded-2xl overflow-hidden border border-green-100 shadow-sm hover:shadow-lg transition-all group bg-white h-full flex flex-col">
            <div className="relative h-48 bg-green-50 p-4 flex items-center justify-center">

                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="max-h-full max-w-full object-cover rounded-lg"
                    />
                ) : (
                    <div className="flex flex-col items-center text-green-300">
                        <Sprout className="h-12 w-12 mb-2" />
                        <span className="text-xs font-semibold">Sin foto</span>
                    </div>
                )}

                {/* Action Buttons Overlay */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-md bg-white hover:bg-green-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(product);
                        }}
                    >
                        <Pencil className="h-4 w-4 text-green-700" />
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-md"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(product.id);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <CardContent className="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-slate-900 line-clamp-2 text-lg leading-tight">{product.name}</h3>
                    </div>
                    <p className="text-xs text-green-600 font-medium mb-1 uppercase tracking-wide">
                        {product.category || 'General'}
                    </p>
                    <p className="text-xs text-gray-400 mb-2">Lote: {displayBatch}</p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-green-50">
                    <div>
                        <p className="text-xs text-gray-500">Precio / Kg</p>
                        <span className="text-lg font-bold text-slate-900">${Number(product.price).toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Disponible</p>
                        <span className="text-sm font-semibold text-green-700">{product.stock} Kg</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * Vista de Cosechas (Productos Agrícolas).
 */
const AgroCropsView = () => {

    const {
        crops: products,
        fetchCrops: fetchProducts,
        addCrop: addProduct,
        updateCrop: updateProduct,
        deleteCrop: deleteProduct,
        isLoadingCrops
    } = useAgroStore();
    const { store } = useStoreDashboard(); // Keep generic store only for store.id
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        stock: '1',
        category: 'Verduras',
        sku: '', // Used as Batch/Lote
        image_url: ''
    });
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        if (store?.id) fetchProducts(store.id);
    }, [store?.id, fetchProducts]);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const openCreateModal = () => {
        setEditingProduct(null);
        setFormData({ name: '', price: '', description: '', stock: '100', category: 'Verduras', sku: '', image_url: '' });
        setImageFile(null);
        setIsAddOpen(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        // Extract Batch/Lote from description or SKU field
        const parsedBatch = product.sku || product.description?.match(/Lote:\s*([^\n]+)/)?.[1] || '';
        const cleanDescription = product.description ? product.description.replace(/\n\nLote:\s*[^\n]+/, '') : '';

        setFormData({
            name: product.name,
            price: product.price,
            description: cleanDescription,
            stock: product.stock,
            category: product.category || 'Verduras',
            sku: parsedBatch,
            image_url: product.image_url || ''
        });
        setImageFile(null);
        setIsAddOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const uploadFile = async (file, bucket, path) => {
        const { error: uploadError, data: uploadData } = await supabase.storage
            .from(bucket)
            .upload(path, file);

        if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);
        return urlData.publicUrl;
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let imageUrl = formData.image_url;

            if (imageFile && store?.id) {
                const fileName = imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
                const imagePath = `${store.id}/${Date.now()}_agri_${fileName}`;
                imageUrl = await uploadFile(imageFile, 'product-images', imagePath);
            }

            // Embed Batch info in description
            const productDescription = formData.sku
                ? `${formData.description || ''}\n\nLote: ${formData.sku}`
                : formData.description;

            const productPayload = {
                name: formData.name,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                product_type: 'physical',
                requires_shipping: true,
                image_url: imageUrl,
                description: productDescription,
                category: formData.category,
                sku: formData.sku, // Now passing SKU directly if supported by table or filtered by service
                store_id: store?.id,
            };

            if (editingProduct) {
                await updateProduct(editingProduct.id, productPayload);
                toast({ title: "Cosecha actualizada", description: "Información guardada exitosamente." });
            } else {
                await addProduct(productPayload);
                toast({ title: "Cosecha registrada", description: "Disponible para venta." });
            }

            setIsAddOpen(false);
            setEditingProduct(null);
            setFormData({ name: '', price: '', description: '', stock: '100', category: 'Verduras', sku: '', image_url: '' });

        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo guardar la información.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("¿Confirmas retirar esta cosecha del inventario?")) return;
        try {
            await deleteProduct(id);
            toast({ title: "Cosecha retirada" });
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
        }
    };


    return (
        <div className="space-y-6">
            <div className="bg-green-50 border border-green-100 p-6 rounded-2xl">
                <h1 className="text-3xl font-extrabold text-green-900 flex items-center gap-3">
                    <Sprout className="h-8 w-8 text-green-600" />
                    Gestión de Cosechas
                </h1>
                <p className="text-green-700 mt-2">Registra tus cultivos disponibles, asigna lotes y gestiona tu inventario agrícola.</p>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar cultivo o lote..."
                        className="pl-10 bg-gray-50 border-transparent focus:bg-white transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <Select defaultValue="all" onValueChange={(v) => console.log(v)}>
                        <SelectTrigger className="w-[150px] rounded-full bg-gray-50 border-transparent">
                            <SelectValue placeholder="Tipo de Cultivo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="Frutas">Frutas</SelectItem>
                            <SelectItem value="Verduras">Verduras</SelectItem>
                            <SelectItem value="Granos">Granos</SelectItem>
                            <SelectItem value="Tuberculos">Tubérculos</SelectItem>
                        </SelectContent>
                    </Select>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="bg-green-600 text-white hover:bg-green-700 rounded-full px-6 shadow-green-200 shadow-lg"
                                onClick={openCreateModal}
                            >
                                <Plus className="h-4 w-4 mr-2" /> Nueva Cosecha
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="text-green-900">{editingProduct ? 'Editar Cosecha' : 'Registrar Nueva Cosecha'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSaveProduct} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Producto / Cultivo</Label>
                                    <Input id="name" name="name" required value={formData.name} onChange={handleInputChange} placeholder="Ej: Papa Capira, Tomate Chonto" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Precio por Kg/Unidad</Label>
                                        <Input id="price" name="price" type="number" required value={formData.price} onChange={handleInputChange} placeholder="0.00" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="stock">Cantidad Disponible (Kg)</Label>
                                        <Input id="stock" name="stock" type="number" required value={formData.stock} onChange={handleInputChange} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Tipo de Cultivo</Label>
                                    <Select
                                        name="category"
                                        value={formData.category}
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Frutas">Frutas</SelectItem>
                                            <SelectItem value="Verduras">Verduras</SelectItem>
                                            <SelectItem value="Granos">Granos</SelectItem>
                                            <SelectItem value="Tuberculos">Tubérculos</SelectItem>
                                            <SelectItem value="Hierbas">Hierbas / Aromáticas</SelectItem>
                                            <SelectItem value="Otro">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sku">Lote / Variedad (Opcional)</Label>
                                    <Input id="sku" name="sku" value={formData.sku} onChange={handleInputChange} placeholder="Ej: Lote A-2024" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="image_upload">Foto del Cultivo</Label>
                                    <div className="flex gap-2 items-center">
                                        {formData.image_url && (
                                            <img src={formData.image_url} alt="Preview" className="h-10 w-10 object-cover rounded border" />
                                        )}
                                        <Input id="image_upload" type="file" accept="image/*" onChange={handleFileChange} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Descripción Adicional</Label>
                                    <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} placeholder="Detalles sobre la calidad, fecha de cosecha, etc." />
                                </div>
                                <Button type="submit" className="w-full bg-green-600 text-white hover:bg-green-700 font-bold" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingProduct ? "Guardar Cambios" : "Registrar Cosecha")}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="relative group h-full">
                        <AgroProductCard
                            product={{ ...product, discount: 0 }}
                            onEdit={openEditModal}
                            onDelete={handleDeleteProduct}
                        />
                    </div>
                ))}
                {filteredProducts.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                        <Sprout className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No has registrado ninguna cosecha aún.</p>
                        <Button variant="link" onClick={openCreateModal} className="text-green-600">
                            Registrar mi primera cosecha
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgroCropsView;
