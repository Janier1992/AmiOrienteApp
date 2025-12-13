import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { useCartStore, useCartActions } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { ShoppingBag, Package, Loader2, Leaf, Search } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import CartSidebar from '@/components/CartSidebar';

const ProductCard = ({ product }) => {
  const { addToCart } = useCartActions();

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "¡Agregado al carrito!",
      description: `${product.name} ha sido añadido a tu carrito.`,
    });
  };

  const price = Number(product.price) || 0;
  // Safely access nested properties
  const isFarmerProduct = product.stores?.service_categories?.name === 'Cultivadores';

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 group border border-border flex flex-col bg-card text-card-foreground">
      <div className="relative">
        <img
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          src={product.image_url || "https://images.unsplash.com/photo-1556217257-aa1d0c385e62"} />
        {isFarmerProduct && (
          <div className="absolute top-2 left-2 soy-del-campo-badge text-xs font-bold px-2 py-1 rounded-full flex items-center">
            <Leaf className="mr-1 h-3 w-3" />
            Soy Del Campo
          </div>
        )}
      </div>
      <CardContent className="p-4 flex-grow flex flex-col">
        <p className="text-xs text-muted-foreground mb-1">{product.stores?.name || 'Proveedor'}</p>
        <h3 className="text-md font-semibold text-foreground truncate flex-grow">{product.name}</h3>
        <p className="text-lg font-bold text-foreground mt-2">
          ${price.toLocaleString()}
        </p>
        <Button onClick={handleAddToCart} className="w-full mt-4">
          <ShoppingBag className="mr-2 h-4 w-4" />
          Añadir al Carrito
        </Button>
      </CardContent>
    </Card>
  );
};

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [storeName, setStoreName] = useState("Todos los Productos");
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const getCartItemCount = useCartStore(state => state.getCartItemCount);
  const cartItemCount = getCartItemCount();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('tienda');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      // Simplified query to avoid complex joins that might be missing foreign keys in Supabase schema
      // We will fetch products first, then fetch store details if needed
      let query = supabase.from('products').select('*');

      if (storeId) {
        query = query.eq('store_id', storeId);
        const { data: storeData, error: storeError } = await supabase.from('stores').select('name').eq('id', storeId).single();
        if (!storeError && storeData) {
          setStoreName(storeData.name);
        }
      } else {
        setStoreName("Todos los Productos");
      }

      const { data: productsData, error: productsError } = await query.order('created_at', { ascending: false });

      if (productsError) {
        console.error("Error fetching products:", productsError);
        toast({ title: "Error", description: "No se pudieron cargar los productos." });
        setLoading(false);
        return;
      }

      // If we have products, let's try to fetch store names manually to avoid the join error
      if (productsData && productsData.length > 0) {
        const storeIds = [...new Set(productsData.map(p => p.store_id).filter(Boolean))];

        if (storeIds.length > 0) {
          const { data: storesData } = await supabase
            .from('stores')
            .select('id, name, service_categories(name)')
            .in('id', storeIds);

          // Map store data back to products
          const productsWithStores = productsData.map(product => {
            const store = storesData?.find(s => s.id === product.store_id);
            return {
              ...product,
              stores: store || { name: 'Proveedor' }
            };
          });

          setProducts(productsWithStores);
        } else {
          setProducts(productsData);
        }
      } else {
        setProducts([]);
      }

      setLoading(false);
    };

    fetchProducts();
  }, [storeId]);


  return (
    <>
      <Helmet>
        <title>{storeName} - Domicilios MiOriente</title>
        <meta name="description" content={`Explora y compra los mejores productos de ${storeName}.`} />
      </Helmet>

      <div className="bg-background min-h-screen">
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">{storeName}</h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Descubre los sabores y la tradición del Oriente Antioqueño en un solo lugar.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-10 -mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Buscar productos (ej. Zanahoria, Café, Arepas)..."
                className="pl-10 py-6 text-lg shadow-lg border-primary/20 focus-visible:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center flex justify-center items-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
              <p className="ml-2 text-foreground">Cargando productos...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Este proveedor aún no tiene productos. ¡Vuelve pronto!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {products
                .filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          )}
        </main>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsCartOpen(true)}
          size="icon"
          className="relative h-16 w-16 rounded-full shadow-2xl transition-transform hover:scale-110"
        >
          <ShoppingBag className="h-8 w-8" />
          {cartItemCount > 0 && (
            <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-destructive text-destructive-foreground text-sm font-bold rounded-full h-7 w-7 flex items-center justify-center border-2 border-background">
              {cartItemCount}
            </span>
          )}
          <span className="sr-only">Abrir carrito</span>
        </Button>
      </div>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default ProductsPage;