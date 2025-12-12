import React, { useState } from 'react';
    import { motion } from 'framer-motion';
    import { Link, useNavigate } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';

    const ForgotPasswordPage = () => {
      const [email, setEmail] = useState('');
      const [loading, setLoading] = useState(false);
      const navigate = useNavigate();

      const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!email) {
          toast({
            title: "Correo requerido",
            description: "Por favor ingresa tu correo electrónico.",
            variant: "destructive",
          });
          return;
        }

        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/actualizar-contrasena`,
        });
        setLoading(false);

        if (error) {
          toast({
            title: "Error al enviar correo",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "¡Correo enviado!",
            description: "Revisa tu bandeja de entrada para encontrar el enlace y restablecer tu contraseña.",
          });
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
            <div className="text-center mb-8">
              <Link to="/cliente/login" className="inline-flex items-center text-primary hover:text-primary/80 transition-colors font-semibold">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a inicio de sesión
              </Link>
            </div>

            <Card className="w-full bg-card text-card-foreground border-border">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">¿Olvidaste tu Contraseña?</CardTitle>
                <CardDescription>No te preocupes. Ingresa tu correo y te enviaremos un enlace para recuperarla.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordReset} className="space-y-6">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      name="email"
                      placeholder="Tu correo electrónico"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    };

    export default ForgotPasswordPage;