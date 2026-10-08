
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Star, ShoppingBag, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';


import { customerService } from '@/services/customerService';
import { SAMPLE_STORES, SERVICE_CATEGORIES_LIST } from '@/data/sample-data';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';

const StoreCard = ({ store }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200 group overflow-hidden border-border rounded-2xl">
      <div className="relative h-40 overflow-hidden bg-primary/5">
        <img
          src={store.logo_url || store.image_url || 'https://images.unsplash.com/photo-1556740758-90de2742e1e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'}
          alt={store.name}
          className="w-full h-full object-cover"
        />
        {(store.star_rating || store.rating) && (
          <span className="absolute bottom-2 left-2 bg-white rounded-full px-2 py-0.5 text-[11px] font-bold text-amber-600 flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            {store.star_rating || store.rating}
          </span>
        )}
      </div>

      <CardHeader className="p-4 pb-1">
        <h3 className="font-semibold text-base line-clamp-1">{store.name}</h3>
        <p className="text-xs text-muted-foreground">{store.category || 'Comercio local'}</p>
      </CardHeader>

      <CardContent className="p-4 pt-1 flex-grow">
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{store.address || 'Marinilla, Antioquia'}</span>
          </div>
          {store.hours && (
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{store.hours}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 mt-auto">
        {store._isSample ? (
          <Button disabled className="w-full cursor-not-allowed opacity-60">
            Próximamente en la plataforma
          </Button>
        ) : (
          <Link to={`/productos?tienda=${store.id}`} className="w-full">
            <Button className="w-full" variant="outline">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Ver Productos
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  </motion.div>
);

const StoresPage = () => {
  const [searchParams] = useSearchParams();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Permite llegar ya filtrado desde fuera (ej. las categorías del Home: /servicios?categoria=Restaurante)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoria') || 'Todos');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStores();
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory, page]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const { data, count } = await customerService.getStores({
        page,
        limit: 12, // 12 items per page
        search: searchTerm,
        category: selectedCategory
      });

      // If we have search/filter results, prioritize them.
      // Only fall back to the curated sample list for the default, unfiltered
      // browse view when the platform has no real stores registered yet —
      // and mark them as such, since they aren't real platform listings and
      // "Ver Productos" has nowhere real to send a customer for them.
      if (data.length === 0 && !searchTerm && selectedCategory === 'Todos') {
        setStores(SAMPLE_STORES.map(s => ({ ...s, _isSample: true })));
      } else {
        setStores(data);
      }
      setTotalCount(count);

    } catch (error) {
      console.error('Error fetching stores:', error);
      // Fallback
      setStores(SAMPLE_STORES.map(s => ({ ...s, _isSample: true })));
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setPage(1); // Reset to page 1 on filter change
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to page 1
  };

  return (
    <>
      <Helmet>
        <title>Servicios y Negocios | AmiOriente</title>
        <meta name="description" content="Encuentra los mejores restaurantes, tiendas y servicios en Marinilla y el Oriente Antioqueño." />
      </Helmet>

      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <PageHeader
            title="Directorio de Servicios"
            description="Lo que necesitas, cuando lo necesitas. Apoya el comercio local."
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-grow w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar restaurantes, farmacias, tiendas..."
                className="pl-9"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              <Button
                variant={selectedCategory === 'Todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryChange('Todos')}
                className="whitespace-nowrap"
              >
                Todos
              </Button>
              {SERVICE_CATEGORIES_LIST.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryChange(cat)}
                  className="whitespace-nowrap"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-80 bg-muted rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  {stores.length} Resultados {totalCount > 0 && `de ${totalCount}`}
                </h2>
              </div>

              <AnimatePresence mode='popLayout'>
                {stores.length > 0 ? (
                  <div className="space-y-8">
                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {stores.map(store => (
                        <StoreCard key={store.id} store={store} />
                      ))}
                    </motion.div>

                    {/* Simple Pagination */}
                    <div className="flex justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPage(p => p + 1)}
                        disabled={stores.length < 12}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground">No encontramos lo que buscas</h3>
                    <p className="text-muted-foreground">Intenta cambiar los términos de búsqueda o la categoría.</p>
                    <Button
                      variant="link"
                      onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); }}
                      className="mt-2"
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                )}
              </AnimatePresence>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default StoresPage;
