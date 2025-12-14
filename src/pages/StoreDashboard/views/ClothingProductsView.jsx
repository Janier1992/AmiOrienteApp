
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
    Shirt,
    Tags,
    Palette
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useStoreDashboard } from '@/stores/useStoreDashboard';

/**
 * Tarjeta de producto de Ropa.
 * Muestra previo de variantes (Talla/Color).
 */
const ClothingProductCard = ({ product, onEdit, onDelete }) => {
    // Parse variants from description
    const variantsMatch = product.description?.match(/VARIANTS_JSON:\s*(\[.*\])/s);
    let variants = [];
    try {
        if (variantsMatch) variants = JSON.parse(variantsMatch[1]);
    } catch (e) { }

    // Extract unique sizes for display
    const sizes = [...new Set(variants.map(v => v.size))].sort();

    return (
        <Card className="rounded-none overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all group bg-white h-full flex flex-col">
            <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300">
                        <Shirt className="h-16 w-16 mb-2" />
                        <span className="text-xs">Sin imagen</span>
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.discount > 0 && (
                        <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 text-xs">-{product.discount}% OFF</Badge>
                    )}
                </div>

                {/* Actions */}
                <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-9 w-9 rounded-full shadow-lg bg-white hover:bg-gray-50 text-black"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(product);
                        }}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        className="h-9 w-9 rounded-full shadow-lg"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(product.id);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <CardContent className="p-4 flex-1 flex flex-col">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{product.category || 'Colección General'}</p>
                <h3 className="font-serif text-lg text-slate-900 leading-tight mb-2 truncate">{product.name}</h3>

                <div className="flex flex-wrap gap-1 mb-3 min-h-[1.5rem]">
                    {sizes.length > 0 ? (
                        sizes.map(size => (
                            <span key={size} className="text-[10px] border border-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                                {size}
                            </span>
                        ))
                    ) : (
                        <span className="text-[10px] text-gray-400 italic">Talla única</span>
                    )}
                </div>

                <div className="mt-auto flex justify-between items-end border-t pt-3">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">${Number(product.price).toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-gray-400">Total: {product.stock} un.</span>
                </div>
            </CardContent>
        </Card>
    );
};

const VARIANT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];
const VARIANT_COLORS = [
    { name: 'Negro', hex: '#000000' },
    { name: 'Blanco', hex: '#FFFFFF' },
    { name: 'Rojo', hex: '#EF4444' },
    { name: 'Azul', hex: '#3B82F6' },
    { name: 'Verde', hex: '#22C55E' },
    { name: 'Amarillo', hex: '#EAB308' },
    { name: 'Rosa', hex: '#EC4899' },
    { name: 'Gris', hex: '#6B7280' },
    { name: 'Beige', hex: '#F5F5DC' },
];

/**
 * Vista especializada para Tiendas de Ropa.
 */
const ClothingProductsView = () => {
    const { products, fetchProducts, addProduct, updateProduct, deleteProduct, store } = useStoreDashboard();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form variants management
    const [variants, setVariants] = useState([]);
    const [currentVariant, setCurrentVariant] = useState({ size: 'M', color: 'Negro', qty: 1 });

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        category: 'General',
        image_url: ''
    });
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        if (store?.id) fetchProducts(store.id);
    }, [store?.id, fetchProducts]);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const addVariant = () => {
        setVariants([...variants, { ...currentVariant, id: Date.now() }]);
        setCurrentVariant({ ...currentVariant, qty: 1 }); // Reset qty but keep selection for speed
    };

    const removeVariant = (id) => {
        setVariants(variants.filter(v => v.id !== id));
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setFormData({ name: '', price: '', description: '', category: 'General', image_url: '' });
        setVariants([]);
        setImageFile(null);
        setIsAddOpen(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        // Extract Variants
        const variantsMatch = product.description?.match(/VARIANTS_JSON:\s*(\[.*\])/s);
        let loadedVariants = [];
        let cleanDesc = product.description || '';

        if (variantsMatch) {
            try {
                loadedVariants = JSON.parse(variantsMatch[1]);
                // Ensure IDs
                loadedVariants = loadedVariants.map(v => ({ ...v, id: v.id || Math.random() }));

                cleanDesc = product.description.replace(/\n\nVARIANTS_JSON:\s*\[.*\]/s, '');
            } catch (e) { }
        }

        setFormData({
            name: product.name,
            price: product.price,
            description: cleanDesc,
            category: product.category || 'General',
            image_url: product.image_url || ''
        });
        setVariants(loadedVariants);
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
        if (uploadError) throw new Error(`Error upload: ${uploadError.message}`);
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
                const imagePath = `${store.id}/${Date.now()}_fashion_${fileName}`;
                imageUrl = await uploadFile(imageFile, 'product-images', imagePath);
            }

            // Serialize Variants
            const variantsJson = JSON.stringify(variants);
            const totalStock = variants.reduce((sum, v) => sum + parseInt(v.qty), 0);

            // If no variants, default to 1 stock to prevent logic errors if user forgot
            const finalStock = variants.length > 0 ? totalStock : 1;

            const productDescription = variants.length > 0
                ? `${formData.description || ''}\n\nVARIANTS_JSON: ${variantsJson}`
                : formData.description;

            const productPayload = {
                name: formData.name,
                price: parseFloat(formData.price),
                stock: finalStock,
                product_type: 'physical',
                requires_shipping: true,
                image_url: imageUrl,
                description: productDescription,
                category: formData.category,
                store_id: store?.id,
            };

            if (editingProduct) {
                await updateProduct(editingProduct.id, productPayload);
                toast({ title: "Prenda actualizada", description: "Inventario recalculado." });
            } else {
                await addProduct(productPayload);
                toast({ title: "Prenda añadida", description: "Lista para la venta." });
            }

            setIsAddOpen(false);
            setEditingProduct(null);
            setFormData({ name: '', price: '', description: '', category: 'General', image_url: '' });

        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Fallo al guardar.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("¿Retirar prenda del catálogo?")) return;
        try {
            await deleteProduct(id);
            toast({ title: "Prenda eliminada" });
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-8 font-sans">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-4xl font-serif text-slate-900 mb-2">Colección & Stock</h1>
                    <p className="text-slate-500 font-light">Gestiona tallas, colores y disponiblidad de tus prendas.</p>
                </div>
                <Button
                    className="bg-slate-900 text-white hover:bg-slate-800 rounded-none px-8 py-6 uppercase tracking-wider text-xs"
                    onClick={openCreateModal}
                >
                    <Plus className="h-4 w-4 mr-2" /> Nueva Prenda
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="flex gap-4 items-center bg-white p-1">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <Input
                        placeholder="Buscar referencia..."
                        className="pl-10 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                {filteredProducts.map((product) => (
                    <ClothingProductCard
                        key={product.id}
                        product={{ ...product, discount: 0 }}
                        onEdit={openEditModal}
                        onDelete={handleDeleteProduct}
                    />
                ))}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">
                            {editingProduct ? 'Editar Prenda' : 'Nueva Prenda'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSaveProduct} className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Col: Basic Info */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nombre / Referencia</Label>
                                    <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Ej: Camisa Lino Blanca" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Precio</Label>
                                    <Input name="price" type="number" value={formData.price} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Categoría / Colección</Label>
                                    <Select name="category" value={formData.category} onValueChange={(val) => setFormData(p => ({ ...p, category: val }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="General">General</SelectItem>
                                            <SelectItem value="Hombre">Hombre</SelectItem>
                                            <SelectItem value="Mujer">Mujer</SelectItem>
                                            <SelectItem value="Niños">Niños</SelectItem>
                                            <SelectItem value="Accesorios">Accesorios</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Imagen</Label>
                                    <Input type="file" accept="image/*" onChange={handleFileChange} />
                                    {formData.image_url && <img src={formData.image_url} alt="Preview" className="h-20 w-auto object-contain border mt-2" />}
                                </div>
                            </div>

                            {/* Right Col: Variants Matrix */}
                            <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="font-bold">Variantes de Stock</Label>
                                    <span className="text-xs text-slate-500">Total: {variants.reduce((a, b) => a + Number(b.qty), 0)} un.</span>
                                </div>

                                <div className="flex gap-2 items-end">
                                    <div className="w-20">
                                        <Label className="text-xs">Talla</Label>
                                        <Select value={currentVariant.size} onValueChange={(v) => setCurrentVariant(prev => ({ ...prev, size: v }))}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {VARIANT_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-xs">Color</Label>
                                        <Select value={currentVariant.color} onValueChange={(v) => setCurrentVariant(prev => ({ ...prev, color: v }))}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {VARIANT_COLORS.map(c => (
                                                    <SelectItem key={c.name} value={c.name}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: c.hex }}></div>
                                                            {c.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-20">
                                        <Label className="text-xs">Cant.</Label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs"
                                            value={currentVariant.qty}
                                            onChange={(e) => setCurrentVariant(prev => ({ ...prev, qty: e.target.value }))}
                                        />
                                    </div>
                                    <Button type="button" size="sm" onClick={addVariant} className="h-8 bg-black text-white">
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>

                                {/* Variants List */}
                                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                    {variants.map((v) => (
                                        <div key={v.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                                            <div className="flex gap-2 items-center">
                                                <span className="font-bold w-6">{v.size}</span>
                                                <span className="text-slate-500">{v.color}</span>
                                            </div>
                                            <div className="flex gap-3 items-center">
                                                <span className="font-mono bg-slate-100 px-1">{v.qty}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 hover:text-red-500"
                                                    onClick={() => removeVariant(v.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {variants.length === 0 && <p className="text-xs text-gray-400 text-center py-2">Sin variantes definidas</p>}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Descripción Pública</Label>
                            <Textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Detalles de la tela, cuidados, etc." />
                        </div>

                        <Button type="submit" className="w-full bg-slate-900 text-white rounded-none py-6 uppercase tracking-widest font-bold hover:bg-slate-800" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Guardar Prenda'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClothingProductsView;
