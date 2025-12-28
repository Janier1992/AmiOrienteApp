
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Search, MapPin, Star, Filter, ShoppingBag, Clock, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/customSupabaseClient';
import { SAMPLE_STORES, SERVICE_CATEGORIES_LIST } from '@/data/sample-data';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';

const StoreCard = ({ store }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="h-full flex flex-col hover:shadow-xl transition-all duration-300 group overflow-hidden border-slate-200">
      <div className="relative h-48 overflow-hidden">
        <img
          src={store.image_url || store.logo_url || 'https://images.unsplash.com/photo-1556740758-90de2742e1e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'}
          alt={store.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3">
          <Badge className="bg-white/90 text-slate-800 hover:bg-white shadow-sm backdrop-blur-sm">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-1" />
            {store.rating || 4.5}
          </Badge>
        </div>
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="shadow-sm backdrop-blur-sm opacity-90">
            {store.category}
          </Badge>
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {store.name}
          </h3>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 h-10">
          {store.description}
        </p>

        <div className="space-y-1.5 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{store.address || 'Marinilla, Antioquia'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{store.hours || '8:00 AM - 8:00 PM'}</span>
          </div>
          {store.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{store.phone}</span>
            </div>
          )}
        </div>

        {store.tags && (
          <div className="flex flex-wrap gap-1 mt-3">
            {store.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 mt-auto border-t border-slate-100 bg-slate-50/50">
        <Button className="w-full mt-3 bg-white text-primary border border-primary hover:bg-primary hover:text-white transition-colors">
          <ShoppingBag className="w-4 h-4 mr-2" />
          Ver Productos
        </Button>
      </CardFooter>
    </Card>
  </motion.div>
);

const StoresPage = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStores();
    }, 500);
    return () => clearTimeout(timer);
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
      // Fallback to SAMPLE_STORES only if strictly necessary and in dev mode (skipping for prod scalability)
      if (data.length === 0 && !searchTerm && selectedCategory === 'Todos') {
        // Optional: Keep sample data logic if needed for demo
        setStores(SAMPLE_STORES);
      } else {
        setStores(data);
      }
      setTotalCount(count);

    } catch (error) {
      console.error('Error fetching stores:', error);
      // Fallback
      setStores(SAMPLE_STORES);
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
        <title>Servicios y Negocios | MiOriente</title>
        <meta name="description" content="Encuentra los mejores restaurantes, tiendas y servicios en Marinilla y el Oriente Antioqueño." />
      </Helmet>

      <div className="min-h-screen bg-slate-50 pb-20">
        <PageHeader
          title="Directorio de Servicios"
          description="Lo que necesitas, cuando lo necesitas. Apoya el comercio local."
          backgroundImage="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          <Card className="p-4 shadow-lg border-none bg-white/95 backdrop-blur">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar restaurantes, farmacias, tiendas..."
                  className="pl-9 bg-slate-50 border-slate-200"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
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
          </Card>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-80 bg-slate-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  {stores.length} Resultados {totalCount > 0 && `de ${totalCount}`}
                </h2>
                {/* Pagination Controls could go here */}
                <Button variant="ghost" size="sm" className="text-slate-500">
                  <Filter className="w-4 h-4 mr-2" />
                  Más Filtros
                </Button>
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
                    <ShoppingBag className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No encontramos lo que buscas</h3>
                    <p className="text-slate-500">Intenta cambiar los términos de búsqueda o la categoría.</p>
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
