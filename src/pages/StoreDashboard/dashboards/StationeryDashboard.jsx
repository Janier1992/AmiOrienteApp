import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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
    Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Reusing existing tabs where appropriate, but customizing the Products view
import OverviewTab from '../OverviewTab';
import OrdersTab from '../OrdersTab';
import ProfileTab from '../ProfileTab';
import AdminTab from '../AdminTab';
import BulkUploadTab from '../BulkUploadTab';
import FinancialsTab from '../FinancialsTab';

import { useStoreDashboard } from '@/stores/useStoreDashboard';

// Custom Product Card for Stationery (Matches the requested design)
const StationeryProductCard = ({ product }) => (
    <Card className="rounded-3xl overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow group bg-white">
        <div className="relative h-48 bg-gray-100 p-4 flex items-center justify-center">
            {/* Discount Badge */}
            {product.discount > 0 && (
                <span className="absolute top-4 right-4 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                    -{product.discount}%
                </span>
            )}
            <img
                src={product.image_url || "https://via.placeholder.com/150"}
                alt={product.name}
                className="max-h-full max-w-full object-contain mix-blend-multiply"
            />
        </div>
        <CardContent className="p-4">
            <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-slate-900 line-clamp-2 text-md leading-tight">{product.name}</h3>
                {/* Context Menu or Icon */}
                <div className="text-gray-400">⋮</div>
            </div>
            <p className="text-xs text-gray-500 mb-2">Papelería • SKU: {product.sku || '0000'}</p>

            <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900">${product.price.toLocaleString()}</span>
                {product.discount > 0 && (
                    <span className="text-sm text-gray-400 line-through">
                        ${(product.price * (1 + product.discount / 100)).toLocaleString()}
                    </span>
                )}
            </div>
        </CardContent>
    </Card>
);

const StationeryProductsView = () => {
    const { products, fetchProducts, store } = useStoreDashboard();
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (store?.id) fetchProducts(store.id);
    }, [store?.id, fetchProducts]);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Mock functionality for UI
    const handleAddProduct = () => alert("Funcionalidad de Agregar Producto");

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

                    <Select defaultValue="active">
                        <SelectTrigger className="w-[110px] rounded-full bg-gray-50 border-transparent">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="draft">Borrador</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select defaultValue="price_asc">
                        <SelectTrigger className="w-[110px] rounded-full bg-gray-50 border-transparent">
                            <SelectValue placeholder="Precio" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="price_asc">Precio ⬆</SelectItem>
                            <SelectItem value="price_desc">Precio ⬇</SelectItem>
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

                <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-6" onClick={handleAddProduct}>
                    <Plus className="h-4 w-4 mr-2" /> Añadir Producto
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredProducts.map((product) => (
                    // Adding dummy discount/sku for visualization if missing
                    <StationeryProductCard key={product.id} product={{ ...product, discount: 10, sku: product.id.slice(0, 4).toUpperCase() }} />
                ))}
                {filteredProducts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400">
                        No se encontraron productos.
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
        { icon: Package, label: 'Productos', path: 'productos' }, // Using 'productos' path to default to our custom view if needed, but standard is usually 'productos' or 'menu'
        { icon: Upload, label: 'Importar', path: 'importar' },
        { icon: DollarSign, label: 'Finanzas', path: 'finanzas' },
        { icon: Users, label: 'Equipo', path: 'equipo' },
        { icon: Settings, label: 'Configuración', path: 'configuracion' },
    ];

    return (
        <DashboardLayout title="Papelería Admin" subtitle="Panel de Gestión" navItems={navItems}>
            <Routes>
                <Route path="/" element={<OverviewTab storeId={store.id} />} />
                <Route path="pedidos" element={<OrdersTab storeId={store.id} />} />
                {/* Custom Products View */}
                <Route path="productos" element={<StationeryProductsView />} />

                <Route path="importar" element={<BulkUploadTab storeId={store.id} />} />
                <Route path="finanzas" element={<FinancialsTab storeId={store.id} />} />
                <Route path="equipo" element={<AdminTab storeId={store.id} />} />
                <Route path="configuracion" element={<ProfileTab />} />
            </Routes>
        </DashboardLayout>
    );
};

export default StationeryDashboard;
