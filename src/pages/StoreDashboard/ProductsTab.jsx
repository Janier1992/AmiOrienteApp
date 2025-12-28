
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

const ProductsTab = ({ storeId, terminology = {} }) => {
  // Using granular loading state
  const { products, fetchProducts, addProduct, updateProduct, deleteProduct, isLoadingProducts } = useStoreDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Terminology Defaults
  const T = {
    product: terminology.product || 'Producto',
    inventory: terminology.inventory || 'Stock'
  };

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
        toast({ title: `${T.product} actualizado`, description: "Los cambios se han guardado correctamente." });
      } else {
        await addProduct(productPayload);
        toast({ title: `${T.product} creado`, description: `El ${T.product.toLowerCase()} se ha añadido correctamente.` });
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
    if (!window.confirm(`¿Estás seguro de eliminar este ${T.product.toLowerCase()}?`)) return;
    try {
      await deleteProduct(id);
      toast({ title: `${T.product} eliminado` });
    } catch (error) {
      toast({ title: "Error", description: `No se pudo eliminar el ${T.product.toLowerCase()}.`, variant: "destructive" });
    }
  };

  // Only show full spinner if we have absolutely no data
  if (isLoadingProducts && products.length === 0) return <LoadingSpinner text={`Cargando ${T.product}s...`} />;

  return (
    <Card className="h-full border-none shadow-none sm:border sm:shadow-sm animate-in fade-in duration-300">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 sm:px-6">
        <div>
          <CardTitle>Inventario de {T.product}s</CardTitle>
          <CardDescription>Gestiona tus {T.product.toLowerCase()}s, precios y {T.inventory.toLowerCase()}.</CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700" onClick={openAddModal}>
              <Plus className="h-4 w-4 mr-2" /> Nuevo {T.product}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? `Editar ${T.product}` : `Agregar Nuevo ${T.product}`}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del {T.product}</Label>
                <Input id="name" name="name" required value={formData.name} onChange={handleInputChange} placeholder={`Ej: ${T.product} 1`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio</Label>
                  <Input id="price" name="price" type="number" required value={formData.price} onChange={handleInputChange} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">{T.inventory} Disponible</Label>
                  <Input id="stock" name="stock" type="number" required value={formData.stock} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Input id="category" name="category" value={formData.category} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_upload">Imagen</Label>
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
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? `Actualizar ${T.product}` : `Guardar ${T.product}`)}
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
              placeholder={`Buscar ${T.product.toLowerCase()}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {filteredProducts.length === 0 ? (
            <div className="h-24 text-center text-muted-foreground flex flex-col justify-center items-center">
              <Package className="h-8 w-8 mb-2 opacity-50" />
              <p>No se encontraron resultados.</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="flex p-4 gap-4">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-20 w-20 rounded-md object-cover" />
                    ) : (
                      <div className="h-20 w-20 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-base truncate">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>
                      <span className="font-bold text-lg">${Number(product.price).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {T.inventory}: {product.stock}
                      </span>

                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(product)} className="h-8 w-8 p-0 text-blue-600">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)} className="h-8 w-8 p-0 text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden sm:table-cell">Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">{T.inventory}</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No se encontraron {T.product.toLowerCase()}s.
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
