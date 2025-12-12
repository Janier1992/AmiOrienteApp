import React, { useState } from 'react';
    import { motion } from 'framer-motion';
    import { Link, useNavigate } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Truck, ArrowLeft, Mail, Lock } from 'lucide-react';
    import { useAuth } from '@/contexts/SupabaseAuthContext';

    const DeliveryLogin = () => {
      const [formData, setFormData] = useState({ email: '', password: '' });
      const [loading, setLoading] = useState(false);
      const navigate = useNavigate();
      const { signIn } = useAuth();

      const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
      };

      const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await signIn(formData.email, formData.password);
        setLoading(false);
        if (!error) {
          navigate('/domiciliario/dashboard');
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
              <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 transition-colors font-semibold">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Link>
            </div>

            <Card className="w-full bg-card text-card-foreground border-border">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Acceso Domiciliario</CardTitle>
                <CardDescription>Inicia sesión para gestionar tus entregas.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="email" name="email" placeholder="Correo Electrónico" value={formData.email} onChange={handleInputChange} required className="pl-10" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="password" name="password" placeholder="Contraseña" value={formData.password} onChange={handleInputChange} required className="pl-10" />
                  </div>
                  <div className="text-right text-sm">
                    <Link to="/recuperar-contrasena" className="font-semibold text-primary hover:text-primary/80">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                  </Button>
                </form>
                <div className="mt-6 text-center text-sm">
                  <p className="text-muted-foreground">
                    ¿Quieres ser domiciliario?{' '}
                    <Link to="/domiciliario/registro" className="font-semibold text-primary hover:text-primary/80">
                      Regístrate aquí
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    };

    export default DeliveryLogin;