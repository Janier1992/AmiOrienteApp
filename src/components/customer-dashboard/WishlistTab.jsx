import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { Heart, Trash2, ShoppingCart, Loader2 } from 'lucide-react';
import { useCartActions } from '@/contexts/CartContext';
import { toast } from '@/components/ui/use-toast';

const WishlistTab = ({ userId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCartActions();

  useEffect(() => {
    fetchWishlist();
  }, [userId]);

  const fetchWishlist = async () => {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          products (
            id, name, price, image_url, description, stock, store_id, stores(name)
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (id) => {
    try {
      const { error } = await supabase.from('wishlist').delete().eq('id', id);
      if (error) throw error;
      setItems(items.filter(item => item.id !== id));
      toast({ title: "Eliminado", description: "Producto eliminado de la lista de deseos." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el producto." });
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast({ title: "Agregado", description: "Producto agregado al carrito." });
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi Lista de Deseos</CardTitle>
        <CardDescription>Guarda tus productos favoritos para después.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No tienes productos guardados aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const product = item.products;
              return (
                <div key={item.id} className="border rounded-lg overflow-hidden flex flex-col">
                  <div className="h-40 overflow-hidden bg-gray-100">
                    <img 
                      src={product.image_url || 'https://placehold.co/400x300'} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-semibold truncate" title={product.name}>{product.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{product.stores?.name}</p>
                    <p className="font-bold text-lg mb-4">${Number(product.price).toLocaleString()}</p>
                    
                    <div className="mt-auto flex gap-2">
                      <Button 
                        className="flex-1" 
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock <= 0}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {product.stock > 0 ? 'Agregar' : 'Agotado'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeFromWishlist(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WishlistTab;