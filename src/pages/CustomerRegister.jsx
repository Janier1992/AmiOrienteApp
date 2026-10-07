import React, { useState } from 'react';
    import { motion } from 'framer-motion';
    import { Link, useNavigate } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Users, ArrowLeft, User, Mail, Phone, Lock, MapPin } from 'lucide-react';
    import { toast } from '@/components/ui/use-toast';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { getPasswordError, PASSWORD_HINT } from '@/lib/passwordPolicy';
    import { buildAuthRedirectUrl, getHomeRouteForUser, isExistingUserResponse } from '@/lib/authRoutes';

    const CustomerRegister = () => {
      const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        password: ''
      });
      const [loading, setLoading] = useState(false);
      const navigate = useNavigate();
      const { signUp } = useAuth();
      
            const handleInputChange = (e) => {
        setFormData({
          ...formData,
          [e.target.name]: e.target.value
        });
      };

      const handleRegister = async (e) => {
        e.preventDefault();
        
        const requiredFields = ['name', 'email', 'phone', 'address', 'password'];
        if (requiredFields.some(field => !formData[field])) {
          toast({
            title: "Error de validación",
            description: "Por favor completa todos los campos.",
            variant: "destructive"
          });
          return;
        }

        const passwordError = getPasswordError(formData.password);
        if (passwordError) {
          toast({
            title: "Contraseña insegura",
            description: passwordError,
            variant: "destructive"
          });
          return;
        }
        
        setLoading(true);
        const { user: newUser, session, error } = await signUp(formData.email, formData.password, {
          data: {
            full_name: formData.name,
            phone: formData.phone,
            address: formData.address,
            role: 'cliente'
          },
          emailRedirectTo: buildAuthRedirectUrl('/auth/confirm')
        });
        setLoading(false);

        if (error) return; // signUp ya mostró el error

        if (isExistingUserResponse(newUser)) {
          toast({
            title: "Correo ya registrado",
            description: "Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.",
            variant: "destructive"
          });
          return;
        }

        if (session) {
          // La confirmación por correo está desactivada: el usuario ya tiene sesión.
          toast({ title: "¡Cuenta creada!", description: "Bienvenido a AmiOriente." });
          navigate(getHomeRouteForUser(newUser));
          return;
        }

        toast({
          title: "¡Revisa tu correo!",
          description: "Te hemos enviado un enlace para confirmar tu cuenta.",
        });
        navigate('/auth/confirm');
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
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Crea tu Cuenta</CardTitle>
                <CardDescription>Regístrate para empezar a comprar.</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="text" name="name" placeholder="Nombre Completo" value={formData.name} onChange={handleInputChange} required className="pl-10" />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="email" name="email" placeholder="Correo Electrónico" value={formData.email} onChange={handleInputChange} required className="pl-10" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="tel" name="phone" placeholder="Teléfono" value={formData.phone} onChange={handleInputChange} required className="pl-10" />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="text" name="address" placeholder="Dirección de Entrega" value={formData.address} onChange={handleInputChange} required className="pl-10" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="password" name="password" placeholder="Contraseña segura" value={formData.password} onChange={handleInputChange} required className="pl-10" />
                  </div>

                  <p className="text-xs text-muted-foreground -mt-2">{PASSWORD_HINT}</p>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>
                </form>
                
                <div className="mt-6 text-center text-sm">
                  <p className="text-muted-foreground">
                    ¿Ya tienes una cuenta?{' '}
                    <Link to="/cliente/login" className="font-semibold text-primary hover:text-primary/80">
                      Inicia sesión aquí
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    };

    export default CustomerRegister;