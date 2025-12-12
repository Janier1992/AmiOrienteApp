import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Mail, MessageSquare, Phone } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const requiredFields = ['name', 'email', 'subject', 'message'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-contact-form', {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: "Mensaje enviado",
        description: "Hemos recibido tu consulta. Te contactaremos pronto."
      });
      
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast({
        title: "Error al enviar",
        description: "No se pudo enviar tu mensaje. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contacto - Domicilios MiOriente</title>
        <meta name="description" content="Contacta con el equipo de soporte de Domicilios MiOriente. Estamos para ayudarte." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
              Ponte en Contacto
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ¿Tienes alguna pregunta o sugerencia? ¡Nos encantaría escucharte!
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-card text-card-foreground border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <MessageSquare className="mr-3 h-5 w-5 text-primary" />
                    Envíanos un mensaje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="text" name="name" placeholder="Tu nombre completo" value={formData.name} onChange={handleInputChange} className="pl-10" required />
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" name="email" placeholder="tu@email.com" value={formData.email} onChange={handleInputChange} className="pl-10" required />
                    </div>

                    <Input type="text" name="subject" placeholder="Asunto (Ej: Problema con un pedido)" value={formData.subject} onChange={handleInputChange} required />
                    
                    <Textarea name="message" placeholder="Describe tu consulta aquí..." value={formData.message} onChange={handleInputChange} rows={5} required />

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Enviando...' : 'Enviar Mensaje'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-6"
            >
              <Card className="bg-card text-card-foreground border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Información de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Desarrollador</p>
                      <p className="text-muted-foreground">Janier Mosquera</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Teléfono</p>
                      <a href="tel:3005051518" className="text-muted-foreground hover:text-primary">3005051518</a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Correo electrónico</p>
                      <a href="mailto:jamosquera051@gmail.com" className="text-muted-foreground hover:text-primary">jamosquera051@gmail.com</a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;