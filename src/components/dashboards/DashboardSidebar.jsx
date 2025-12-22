
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Home, X, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';

export const DashboardSidebar = ({ title, navItems, isOpen, toggleSidebar }) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    // Context handles redirection to '/'
  };

  const NavLink = ({ item }) => {
    const fullPath = `/tienda/dashboard/${item.path}`;
    // Precise active state checking
    const isActive = item.path === ''
      ? location.pathname === '/tienda/dashboard' || location.pathname === '/tienda/dashboard/'
      : location.pathname.startsWith(fullPath);

    return (
      <Link
        to={fullPath}
        onClick={() => toggleSidebar(false)}
        id={`nav-${item.path || 'home'}`}
        className={cn(
          "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 mb-1",
          isActive
            ? "bg-green-600 text-white shadow-md shadow-green-200"
            : "text-slate-600 hover:bg-green-50 hover:text-green-700"
        )}
      >
        <item.icon className={cn("h-5 w-5 mr-3 flex-shrink-0 transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-green-600")} />
        <span className="truncate flex-1">{item.label}</span>
        {isActive && <ChevronRight className="h-4 w-4 text-white/80" />}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay - Only visible when open on mobile */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => toggleSidebar(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 shadow-xl lg:shadow-none",
          "transform transition-transform duration-300 ease-in-out",
          // Mobile: slide in/out. Desktop: always visible (translate-0)
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 border-b border-slate-100 px-4 shrink-0 bg-white">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-bold shrink-0">
                {title?.charAt(0) || 'A'}
              </div>
              <span className="font-bold text-lg text-slate-800 truncate" title={title}>{title || 'AmiOriente'}</span>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden text-slate-400" onClick={() => toggleSidebar(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Nav Items */}
          <div className="p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pl-3">
              Gestión
            </div>
            <nav id="dashboard-sidebar-menu" className="space-y-1">
              {navItems.map(item => <NavLink key={item.label} item={item} />)}
            </nav>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50 shrink-0">
            <Link to="/">
              <Button variant="outline" className="w-full justify-start border-slate-200 text-slate-600 hover:text-green-700 hover:bg-white hover:border-green-200">
                <Home className="h-4 w-4 mr-3" />
                Ir al Inicio
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-3" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};
