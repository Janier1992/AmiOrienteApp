
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Map, Hotel, Utensils, Landmark, Mountain, Star, Search, Loader2, MapPin, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { SAMPLE_TOURISM_SPOTS } from '@/data/sample-data';
import { motion, AnimatePresence } from 'framer-motion';
import TourismSpotModal from '@/components/tourism/TourismSpotModal';

const categoryIcons = {
  'Hoteles': Hotel,
  'Restaurantes': Utensils,
  'Sitios de Interés': Landmark,
  'Naturaleza': Mountain,
  'Actividades': Star,
};

const TourismCard = ({ spot, onSelect }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.3 }}
    className="h-full"
    onClick={() => onSelect(spot)}
  >
    <Card className="overflow-hidden h-full flex flex-col hover:shadow-xl transition-all duration-300 cursor-pointer group border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="relative h-56 overflow-hidden">
        <div className="absolute inset-0 bg-slate-200 animate-pulse" /> {/* Loading skeleton placeholder */}
        <img 
          alt={spot.name}
          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
          src={spot.image_urls?.[0] || "https://images.unsplash.com/photo-1594201504659-ab3fb7db00dc"} 
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
        
        <div className="absolute top-3 right-3 flex gap-2">
             <div className="bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-full shadow-sm text-slate-800 flex items-center">
                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                {spot.rating || 4.5}
            </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3">
             <span className="inline-block bg-primary/90 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded mb-1">
                {spot.category_name}
             </span>
             <h3 className="text-white font-bold text-lg leading-tight shadow-black drop-shadow-md">{spot.name}</h3>
        </div>
      </div>
      
      <CardContent className="p-4 flex-grow flex flex-col justify-between">
        <div>
            <div className="flex items-start text-muted-foreground mb-3">
                <MapPin className="h-3.5 w-3.5 mt-1 mr-1.5 flex-shrink-0 text-primary" />
                <span className="text-xs line-clamp-1">{spot.address}</span>
            </div>
            <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                {spot.description}
            </p>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs font-medium text-primary cursor-pointer hover:underline flex items-center gap-1">
                Ver detalles
            </span>
            {spot.category_name === 'Hoteles' && <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100 font-medium">Reservar</span>}
            {spot.category_name === 'Restaurantes' && <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100 font-medium">Pedir</span>}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const TourismPage = () => {
  const [spots, setSpots] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpot, setSelectedSpot] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
          // Fetch categories
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('tourism_categories')
            .select('*');

          // Fetch spots with category join
          const { data: spotsData, error: spotsError } = await supabase
            .from('tourism_spots')
            .select('*, tourism_categories(name)');

          let fetchedCategories = categoriesData || [];
          let fetchedSpots = [];

          if (!spotsError && spotsData) {
              fetchedSpots = spotsData.map(s => ({
                  ...s, 
                  category_name: s.tourism_categories?.name
              }));
          }

          // Use sample data if DB is empty or fails
          if (fetchedSpots.length === 0) {
              fetchedSpots = SAMPLE_TOURISM_SPOTS;
          } else {
              // Optionally merge sample data for demo purposes if needed, 
              // but usually we prefer real data if available.
              // For now, let's append sample data to ensure richness
              fetchedSpots = [...fetchedSpots, ...SAMPLE_TOURISM_SPOTS];
               // Remove duplicates based on ID or Name to avoid clutter
              const uniqueMap = new Map();
              fetchedSpots.forEach(item => uniqueMap.set(item.name, item)); // using name as key for simplicity in demo
              fetchedSpots = Array.from(uniqueMap.values());
          }

          if (fetchedCategories.length === 0) {
               // Extract categories from sample data if DB categories empty
               const cats = [...new Set(SAMPLE_TOURISM_SPOTS.map(s => s.category_name))];
               fetchedCategories = cats.map((name, i) => ({ id: i, name }));
          }

          setCategories(fetchedCategories);
          setSpots(fetchedSpots);

      } catch (e) {
          console.error("Critical error in TourismPage:", e);
          setSpots(SAMPLE_TOURISM_SPOTS);
          const cats = [...new Set(SAMPLE_TOURISM_SPOTS.map(s => s.category_name))];
          setCategories(cats.map((name, i) => ({ id: i, name })));
      } finally {
          setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const filteredSpots = useMemo(() => {
    return spots.filter(spot => {
      const matchesCategory = selectedCategory === 'Todos' || spot.category_name === selectedCategory;
      const matchesSearch = spot.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (spot.address && spot.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (spot.description && spot.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [spots, selectedCategory, searchTerm]);

  return (
    <>
      <Helmet>
        <title>Turismo en Marinilla - MiOriente</title>
        <meta name="description" content="Descubre Marinilla: Hoteles, Restaurantes, Cultura y Naturaleza en el corazón de Antioquia." />
      </Helmet>
      
      <div className="min-h-screen bg-slate-50/50">
        {/* Hero Section */}
        <header className="relative bg-slate-900 text-white py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 z-0">
             <img 
                src="https://horizons-cdn.hostinger.com/9a2f1d5f-26c5-4fa8-b3e7-17e2b7bc86a9/7903e645a9d3db709ac238561aef0e07.jpg" 
                alt="Marinilla Background" 
                className="w-full h-full object-cover opacity-40 blur-sm scale-105"
             />
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90"></div>
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <motion.div initial={{opacity: 0, y: 30}} animate={{opacity: 1, y: 0}} transition={{duration: 0.6}}>
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
                  Descubre <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">Marinilla</span>
                </h1>
                <p className="text-lg md:text-2xl text-slate-200 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
                  La Esparta Colombiana te espera con su riqueza histórica, su gastronomía única y paisajes inolvidables.
                </p>
            </motion.div>
            
            {/* Search Bar in Hero */}
            <motion.div 
                initial={{opacity: 0, scale: 0.9}} 
                animate={{opacity: 1, scale: 1}} 
                transition={{duration: 0.5, delay: 0.3}}
                className="max-w-xl mx-auto relative group"
            >
              <div className="absolute inset-0 bg-white/20 blur-xl rounded-full group-hover:bg-white/30 transition-all"></div>
              <div className="relative flex items-center bg-white rounded-full shadow-2xl p-2">
                <Search className="h-6 w-6 text-slate-400 ml-3" />
                <Input 
                  type="text" 
                  placeholder="¿Qué buscas? (Ej: Hotel Cannua, Iglesia...)"
                  className="border-none shadow-none focus-visible:ring-0 text-slate-800 placeholder:text-slate-400 h-12 text-base bg-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </motion.div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-10 relative z-20">
          {/* Categories Nav */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
              <Button 
                variant={selectedCategory === 'Todos' ? 'default' : 'secondary'} 
                className={`rounded-full shadow-lg transition-all ${selectedCategory === 'Todos' ? 'bg-primary hover:bg-primary/90' : 'bg-white hover:bg-slate-100 text-slate-700'}`}
                onClick={() => setSelectedCategory('Todos')}
              >
                Todos
              </Button>
              {categories.map((cat, idx) => {
                const Icon = categoryIcons[cat.name] || Map;
                return (
                  <Button 
                    key={cat.id || idx} 
                    variant={selectedCategory === cat.name ? 'default' : 'secondary'}
                    className={`rounded-full shadow-lg border-0 transition-all ${selectedCategory === cat.name ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-white hover:bg-slate-100 text-slate-700'}`}
                    onClick={() => setSelectedCategory(cat.name)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {cat.name}
                  </Button>
                );
              })}
          </div>

          {/* Results Grid */}
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 text-slate-500">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p>Cargando lo mejor de Marinilla...</p>
            </div>
          ) : (
            <AnimatePresence mode='popLayout'>
               {filteredSpots.length > 0 ? (
                  <motion.div 
                    layout 
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                  >
                    {filteredSpots.map(spot => (
                      <TourismCard key={spot.id} spot={spot} onSelect={setSelectedSpot} />
                    ))}
                  </motion.div>
               ) : (
                 <motion.div 
                    initial={{opacity: 0}} animate={{opacity: 1}} 
                    className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300"
                 >
                    <Map className="h-20 w-20 text-slate-200 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-700 mb-2">No encontramos resultados</h2>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Intenta con otra categoría o busca algo diferente en Marinilla.
                    </p>
                    <Button 
                        variant="link" 
                        onClick={() => {setSelectedCategory('Todos'); setSearchTerm('')}}
                        className="mt-4 text-primary"
                    >
                        Ver todo
                    </Button>
                 </motion.div>
               )}
            </AnimatePresence>
          )}
        </main>
      </div>

      <TourismSpotModal spot={selectedSpot} isOpen={!!selectedSpot} onClose={() => setSelectedSpot(null)} />
    </>
  );
};

export default TourismPage;
