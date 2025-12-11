import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import { useNavigate } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Lock, KeyRound } from 'lucide-react';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';

    const UpdatePasswordPage = () => {
      const [password, setPassword] = useState('');
      const [loading, setLoading] = useState(false);
      const navigate = useNavigate();
      const { session } = useAuth();
      
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      useEffect(() => {
        if (!session) {
          const hash = window.location.hash;
          if (!hash.includes('access_token')) {
              toast({
                title: "Enlace inválido",
                description: "El enlace de recuperación de contraseña es inválido o ha expirado.",
                variant: "destructive"
              });
              navigate('/recuperar-contrasena');
          }
        }
      }, [session, navigate]);

      const handleUpdatePassword = async (e) => {
        e.preventDefault();
        
        if (!passwordRegex.test(password)) {
          toast({
            title: "Contraseña insegura",
            description: "La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un caracter especial.",
            variant: "destructive"
          });
          return;
        }
        
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (error) {
          toast({
            title: "Error al actualizar",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "¡Contraseña actualizada!",
            description: "Tu contraseña ha sido cambiada con éxito. Por favor, inicia sesión.",
          });
          await supabase.auth.signOut();
          navigate('/cliente/login');
        }
      };

      return (
        <div className="min-h-screen auth-gradient flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <Card className="w-full bg-card text-card-foreground border-border">
              <CardHeader className="text-center pb-6">
                 <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Crea tu Nueva Contraseña</CardTitle>
                <CardDescription>Ingresa una nueva contraseña segura para tu cuenta.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="password"
                      name="password"
                      placeholder="Nueva Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    };

    export default UpdatePasswordPage;