
import React from 'react';
import { Helmet } from 'react-helmet';

 // Imports shifted to Sheet component mostly





// Redefining Sidebar Internal Content here or importing it?
// To avoid circular deps or complex prop drilling, let's keep the Navigation Logic localized or passed pure.
// Actually, `DashboardSidebar` in previous step handled BOTH desktop and mobile trigger. 
// So DashboardLayout just needs to provide the Main Content area and let Sidebar handle itself.

import { DashboardSidebar } from './DashboardSidebar';
import { useForcedLightTheme } from '@/hooks/use-forced-light-theme';

export const DashboardLayout = ({ title, navItems, children }) => {
  useForcedLightTheme();
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Helmet>
        <title>{title || 'Dashboard'} | AmiOriente</title>
      </Helmet>

      {/* Sidebar (Handles its own Mobile Trigger/Drawer) */}
      <DashboardSidebar title={title} navItems={navItems} />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 transition-all duration-300 ease-in-out lg:ml-72 w-full">
        <div className="h-full p-4 sm:p-6 lg:p-8 mt-14 lg:mt-0 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
};
