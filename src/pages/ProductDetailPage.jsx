
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import WishlistButton from '@/components/shared/WishlistButton';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ShoppingBag, Loader2, ArrowLeft, Minus, Plus, Store as StoreIcon } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useCartActions } from '@/contexts/CartContext';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCartActions();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let active = true;

    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, stores(id, name)')
        .eq('id', id)
        .single();

      if (!active) return;

      if (error || !data) {
        toast({ title: 'Error', description: 'No se pudo encontrar este producto.', variant: 'destructive' });
        navigate('/productos');
        return;
      }

      setProduct(data);
      setLoading(false);
    };

    fetchProduct();
    return () => { active = false; };
  }, [id, navigate]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast({
      title: '¡Agregado al carrito!',
      description: `${quantity} x ${product.name} añadido a tu carrito.`,
    });
  };

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const price = Number(product.price) || 0;
  const stock = product.stock !== undefined && product.stock !== null ? Number(product.stock) : null;
  const isOutOfStock = stock !== null && stock <= 0;

  return (
    <>
      <Helmet>
        <title>{product.name} - AmiOriente</title>
        <meta name="description" content={product.description || product.name} />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="overflow-hidden">
            <img
              src={product.image_url || "https://images.unsplash.com/photo-1556217257-aa1d0c385e62"}
              alt={product.name}
              className="w-full h-80 object-cover"
            />
          </Card>

          <div className="space-y-4">
            {product.stores?.name && (
              <Link
                to={`/productos?tienda=${product.stores.id}`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
              >
                <StoreIcon className="h-4 w-4 mr-1" /> {product.stores.name}
              </Link>
            )}

            <div className="flex items-start justify-between gap-3">
              <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
              <WishlistButton productId={product.id} className="shrink-0" />
            </div>
            <p className="text-2xl font-bold text-primary">${price.toLocaleString()}</p>

            {product.description && (
              <p className="text-muted-foreground">{product.description}</p>
            )}

            {isOutOfStock ? (
              <p className="text-destructive font-medium">Agotado</p>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-semibold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(q => stock !== null ? Math.min(stock, q + 1) : q + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Button onClick={handleAddToCart} size="lg" className="w-full">
                  <ShoppingBag className="mr-2 h-5 w-5" /> Añadir al Carrito
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage;
