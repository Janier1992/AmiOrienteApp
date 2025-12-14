import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboards/DashboardLayout';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Upload,
    DollarSign,
    Users,
    Settings,
    Search,
    Plus,
    Grid,
    List,
    Loader2,
    Trash2,
    FileImage as ImageIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

import { useStoreDashboard } from '@/stores/useStoreDashboard';

// Lazy Load Tabs to avoid circular dependency/build issues
const OverviewTab = React.lazy(() => import('../OverviewTab'));
const OrdersTab = React.lazy(() => import('../OrdersTab'));
const ProfileTab = React.lazy(() => import('../ProfileTab'));
const AdminTab = React.lazy(() => import('../AdminTab'));
const BulkUploadTab = React.lazy(() => import('../BulkUploadTab'));
const FinancialsTab = React.lazy(() => import('../FinancialsTab'));

// Custom Product Card for Stationery
const StationeryProductCard = ({ product }) => {
    // Workaround: Extract SKU from description if column doesn't exist
    const displaySku = product.sku || product.description?.match(/SKU:\s*([^\n]+)/)?.[1] || 'N/A';

    return (
        <Card className="rounded-3xl overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow group bg-white h-full flex flex-col">
            <div className="relative h-48 bg-gray-100 p-4 flex items-center justify-center">
                {product.discount > 0 && (
                    <span className="absolute top-4 right-4 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full z-10">
                        -{product.discount}%
                    </span>
                )}
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                    />
                ) : (
                    <div className="flex flex-col items-center text-gray-400">
                        <ImageIcon className="h-10 w-10 mb-2" />
                        <span className="text-xs">Sin imagen</span>
                    </div>
                )}
            </div>
            <CardContent className="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-slate-900 line-clamp-2 text-md leading-tight">{product.name}</h3>
                        {/* Actions could go here */}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Papelería • SKU: {displaySku}</p>
                </div>

                <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-slate-900">${Number(product.price).toLocaleString()}</span>
                    {product.discount > 0 && (
                        <span className="text-sm text-gray-400 line-through">
                            ${(product.price * (1 + product.discount / 100)).toLocaleString()}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const StationeryProductsView = () => {
    const { products, fetchProducts, addProduct, deleteProduct, store } = useStoreDashboard();
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');

    // Add Product State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        stock: '1',
        category: 'Office',
        sku: '',
        image_url: ''
    });
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        if (store?.id) fetchProducts(store.id);
    }, [store?.id, fetchProducts]);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

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

        if (uploadError) {
            throw new Error(`Error al subir archivo: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);
        return urlData.publicUrl;
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let imageUrl = formData.image_url;
            if (imageFile && store?.id) {
                // Sanitize filename
                const fileName = imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
                const imagePath = `${store.id}/${Date.now()}_${fileName}`;
                imageUrl = await uploadFile(imageFile, 'product-images', imagePath);
            }

            // Prepare payload WITHOUT sku column to avoid schema error
            // Embed SKU in description
            const productDescription = formData.sku
                ? `${formData.description || ''}\n\nSKU: ${formData.sku}`
                : formData.description;

            const productPayload = {
                name: formData.name,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                product_type: 'physical',
                requires_shipping: true,
                image_url: imageUrl,
                description: productDescription,
                store_id: store?.id,
                // Do NOT include 'sku' here as column is missing in DB
            };

            await addProduct(productPayload);

            toast({ title: "Producto creado", description: "El producto se ha añadido correctamente." });
            setIsAddOpen(false);
            // Reset form
            setFormData({ name: '', price: '', description: '', stock: '1', category: 'Office', sku: '', image_url: '' });
            setImageFile(null);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: error.message || "Error al crear producto", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
        try {
            await deleteProduct(id);
            toast({ title: "Producto eliminado" });
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Inventario de Productos</h1>
                <p className="text-gray-500">Gestiona tu catálogo, precios y descuentos activos.</p>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nombre, SKU o categoría..."
                        className="pl-10 bg-gray-50 border-transparent focus:bg-white transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Select defaultValue="all">
                        <SelectTrigger className="w-[130px] rounded-full bg-gray-50 border-transparent">
                            <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Categoría</SelectItem>
                            <SelectItem value="office">Oficina</SelectItem>
                            <SelectItem value="school">Escolar</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex bg-gray-50 rounded-full p-1 border border-gray-100">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`rounded-full h-8 w-8 ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`rounded-full h-8 w-8 ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-6">
                            <Plus className="h-4 w-4 mr-2" /> Añadir Producto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Agregar Nuevo Producto</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddProduct} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre del Producto</Label>
                                <Input id="name" name="name" required value={formData.name} onChange={handleInputChange} placeholder="Ej: Cuaderno Norma" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Precio</Label>
                                    <Input id="price" name="price" type="number" required value={formData.price} onChange={handleInputChange} placeholder="0.00" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stock">Stock</Label>
                                    <Input id="stock" name="stock" type="number" required value={formData.stock} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Categoría</Label>
                                <Input id="category" name="category" value={formData.category} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sku">SKU (Opcional)</Label>
                                <Input id="sku" name="sku" value={formData.sku} onChange={handleInputChange} placeholder="COD-001" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="image_upload">Imagen</Label>
                                <Input id="image_upload" type="file" accept="image/*" onChange={handleFileChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} />
                            </div>
                            <Button type="submit" className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-bold" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Producto"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="relative group">
                        <StationeryProductCard product={{ ...product, discount: 0 }} />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full shadow-md z-20"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProduct(product.id);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {filteredProducts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400">
                        No se encontraron productos. Añade uno nuevo para empezar.
                    </div>
                )}
            </div>
        </div>
    );
};

const StationeryDashboard = ({ store }) => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Resumen', path: '' },
        { icon: ShoppingCart, label: 'Pedidos', path: 'pedidos' },
        { icon: Package, label: 'Productos', path: 'productos' },
        { icon: Upload, label: 'Importar', path: 'importar' },
        { icon: DollarSign, label: 'Finanzas', path: 'finanzas' },
        { icon: Users, label: 'Equipo', path: 'equipo' },
        { icon: Settings, label: 'Configuración', path: 'configuracion' },
    ];

    return (
        <DashboardLayout title={store?.name || "Papelería Admin"} subtitle="Panel de Gestión" navItems={navItems}>
            <Suspense fallback={<div className="h-full flex items-center justify-center"><LoadingSpinner /></div>}>
                <Routes>
                    <Route path="/" element={<OverviewTab storeId={store.id} />} />
                    <Route path="pedidos" element={<OrdersTab storeId={store.id} />} />
                    <Route path="productos" element={<StationeryProductsView />} />
                    <Route path="importar" element={<BulkUploadTab storeId={store.id} />} />
                    <Route path="finanzas" element={<FinancialsTab storeId={store.id} />} />
                    <Route path="equipo" element={<AdminTab storeId={store.id} />} />
                    <Route path="configuracion" element={<ProfileTab />} />
                </Routes>
            </Suspense>
        </DashboardLayout>
    );
};

export default StationeryDashboard;
