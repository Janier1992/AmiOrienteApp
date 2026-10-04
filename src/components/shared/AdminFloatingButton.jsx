
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useIsAdmin } from '@/hooks/use-is-admin';

/**
 * Always-visible shortcut to /admin for platform admins, rendered at the
 * top level of the app (not inside SiteHeader) so it shows up on every
 * route, including the per-role dashboards which hide the main header
 * and have their own separate layout/sidebar.
 */
export const AdminFloatingButton = () => {
    const isAdmin = useIsAdmin();
    const location = useLocation();

    if (!isAdmin || location.pathname === '/admin') return null;

    return (
        <Link
            to="/admin"
            className="fixed bottom-24 md:bottom-6 right-4 z-[70] flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-3 shadow-lg hover:bg-slate-700 transition-colors"
        >
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-medium">Admin</span>
        </Link>
    );
};

export default AdminFloatingButton;
