
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Trash2, Package, FileImage as ImageIcon, Loader2, Pencil } from 'lucide-react';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import { toast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { supabase } from '@/lib/customSupabaseClient';

const ProductsTab = ({ storeId }) => {
  // Using granular loading state
  const { products, fetchProducts, addProduct, updateProduct, deleteProduct, isLoadingProducts } = useStoreDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    stock: '1',
    category: 'General',
    image_url: ''
  });
  const [imageFile, setImageFile] = useState(null);

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

  useEffect(() => {
    if (storeId) {
      fetchProducts(storeId);
    }
  }, [storeId, fetchProducts]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', description: '', stock: '1', category: 'General', image_url: '' });
    setImageFile(null);
    setIsAddOpen(true);
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description || '',
      stock: product.stock,
      category: product.category || 'General',
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
        toast({ title: "Producto actualizado", description: "Los cambios se han guardado correctamente." });
      } else {
        await addProduct(productPayload);
        toast({ title: "Producto creado", description: "El producto se ha añadido correctamente." });
      }

      setIsAddOpen(false);
      setEditingId(null);
      setFormData({ name: '', price: '', description: '', stock: '1', category: 'General', image_url: '' });
      setImageFile(null);
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      await deleteProduct(id);
      toast({ title: "Producto eliminado" });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar el producto.", variant: "destructive" });
    }
  };

  // Only show full spinner if we have absolutely no data
  if (isLoadingProducts && products.length === 0) return <LoadingSpinner text="Cargando inventario..." />;

  return (
    <Card className="h-full border-none shadow-none sm:border sm:shadow-sm animate-in fade-in duration-300">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 sm:px-6">
        <div>
          <CardTitle>Inventario de Productos</CardTitle>
          <CardDescription>Gestiona tus productos, precios y existencias.</CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700" onClick={openAddModal}>
              <Plus className="h-4 w-4 mr-2" /> Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Producto" : "Agregar Nuevo Producto"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Producto</Label>
                <Input id="name" name="name" required value={formData.name} onChange={handleInputChange} placeholder="Ej: Aguacates Hass" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio</Label>
                  <Input id="price" name="price" type="number" required value={formData.price} onChange={handleInputChange} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Disponible</Label>
                  <Input id="stock" name="stock" type="number" required value={formData.stock} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Input id="category" name="category" value={formData.category} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_upload">Imagen del Producto</Label>
                <div className="flex items-center gap-4">
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Preview" className="h-10 w-10 object-cover rounded border" />
                  )}
                  <Input id="image_upload" type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? "Actualizar Producto" : "Guardar Producto")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="flex items-center py-4 px-4 sm:px-0">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden sm:table-cell">Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No se encontraron productos.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="hidden sm:table-cell">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="h-10 w-10 rounded-md object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{product.name}</span>
                        <span className="text-xs text-muted-foreground sm:hidden">{product.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">${Number(product.price).toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

export default ProductsTab;
