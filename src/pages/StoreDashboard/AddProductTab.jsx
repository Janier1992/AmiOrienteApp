import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

export const AddProductTab = ({ onProductAdded, storeId, productToEdit }) => {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: 1,
    product_type: 'physical',
    requires_shipping: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setProduct({
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        price: productToEdit.price || '',
        category: productToEdit.category || '',
        stock: productToEdit.stock || 1,
        product_type: productToEdit.product_type || 'physical',
        requires_shipping: productToEdit.requires_shipping !== false,
      });
    }
  }, [productToEdit]);

  const handleInputChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file, bucket, path) => {
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: !!productToEdit });

    if (uploadError) {
      throw new Error(`Error al subir archivo: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!storeId) {
      toast({ title: "Error", description: "ID de tienda no encontrado.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let imageUrl = productToEdit?.image_url;
      if (imageFile) {
        const imagePath = `${storeId}/${Date.now()}_${imageFile.name}`;
        imageUrl = await uploadFile(imageFile, 'product-images', imagePath);
      }

      const productData = {
        ...product,
        store_id: storeId,
        price: parseFloat(product.price),
        stock: parseInt(product.stock, 10),
        image_url: imageUrl,
      };

      if (productToEdit) {
        const { error } = await supabase.from('products').update(productData).eq('id', productToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(productData);
        if (error) throw error;
      }

      toast({ title: "¡Éxito!", description: `Producto ${productToEdit ? 'actualizado' : 'agregado'} correctamente.` });
      onProductAdded();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onProductAdded}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <CardTitle>{productToEdit ? 'Editar Producto' : 'Agregar Nuevo Producto'}</CardTitle>
            <p className="text-sm text-gray-600">Completa la información de tu producto.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Input name="name" placeholder="Nombre del producto" value={product.name} onChange={handleInputChange} required />
            <Textarea name="description" placeholder="Descripción del producto" value={product.description} onChange={handleInputChange} rows={4} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="category" placeholder="Categoría (ej. Frutas, Verduras)" value={product.category} onChange={handleInputChange} />
            <Input type="number" name="stock" placeholder="Stock disponible" value={product.stock} onChange={handleInputChange} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input type="number" name="price" placeholder="Precio (COP)" value={product.price} onChange={handleInputChange} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del producto</label>
            <Input type="file" onChange={handleFileChange} accept="image/*" />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Guardando...' : (productToEdit ? 'Guardar Cambios' : 'Guardar Producto')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};