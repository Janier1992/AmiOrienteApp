
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  User, 
  ShoppingBag, 
  Heart, 
  MapPin, 
  CreditCard, 
  Bell, 
  Star, 
  Ticket,
  LogOut,
  Home,
  X
} from 'lucide-react';

const Sidebar = ({ profile, activeTab, onTabChange, onLogout, onHome, isOpen, onClose }) => {
  const menuItems = [
    { id: 'pedidos', label: 'Mis Pedidos', icon: ShoppingBag },
    { id: 'perfil', label: 'Mi Perfil', icon: User },
    { id: 'deseos', label: 'Lista de Deseos', icon: Heart },
    { id: 'direcciones', label: 'Mis Direcciones', icon: MapPin },
    { id: 'pagos', label: 'Métodos de Pago', icon: CreditCard },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'resenas', label: 'Reseñas', icon: Star },
    { id: 'cupones', label: 'Cupones', icon: Ticket },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside 
        className={`
          fixed md:relative top-0 left-0 z-50 h-full w-64 bg-card text-card-foreground border-r border-border shrink-0
          transform transition-transform duration-300 ease-in-out md:transform-none shadow-lg md:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 md:hidden" 
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="flex flex-col items-center text-center mt-2 md:mt-0">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <User className="h-10 w-10" />
              </div>
              <h2 className="text-lg font-bold truncate w-full px-2">{profile?.full_name || 'Usuario'}</h2>
              <p className="text-xs text-muted-foreground truncate w-full px-2">{profile?.email}</p>
            </div>
          </div>

          {/* Nav Items */}
          <div className="p-4 space-y-1 overflow-y-auto flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full justify-start ${isActive ? 'bg-primary/10 text-primary' : ''}`}
                  onClick={() => {
                    onTabChange(item.id);
                    onClose();
                  }}
                >
                  <Icon className="mr-2 h-4 w-4 shrink-0" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border space-y-2 bg-muted/20">
            <Button variant="outline" className="w-full justify-start" onClick={onHome}>
              <Home className="mr-2 h-4 w-4 shrink-0" /> Volver al inicio
            </Button>
            <Button variant="destructive" className="w-full justify-start" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4 shrink-0" /> Salir
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
