
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { adminService } from '@/services/adminService';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

/**
 * Protects a route so only users with profiles.role = 'admin' can enter.
 * Checked against the `profiles` table directly (not the auth JWT's
 * user_metadata.role), since 'admin' is granted manually after signup
 * and the JWT metadata would never reflect that change.
 */
export const AdminRoute = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const [checking, setChecking] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        let active = true;

        const check = async () => {
            if (!user) {
                if (active) {
                    setIsAdmin(false);
                    setChecking(false);
                }
                return;
            }
            const result = await adminService.esAdmin(user.id);
            if (active) {
                setIsAdmin(result);
                setChecking(false);
            }
        };

        if (!authLoading) check();

        return () => { active = false; };
    }, [user, authLoading]);

    if (authLoading || checking) return <LoadingSpinner />;
    if (!user || !isAdmin) return <Navigate to="/" replace />;

    return children;
};

export default AdminRoute;
