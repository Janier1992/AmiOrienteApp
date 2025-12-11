import React from 'react';
    import { NavLink, useLocation } from 'react-router-dom';
    import { Home, ShoppingBag, Store, Map, MoreHorizontal } from 'lucide-react';
    import { useAuth } from '@/contexts/SupabaseAuthContext';

    const NavItem = ({ to, icon: Icon, label }) => {
      const location = useLocation();
      const isActive = location.pathname === to;

      return (
        <NavLink to={to} className="flex flex-col items-center justify-center flex-1 text-center transition-colors duration-200">
          <Icon className={`h-6 w-6 mb-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>{label}</span>
        </NavLink>
      );
    };

    const BottomNavBar = () => {
      const { user } = useAuth();
      const isStoreUser = user?.user_metadata?.role === 'tienda';

      return (
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg md:hidden z-30">
          <div className="flex justify-around items-center h-16">
            <NavItem to="/" icon={Home} label="Inicio" />
            <NavItem to="/productos" icon={ShoppingBag} label="Productos" />
            <NavItem to="/servicios" icon={Store} label="Servicios" />
            <NavItem to="/turismo" icon={Map} label="Turismo" />
            {isStoreUser && <NavItem to="/mas" icon={MoreHorizontal} label="Más" />}
          </div>
        </nav>
      );
    };

    export default BottomNavBar;