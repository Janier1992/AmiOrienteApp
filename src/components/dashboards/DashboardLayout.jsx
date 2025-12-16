
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { DashboardSidebar } from './DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const DashboardLayout = ({ title, navItems, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Helmet>
        <title>{title || 'Dashboard'} | AmiOriente</title>
      </Helmet>

      {/* Mobile Toggle Button - Fixed and Z-indexed to be above everything */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-[60] lg:hidden shadow-md bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Abrir menú</span>
      </Button>

      {/* Sidebar Component */}
      <DashboardSidebar
        title={title}
        navItems={navItems}
        isOpen={isSidebarOpen}
        toggleSidebar={setIsSidebarOpen}
      />

      {/* Main Content Area - Proper margin for desktop sidebar */}
      <main className="flex-1 min-w-0 transition-all duration-300 ease-in-out lg:ml-64 w-full">
        <div className="h-full p-4 sm:p-6 lg:p-8 mt-14 lg:mt-0 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
};
