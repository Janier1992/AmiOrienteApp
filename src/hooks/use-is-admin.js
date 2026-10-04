
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { adminService } from '@/services/adminService';

/**
 * Whether the current signed-in user has profiles.role = 'admin'.
 * Shared by every place that needs to conditionally show admin UI
 * (nav links, floating button, etc) so the check lives in one place.
 */
export function useIsAdmin() {
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        let active = true;

        if (user) {
            adminService.esAdmin(user.id).then(result => {
                if (active) setIsAdmin(result);
            });
        } else {
            setIsAdmin(false);
        }

        return () => { active = false; };
    }, [user]);

    return isAdmin;
}
