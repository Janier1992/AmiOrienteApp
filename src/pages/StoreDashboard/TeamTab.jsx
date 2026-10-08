import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, UserPlus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { teamService, TEAM_ROLES } from '@/services/teamService';
import { planService } from '@/services/planService';
import { describeTeamLimit } from '@/config/plans';

const RoleSelect = ({ value, onChange, disabled, id }) => (
  <select
    id={id}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className="h-9 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-60"
  >
    {Object.entries(TEAM_ROLES).map(([key, label]) => (
      <option key={key} value={key}>{label}</option>
    ))}
  </select>
);

const TeamTab = ({ storeId, store }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [adding, setAdding] = useState(false);

  // El dueño y los administradores del equipo gestionan; los colaboradores solo ven.
  const canManage = !store?.viewerRole || store.viewerRole === 'owner' || store.viewerRole === 'admin';

  const load = useCallback(async () => {
    try {
      const [team, planInfo] = await Promise.all([
        teamService.obtenerEquipo(storeId),
        planService.obtenerPlanDelNegocio(storeId).catch(() => null),
      ]);
      setMembers(team);
      setPlan(planInfo);
    } catch (error) {
      toast({ title: 'No se pudo cargar el equipo', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const run = async (id, action, okMessage) => {
    setBusyId(id);
    try {
      await action();
      toast({ title: okMessage });
      await load();
    } catch (error) {
      toast({ title: 'No se pudo completar', description: error.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await teamService.agregarMiembro(storeId, email, role);
      toast({ title: 'Persona agregada al equipo', description: 'Ya puede entrar a este negocio con su cuenta.' });
      setEmail('');
      await load();
    } catch (error) {
      toast({ title: 'No se pudo agregar', description: error.message, variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const limitReached = plan && plan.max_team_members != null && Number(plan.team_count) >= plan.max_team_members;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Equipo de trabajo</CardTitle>
          <CardDescription>
            Personas que pueden gestionar pedidos, productos y ventas de {store?.name || 'tu negocio'}.
            {plan && (
              <> Tu plan {plan.plan_name}: {describeTeamLimit({ max_team_members: plan.max_team_members }).toLowerCase()}
              {' '}({plan.team_count} en uso).</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((m) => {
            const isMe = m.user_id === user?.id;
            const busy = busyId === m.user_id;
            return (
              <div key={m.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {m.full_name || m.email || 'Sin nombre'}
                    {isMe && <span className="text-muted-foreground font-normal"> (tú)</span>}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {m.is_owner ? (
                    <Badge>Dueño</Badge>
                  ) : canManage ? (
                    <>
                      <RoleSelect
                        id={`rol-${m.user_id}`}
                        value={m.role}
                        disabled={busy}
                        onChange={(r) => run(m.user_id, () => teamService.cambiarRol(storeId, m.user_id, r), 'Rol actualizado')}
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={busy}
                        aria-label={`Quitar a ${m.full_name || m.email} del equipo`}
                        onClick={() => {
                          if (window.confirm(`¿Quitar a ${m.full_name || m.email} del equipo? Perderá el acceso al negocio.`)) {
                            run(m.user_id, () => teamService.quitarMiembro(storeId, m.user_id), 'Persona quitada del equipo');
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Badge variant="secondary">{TEAM_ROLES[m.role] || m.role}</Badge>
                  )}
                  {!m.is_owner && isMe && !canManage && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm('¿Salir de este equipo? Perderás el acceso al negocio.')) {
                          run(m.user_id, () => teamService.quitarMiembro(storeId, m.user_id), 'Saliste del equipo');
                        }
                      }}
                    >
                      Salir del equipo
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Agregar persona</CardTitle>
            <CardDescription>
              Debe tener una cuenta en AmiOriente (cliente). Escribe el correo con el que se registró. Para trabajar en el
              negocio entra con esa cuenta y abre «Ir a mi negocio» en su panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {limitReached ? (
              <p className="text-sm text-muted-foreground">
                Llegaste al límite de tu plan ({plan.max_team_members} personas). Mejora tu plan en «Mi Plan» para agregar más.
              </p>
            ) : (
              <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="team-email">Correo</Label>
                  <Input
                    id="team-email"
                    type="email"
                    required
                    placeholder="colaborador@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="team-role">Rol</Label>
                  <div><RoleSelect id="team-role" value={role} onChange={setRole} /></div>
                </div>
                <Button type="submit" disabled={adding || !email}>
                  {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Agregar
                </Button>
              </form>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              <strong>Administrador:</strong> opera el negocio y gestiona el equipo. <strong>Colaborador:</strong> gestiona pedidos y
              productos, sin tocar el equipo. Solo el dueño administra pagos, plan y configuración.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamTab;
