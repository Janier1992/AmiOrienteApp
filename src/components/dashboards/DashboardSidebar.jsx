
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Home, SquareStack, ChevronRight, Menu } from 'lucide-react'; // Added Menu icon for trigger
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'; // Import Sheet

export const DashboardSidebar = ({ title, navItems }) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const NavContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-100 bg-white/50 shrink-0">
        <div className="h-9 w-9 bg-green-100 rounded-xl flex items-center justify-center text-green-700 font-bold shrink-0 shadow-sm">
          {title?.charAt(0) || 'A'}
        </div>
        <span className="font-bold text-lg text-slate-800 truncate tracking-tight">{title || 'AmiOriente'}</span>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
        <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          Gestión
        </div>
        {navItems.map(item => {
          const fullPath = `/tienda/dashboard/${item.path}`;
          const isActive = item.path === ''
            ? location.pathname === '/tienda/dashboard' || location.pathname === '/tienda/dashboard/'
            : location.pathname.startsWith(fullPath);

          return (
            <Link
              key={item.label}
              to={fullPath}
              onClick={() => mobile && setOpen(false)}
              className={cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden",
                isActive
                  ? "bg-green-600 text-white shadow-lg shadow-green-200/50"
                  : "text-slate-600 hover:bg-green-50 hover:text-green-700"
              )}
            >
              <item.icon className={cn("h-5 w-5 mr-3 flex-shrink-0 transition-colors duration-200", isActive ? "text-white" : "text-slate-400 group-hover:text-green-600")} />
              <span className="truncate flex-1 z-10 relative">{item.label}</span>
              {isActive && <ChevronRight className="h-4 w-4 text-white/80" />}
            </Link>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50">
        <Link to="/">
          <Button variant="outline" className="w-full justify-start border-slate-200 text-slate-600 hover:text-green-700 hover:bg-white hover:border-green-200 transition-all">
            <Home className="h-4 w-4 mr-3" />
            Ir al Inicio
          </Button>
        </Link>
        <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-3" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-72 lg:flex-col bg-white border-r border-slate-200 shadow-sm z-30">
        <NavContent />
      </aside>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="fixed top-4 left-4 z-40 lg:hidden bg-white shadow-md border-slate-200">
            <Menu className="h-5 w-5 text-slate-700" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80 border-r-0">
          <NavContent mobile={true} />
        </SheetContent>
      </Sheet>
    </>
  );
};
