
import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    UtensilsCrossed,
    Loader2,
    ImageIcon,
    Pencil,
    Trash2,
    ChefHat,
    Flame
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useStoreDashboard } from '@/stores/useStoreDashboard';

/**
 * Tarjeta de Plato / Menú
 */
const MenuProductCard = ({ product, onEdit, onDelete, onToggleAvailability }) => {
    // Determine if available based on stock > 0
    const isAvailable = product.stock > 0;

    return (
        <Card className={`rounded-3xl overflow-hidden border-0 shadow-md hover:shadow-xl transition-all group bg-white h-full flex flex-col ${!isAvailable ? 'opacity-80 grayscale' : ''}`}>
            <div className="relative h-48 overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-orange-50 flex flex-col items-center justify-center text-orange-300">
                        <UtensilsCrossed className="h-12 w-12 mb-2" />
                        <span className="text-xs font-bold">Sin foto</span>
                    </div>
                )}

                {/* Availability Toggle Overlay */}
                <div className="absolute top-3 left-3 z-20">
                    <Badge variant={isAvailable ? "default" : "destructive"} className={isAvailable ? "bg-green-500 hover:bg-green-600" : "bg-red-500"}>
                        {isAvailable ? "Disponible" : "Agotado"}
                    </Badge>
                </div>

                {/* Actions */}
                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300 z-20">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-9 w-9 rounded-full shadow-lg bg-white/90 backdrop-blur text-orange-600 hover:bg-white"
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

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                <div className="absolute bottom-3 left-3 text-white">
                    <p className="text-xs font-bold uppercase tracking-wider mb-0.5 text-orange-200">{product.category}</p>
                    <h3 className="font-bold text-lg leading-tight shadow-sm">{product.name}</h3>
                </div>
            </div>

            <CardContent className="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-3 border-t border-orange-50">
                    <span className="text-xl font-extrabold text-slate-800">${Number(product.price).toLocaleString()}</span>
                    <div className="flex items-center gap-2">
                        <Label htmlFor={`stock-${product.id}`} className="text-xs text-gray-400 cursor-pointer">Activo</Label>
                        <Switch
                            id={`stock-${product.id}`}
                            checked={isAvailable}
                            onCheckedChange={() => onToggleAvailability(product)}
                            className="data-[state=checked]:bg-green-500"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * Vista de Gestión de Menú para Restaurantes.
 */
const RestaurantMenuView = () => {
    const { products, fetchProducts, addProduct, updateProduct, deleteProduct, store } = useStoreDashboard();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        category: 'Platos Fuertes',
        stock: true, // UI toggle mapped to 100 or 0
        image_url: ''
    });
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        if (store?.id) fetchProducts(store.id);
    }, [store?.id, fetchProducts]);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Categorized Sections
    const categories = ['Entradas', 'Platos Fuertes', 'Bebidas', 'Postres', 'Adicionales'];

    const openCreateModal = () => {
        setEditingProduct(null);
        setFormData({ name: '', price: '', description: '', category: 'Platos Fuertes', stock: true, image_url: '' });
        setImageFile(null);
        setIsAddOpen(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            price: product.price,
            description: product.description || '',
            category: product.category || 'Platos Fuertes',
            stock: product.stock > 0,
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
                const imagePath = `${store.id}/${Date.now()}_menu_${fileName}`;
                imageUrl = await uploadFile(imageFile, 'product-images', imagePath);
            }

            const productPayload = {
                name: formData.name,
                price: parseFloat(formData.price),
                stock: formData.stock ? 100 : 0, // Simplified availability logic for restaurants
                product_type: 'physical',
                requires_shipping: false, // Restaurants usually delivery via external or driver, but item itself is prepared
                image_url: imageUrl,
                description: formData.description,
                category: formData.category,
                store_id: store?.id,
            };

            if (editingProduct) {
                await updateProduct(editingProduct.id, productPayload);
                toast({ title: "Plato actualizado" });
            } else {
                await addProduct(productPayload);
                toast({ title: "Plato añadido al menú" });
            }

            setIsAddOpen(false);
            setEditingProduct(null);
            setFormData({ name: '', price: '', description: '', category: 'Platos Fuertes', stock: true, image_url: '' });

        } catch (error) {
            console.error(error);
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleAvailability = async (product) => {
        const newStock = product.stock > 0 ? 0 : 100;
        try {
            await updateProduct(product.id, { stock: newStock });
            toast({ title: newStock > 0 ? "Plato marcado como disponible" : "Plato marcado como agotado" });
        } catch (e) {
            toast({ title: "Error al actualizar estado", variant: "destructive" });
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("¿Eliminar del menú?")) return;
        try {
            await deleteProduct(id);
            toast({ title: "Eliminado" });
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-8 font-sans">
            <div className="bg-orange-50 border border-orange-100 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-orange-900 flex items-center gap-3">
                        <ChefHat className="h-10 w-10 text-orange-600" />
                        Gestión del Menú
                    </h1>
                    <p className="text-orange-800 mt-2 text-lg">Organiza tus platos, precios y disponibilidad en tiempo real.</p>
                </div>
                <Button
                    className="bg-orange-600 text-white hover:bg-orange-700 rounded-full px-8 py-6 text-md font-bold shadow-orange-200 shadow-xl"
                    onClick={openCreateModal}
                >
                    <Plus className="h-5 w-5 mr-2" /> Agregar Plato
                </Button>
            </div>

            {/* Filter */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-100 relative z-10">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Buscar en el menú..."
                        className="pl-12 border-0 bg-slate-50 rounded-xl focus:bg-white transition-all py-6 text-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Grouped by Category (Optional) or Plain Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map((product) => (
                    <MenuProductCard
                        key={product.id}
                        product={{ ...product, discount: 0 }}
                        onEdit={openEditModal}
                        onDelete={handleDeleteProduct}
                        onToggleAvailability={handleToggleAvailability}
                    />
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Flame className="h-16 w-16 mb-4 text-orange-200" />
                    <p className="text-xl font-medium">Tu menú está vacío.</p>
                    <p>Agrega deliciosos platos para tus clientes.</p>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-orange-950 flex items-center gap-2">
                            {editingProduct ? 'Editar Plato' : 'Nuevo Plato'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSaveProduct} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label className="text-orange-900 font-bold">Nombre del Plato</Label>
                                <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Ej: Hamburguesa Artesanal" className="rounded-xl border-orange-200 focus:border-orange-500" required />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-orange-900 font-bold">Precio</Label>
                                <Input name="price" type="number" value={formData.price} onChange={handleInputChange} className="rounded-xl border-orange-200 focus:border-orange-500" required />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-orange-900 font-bold">Categoría</Label>
                                <Select name="category" value={formData.category} onValueChange={(val) => setFormData(p => ({ ...p, category: val }))}>
                                    <SelectTrigger className="rounded-xl border-orange-200"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-orange-900 font-bold">Foto del Plato</Label>
                            <div className="border-2 border-dashed border-orange-200 rounded-2xl p-4 flex flex-col items-center gap-4 bg-orange-50/50 hover:bg-orange-50 transition-colors">
                                {formData.image_url ? (
                                    <img src={formData.image_url} alt="Preview" className="h-32 w-full object-cover rounded-xl shadow-md" />
                                ) : (
                                    <ImageIcon className="h-10 w-10 text-orange-300" />
                                )}
                                <Input type="file" accept="image/*" onChange={handleFileChange} className="max-w-xs" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-orange-900 font-bold">Descripción / Ingredientes</Label>
                            <Textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe los ingredientes y la preparación..." className="rounded-xl border-orange-200 min-h-[100px]" />
                        </div>

                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                            <Label className="cursor-pointer" htmlFor="stock-toggle">¿Disponible para ordenar hoy?</Label>
                            <Switch
                                id="stock-toggle"
                                checked={formData.stock}
                                onCheckedChange={(checked) => setFormData(p => ({ ...p, stock: checked }))}
                            />
                        </div>

                        <Button type="submit" className="w-full bg-orange-600 text-white rounded-xl py-6 font-bold text-lg hover:bg-orange-700 shadow-lg shadow-orange-200" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Guardar en el Menú'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RestaurantMenuView;
