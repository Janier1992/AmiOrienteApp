import React, { useState } from 'react';
    import { Link, useNavigate } from 'react-router-dom';
    import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
    import { Button } from '@/components/ui/button';
    import { Menu, Home, ShoppingBag, Store, Map, User, LogIn, MoreHorizontal } from 'lucide-react';
    import { useAuth } from '@/contexts/SupabaseAuthContext';

    const MobileNav = () => {
      const [isOpen, setIsOpen] = useState(false);
      const { user } = useAuth();
      const navigate = useNavigate();

      const closeSheetAndNavigate = (path) => {
        setIsOpen(false);
        navigate(path);
      };

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

      return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="px-2 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0 flex flex-col">
            <Link
              to="/"
              className="mb-8 flex items-center"
              onClick={() => closeSheetAndNavigate('/')}
            >
              <ShoppingBag className="mr-2 h-6 w-6 text-primary" />
              <span className="font-bold text-lg">MiOriente</span>
            </Link>
            <nav className="flex flex-col space-y-4">
               <button onClick={() => closeSheetAndNavigate('/')} className="flex items-center text-lg font-medium text-foreground/80 hover:text-primary"><Home className="mr-3 h-5 w-5" /> Inicio</button>
               <button onClick={() => closeSheetAndNavigate('/productos')} className="flex items-center text-lg font-medium text-foreground/80 hover:text-primary"><ShoppingBag className="mr-3 h-5 w-5" /> Productos</button>
               <button onClick={() => closeSheetAndNavigate('/servicios')} className="flex items-center text-lg font-medium text-foreground/80 hover:text-primary"><Store className="mr-3 h-5 w-5" /> Servicios</button>
               <button onClick={() => closeSheetAndNavigate('/turismo')} className="flex items-center text-lg font-medium text-foreground/80 hover:text-primary"><Map className="mr-3 h-5 w-5" /> Turismo</button>
              {user?.user_metadata?.role === 'tienda' && (
                 <button onClick={() => closeSheetAndNavigate('/mas')} className="flex items-center text-lg font-medium text-foreground/80 hover:text-primary"><MoreHorizontal className="mr-3 h-5 w-5" /> Más Servicios</button>
              )}
            </nav>
            <div className="mt-auto flex flex-col space-y-2 pb-4">
                 <Button onClick={() => closeSheetAndNavigate(getDashboardLink())} variant="outline" className="w-full">
                    <User className="mr-2 h-4 w-4" />
                    {user ? 'Mi Cuenta' : 'Ingresar'}
                </Button>
                <Button onClick={() => closeSheetAndNavigate('/servicios/registro')} className="w-full">
                    <Store className="mr-2 h-4 w-4" />
                    Para Negocios
                </Button>
            </div>
          </SheetContent>
        </Sheet>
      );
    };

    export default MobileNav;