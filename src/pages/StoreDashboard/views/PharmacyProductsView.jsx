
import React, { useState, useEffect } from 'react';
import {
    Plus,
    Pill,
    Loader2,
    Trash2,
    Pencil
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import { usePharmacyStore } from '@/stores/usePharmacyStore';

/**
 * Tarjeta de Medicamento
 */
const PharmacyProductCard = ({ product, onEdit, onDelete }) => {
    // Meta is now pre-parsed by the service
    const meta = product.meta || {};

    // Check expiration risk
    const daysUntilExpiration = meta.expirationDate
        ? Math.ceil((new Date(meta.expirationDate) - new Date()) / (1000 * 60 * 60 * 24))
        : 999;

    const isExpired = daysUntilExpiration < 0;
    const isRisk = daysUntilExpiration < 90 && !isExpired;

    return (
        <Card className="rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all group bg-white h-full flex flex-col">
            <div className="p-4 flex items-start justify-between bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <Pill className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 leading-tight">{product.name}</h3>
                        <p className="text-xs text-slate-500">{meta.laboratory || 'Laboratorio Genérico'}</p>
                    </div>
                </div>
                {meta.requiresPrescription && (
                    <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-[10px]">
                        Rx
                    </Badge>
                )}
            </div>

            <CardContent className="p-4 flex-1 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                        <span className="text-gray-400 block mb-1">Lote</span>
                        <span className="font-mono text-slate-700">{meta.batchNumber || 'N/A'}</span>
                    </div>
                    <div className={`p-2 rounded border ${isExpired ? 'bg-red-50 border-red-200' : (isRisk ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200')}`}>
                        <span className={`block mb-1 ${isExpired ? 'text-red-400' : 'text-gray-400'}`}>Vence</span>
                        <span className={`font-bold ${isExpired ? 'text-red-700' : 'text-slate-700'}`}>
                            {meta.expirationDate || 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="mt-auto pt-2 flex items-center justify-between">
                    <div>
                        <span className="text-lg font-bold text-blue-900">${Number(product.price).toLocaleString()}</span>
                        <p className="text-xs text-slate-400">Stock: {product.stock}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => onEdit(product)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => onDelete(product.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * Vista de Farmacia
 */
const PharmacyProductsView = () => {
    const { products, fetchProducts, saveProduct, deleteProduct, isLoading } = usePharmacyStore();
    const { store } = useStoreDashboard();

    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '1',
        description: '', // Description text (indications)
        // Meta fields
        expirationDate: '',
        batchNumber: '',
        requiresPrescription: false,
        presentation: 'Caja',
        laboratory: ''
    });

    useEffect(() => {
        if (store?.id) fetchProducts(store.id);
    }, [store?.id, fetchProducts]);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const openCreateModal = () => {
        setEditingProduct(null);
        setFormData({
            name: '', price: '', stock: '10', description: '',
            expirationDate: '', batchNumber: '', requiresPrescription: false, presentation: 'Caja', laboratory: ''
        });
        setIsAddOpen(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        const meta = product.meta || {};

        setFormData({
            name: product.name,
            price: product.price,
            stock: product.stock,
            description: product.description || '', // Clean description from service
            ...meta
        });
        setIsAddOpen(true);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const productPayload = {
                id: editingProduct ? editingProduct.id : undefined,
                name: formData.name,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                product_type: 'physical',
                requires_shipping: true,
                description: formData.description,
                category: 'Farmacia',
                store_id: store?.id,
                meta: {
                    expirationDate: formData.expirationDate,
                    batchNumber: formData.batchNumber,
                    requiresPrescription: formData.requiresPrescription,
                    presentation: formData.presentation,
                    laboratory: formData.laboratory
                }
            };

            await saveProduct(productPayload);

            toast({ title: editingProduct ? "Medicamento actualizado" : "Medicamento registrado" });

            setIsAddOpen(false);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("¿Retirar medicamento?")) return;
        await deleteProduct(id);
    };


    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
                        <Pill className="h-8 w-8 text-blue-600" />
                        Inventario Farmacéutico
                    </h1>
                    <p className="text-blue-700 mt-1">Control de vencimientos, lotes y regencia.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 rounded-full" onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" /> Nuevo Medicamento
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                    <PharmacyProductCard
                        key={product.id}
                        product={{ ...product, discount: 0 }}
                        onEdit={openEditModal}
                        onDelete={handleDeleteProduct}
                    />
                ))}
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Gestión de Medicamento</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveProduct} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Nombre Comercial / Genérico</Label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Laboratorio</Label>
                                <Input value={formData.laboratory} onChange={e => setFormData({ ...formData, laboratory: e.target.value })} placeholder="Ej: Bayer, MK" />
                            </div>
                            <div className="space-y-2">
                                <Label>Presentación</Label>
                                <Select value={formData.presentation} onValueChange={v => setFormData({ ...formData, presentation: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Caja">Caja</SelectItem>
                                        <SelectItem value="Frasco">Frasco</SelectItem>
                                        <SelectItem value="Tableta">Tableta</SelectItem>
                                        <SelectItem value="Ampolla">Ampolla</SelectItem>
                                        <SelectItem value="Unidad">Unidad</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Lote</Label>
                                <Input value={formData.batchNumber} onChange={e => setFormData({ ...formData, batchNumber: e.target.value })} placeholder="B-123456" />
                            </div>
                            <div className="space-y-2">
                                <Label>Fecha Vencimiento</Label>
                                <Input type="date" value={formData.expirationDate} onChange={e => setFormData({ ...formData, expirationDate: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Precio Venta</Label>
                                <Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Stock Disponible</Label>
                                <Input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} required />
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-red-50 p-3 rounded border border-red-100">
                            <Label className="text-red-800">¿Requiere Fórmula Médica?</Label>
                            <Switch checked={formData.requiresPrescription} onCheckedChange={c => setFormData({ ...formData, requiresPrescription: c })} />
                        </div>

                        <div className="space-y-2">
                            <Label>Indicaciones / Descripción</Label>
                            <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Guardar Medicamento'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PharmacyProductsView;
