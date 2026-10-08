
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  Search, MapPin, Star, Utensils, ShoppingCart, Pill, Shirt,
  Croissant, Sprout, Hotel, Store, Loader2, User, Truck, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { customerService } from '@/services/customerService';
import { SERVICE_CATEGORIES_LIST } from '@/data/sample-data';

// Mismo set de categorías que filtra StoresPage (stores.category real),
// con un ícono por categoría para el grid del Home.
const CATEGORY_ICON = {
  'Restaurante': Utensils,
  'Hotel': Hotel,
  'Ropa': Shirt,
  'Farmacia': Pill,
  'Papelería': Store,
  'Panadería': Croissant,
  'Supermercado': ShoppingCart,
  'Cultivador': Sprout,
  'Veterinaria': Store,
  'General': Store,
};

const CategoryTile = ({ name }) => {
  const Icon = CATEGORY_ICON[name] || Store;
  return (
    <Link
      to={`/servicios?categoria=${encodeURIComponent(name)}`}
      className="flex flex-col items-center gap-2 group"
    >
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center transition-transform group-hover:-translate-y-0.5">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <span className="text-xs font-medium text-foreground text-center leading-tight">{name}</span>
    </Link>
  );
};

const StoreCard = ({ store }) => (
  <Link
    to={`/productos?tienda=${store.id}`}
    className="flex-shrink-0 w-44 rounded-2xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md"
  >
    <div className="h-24 bg-muted relative">
      {store.logo_url ? (
        <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary/10">
          <Store className="h-7 w-7 text-primary/50" />
        </div>
      )}
      {store.star_rating && (
        <span className="absolute bottom-2 left-2 bg-white rounded-full px-2 py-0.5 text-[11px] font-bold text-amber-600 flex items-center gap-1">
          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
          {store.star_rating}
        </span>
      )}
    </div>
    <div className="p-3">
      <p className="text-sm font-semibold truncate">{store.name}</p>
      <p className="text-xs text-muted-foreground truncate">{store.category || 'Comercio local'}</p>
    </div>
  </Link>
);

const ROLES = [
  {
    icon: User,
    title: 'Clientes',
    description: 'Pide de tus negocios favoritos.',
    link: '/cliente/registro',
  },
  {
    icon: Store,
    title: 'Negocios',
    description: 'Vende y crece en tu región.',
    link: '/servicios/registro',
  },
  {
    icon: Truck,
    title: 'Domiciliarios',
    description: 'Entrega y genera ingresos.',
    link: '/domiciliario/registro',
  },
];

const RoleCard = ({ icon: Icon, title, description, link }) => (
  <Link
    to={link}
    className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
  >
    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
    <span className="text-xs font-semibold text-primary flex items-center gap-1 mt-auto">
      Comenzar <ArrowRight className="h-3 w-3" />
    </span>
  </Link>
);

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [nearbyStores, setNearbyStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0];

  useEffect(() => {
    const loadNearby = async () => {
      setLoadingStores(true);
      const { data } = await customerService.getStores({ page: 1, limit: 8 });
      setNearbyStores(data || []);
      setLoadingStores(false);
    };
    loadNearby();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/productos${searchTerm.trim() ? `?buscar=${encodeURIComponent(searchTerm.trim())}` : ''}`);
  };

  return (
    <>
      <Helmet>
        <title>AmiOriente - Tu Conexión con el Oriente Antioqueño</title>
        <meta name="description" content="Restaurantes, mercados, farmacias, turismo y comercio local del Oriente Antioqueño, todo en un solo lugar." />
      </Helmet>

      <div className="bg-background min-h-screen">
        {/* Encabezado — la foto de Marinilla identifica la región, con un
            degradado del verde de marca encima para que el texto blanco
            tenga contraste suficiente (AA) sobre cualquier parte de la foto. */}
        <div
          className="relative bg-cover bg-center"
          style={{ backgroundImage: "url('https://horizons-cdn.hostinger.com/9a2f1d5f-26c5-4fa8-b3e7-17e2b7bc86a9/eaa5c3ede657a14fb3f5ca74349a2d50.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/75 via-primary/70 to-primary/95" />
          <div className="relative max-w-5xl mx-auto px-5 pt-6 pb-7 sm:px-6">
            <div className="flex items-center gap-1.5 text-primary-foreground/90 text-sm font-medium mb-3">
              <MapPin className="h-4 w-4" />
              Marinilla, Antioquia
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-1 [text-shadow:0_1px_3px_rgba(0,0,0,0.25)]">
              {firstName ? `Hola, ${firstName}` : 'Hola'}
            </h1>
            <p className="text-primary-foreground/90 text-sm mb-5 [text-shadow:0_1px_2px_rgba(0,0,0,0.2)]">¿Qué necesitas hoy en tu región?</p>

            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Busca restaurantes, farmacias, tiendas..."
                className="w-full rounded-xl bg-white pl-11 pr-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
              />
            </form>
          </div>
        </div>

        <main className="max-w-5xl mx-auto px-5 sm:px-6 py-8 space-y-10">
          {/* Categorías */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-4">Categorías</h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
              {SERVICE_CATEGORIES_LIST.map((name) => (
                <CategoryTile key={name} name={name} />
              ))}
            </div>
          </section>

          {/* Negocios cerca de ti */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">Cerca de ti</h2>
              <Link to="/servicios" className="text-xs font-semibold text-primary">Ver todo</Link>
            </div>
            {loadingStores ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando negocios...
              </div>
            ) : nearbyStores.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-xl">
                Todavía no hay negocios registrados en tu zona.
              </p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {nearbyStores.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            )}
          </section>

          {/* Únete a AmiOriente */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-4">Únete a AmiOriente</h2>
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map((role) => (
                <RoleCard key={role.title} {...role} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default HomePage;
