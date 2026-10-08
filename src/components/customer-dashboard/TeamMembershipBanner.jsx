import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { teamService, TEAM_ROLES } from '@/services/teamService';

/**
 * Si la persona fue agregada al equipo de uno o más negocios, le muestra el
 * acceso a su panel (las cuentas de cliente no tienen otra puerta de entrada).
 */
const TeamMembershipBanner = ({ userId }) => {
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState([]);

  useEffect(() => {
    let active = true;
    teamService.obtenerMembresias(userId).then((list) => active && setMemberships(list));
    return () => { active = false; };
  }, [userId]);

  if (memberships.length === 0) return null;

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
      {memberships.map((m) => (
        <div key={m.stores.id} className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Store className="h-4 w-4 text-primary" />
            Eres {TEAM_ROLES[m.role]?.toLowerCase() || 'parte del equipo'} de <strong>{m.stores.name}</strong>
          </div>
          <Button size="sm" onClick={() => navigate('/tienda/dashboard')}>Ir a mi negocio</Button>
        </div>
      ))}
    </div>
  );
};

export default TeamMembershipBanner;
