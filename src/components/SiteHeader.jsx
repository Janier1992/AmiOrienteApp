import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, User, Store } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import ThemeSwitcher from './ThemeSwitcher';
import MobileNav from './MobileNav';
import CartSidebar from './CartSidebar';

const SiteHeader = () => {
  const { user } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return '/cliente/login';
    switch (user.user_metadata?.role) {
      case 'tienda':
        return '/tienda/dashboard';
      case 'cliente':
        return '/cliente/dashboard';
      case 'domiciliario':
        return '/domiciliario/dashboard';
      default:
        return '/cliente/login';
    }
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">AmiOriente</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <NavLink to="/productos" className={navLinkClass}>
              Productos
            </NavLink>
            <NavLink to="/servicios" className={navLinkClass}>
              Servicios
            </NavLink>
            <NavLink to="/turismo" className={navLinkClass}>
              Turismo
            </NavLink>
            {user?.user_metadata?.role === 'tienda' && (
              <NavLink to="/mas" className={navLinkClass}>
                Más Servicios
              </NavLink>
            )}
          </nav>
        </div>

        <div className="md:hidden">
          <MobileNav />
        </div>

        <div className="flex flex-1 items-center justify-end space-x-1 md:space-x-2">
          <ThemeSwitcher />

          <div className="hidden md:flex items-center space-x-2">
            <Link to={getDashboardLink()}>
              <Button variant="ghost" size="sm">
                <User className="mr-2 h-4 w-4" />
                {user ? 'Mi Cuenta' : 'Ingresar'}
              </Button>
            </Link>
            <Link to="/servicios/registro">
              <Button size="sm">
                <Store className="mr-2 h-4 w-4" />
                Para Negocios
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
};

export default SiteHeader;