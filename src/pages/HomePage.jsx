
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Truck, Store, Utensils, Hotel, Leaf } from 'lucide-react';
import { Helmet } from 'react-helmet';

const FeatureCard = ({ icon, title, description }) => (
  <div className="text-center p-6 bg-white/95 dark:bg-slate-900/95 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 transform hover:-translate-y-1">
    <div className="mx-auto bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const RoleCard = ({ icon, title, description, link, buttonText }) => (
  <Card className="text-center shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col bg-white/95 dark:bg-slate-900/95 border-none">
    <CardHeader>
      <div className="mx-auto bg-primary/10 rounded-full h-20 w-20 flex items-center justify-center">
        {icon}
      </div>
      <CardTitle className="mt-4 text-2xl text-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex-grow flex flex-col justify-between">
      <CardDescription className="mb-6 text-base text-muted-foreground">{description}</CardDescription>
      <Link to={link}>
        <Button className="w-full text-lg py-6">{buttonText}</Button>
      </Link>
    </CardContent>
  </Card>
);

const HomePage = () => {
  return (
    <>
      <Helmet>
        <title>MiOriente - Tu Conexión con el Oriente Antioqueño</title>
        <meta name="description" content="La plataforma integral de servicios, domicilios, comercio y turismo en el Oriente Antioqueño. Conectamos la región en una experiencia única." />
      </Helmet>
      <main className="relative z-10 w-full">
        {/* Hero Section */}
        <div className="relative pt-12 pb-16 md:pt-24 md:pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Added a darker backdrop to hero content specifically to make text pop against sunset */}
            <div className="relative bg-black/40 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl border border-white/10 text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-7xl drop-shadow-lg"
              >
                <span className="block text-white mb-2">Conectando el</span>
                <span className="block text-primary-foreground bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-emerald-200">
                  Oriente Antioqueño
                </span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-6 max-w-lg mx-auto text-xl md:text-2xl text-white/90 sm:max-w-3xl drop-shadow-md font-medium"
              >
                Tu plataforma integral para domicilios, comercio, turismo y todos los servicios que nuestra hermosa región tiene para ofrecer.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center gap-4"
              >
                <Link to="/productos">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 shadow-xl bg-primary hover:bg-primary/90">
                    Explorar Productos
                  </Button>
                </Link>
                <Link to="/servicios/registro">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 bg-white/20 text-white border-white hover:bg-white/30 backdrop-blur-md shadow-xl">
                    Registra tu Servicio
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        <section id="features" className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            {/* Semi-transparent container for features section */}
            <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md rounded-3xl p-8 shadow-xl">
              <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4 drop-shadow-sm">
                Todo lo que necesitas
              </h2>
              <p className="text-center text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">
                Descubre la variedad de servicios disponibles en nuestra plataforma
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <FeatureCard icon={<Store className="h-10 w-10 text-primary" />} title="Comercio Local" description="Apoya a los negocios y artesanos de Marinilla, Rionegro y alrededores." />
                <FeatureCard icon={<Utensils className="h-10 w-10 text-primary" />} title="Gastronomía" description="Descubre los sabores únicos del Oriente en nuestros mejores restaurantes." />
                <FeatureCard icon={<Hotel className="h-10 w-10 text-primary" />} title="Turismo y Hoteles" description="Encuentra el lugar perfecto para tu próxima escapada de fin de semana." />
                <FeatureCard icon={<Leaf className="h-10 w-10 text-primary" />} title="Del Campo a tu Mesa" description="Compra productos frescos directamente de nuestros campesinos locales." />
              </div>
            </div>
          </div>
        </section>

        <section id="roles" className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            {/* Text has drop-shadow to be readable against sunset if bg-black/30 is applied in App.jsx */}
            <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              Únete a Nuestra Comunidad
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <RoleCard 
                icon={<Store className="h-10 w-10 text-primary" />}
                title="Para Negocios"
                description="Registra tu tienda, restaurante, hotel o servicio turístico y llega a más clientes en todo el Oriente."
                link="/servicios/registro"
                buttonText="Comenzar ahora"
              />
              <RoleCard 
                icon={<User className="h-10 w-10 text-primary" />}
                title="Para Clientes"
                description="Encuentra todo lo que buscas, desde productos locales hasta experiencias únicas, sin salir de casa."
                link="/cliente/registro"
                buttonText="Registrarse"
              />
              <RoleCard 
                icon={<Truck className="h-10 w-10 text-primary" />}
                title="Para Domiciliarios"
                description="Únete a nuestra red de entregas y genera ingresos adicionales con horarios flexibles."
                link="/domiciliario/registro"
                buttonText="Aplicar ahora"
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default HomePage;
