import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const FaqItem = ({ question, answer }) => (
  <div className="border-l-4 border-primary pl-4">
    <h4 className="font-semibold text-foreground mb-1">{question}</h4>
    <p className="text-sm text-muted-foreground">{answer}</p>
  </div>
);

const HelpCenter = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">Centro de Ayuda</h1>
          <p className="text-xl text-muted-foreground">Encuentra respuestas a tus preguntas.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-card text-card-foreground border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="mr-2 h-5 w-5 text-primary" />
                  Preguntas Frecuentes
                </CardTitle>
                <p className="text-sm text-muted-foreground">Respuestas rápidas a las dudas más comunes.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <FaqItem
                  question="¿Cómo hago un pedido?"
                  answer="Simplemente navega por nuestra sección de 'Productos', añade los que te gusten al carrito y sigue los pasos para finalizar la compra. ¡Es muy fácil!"
                />
                <FaqItem
                  question="¿Cómo puedo rastrear mi pedido?"
                  answer="Una vez que inicies sesión, ve a 'Mi Cuenta' > 'Mis Pedidos'. Allí encontrarás el estado actual y un enlace para ver el seguimiento en tiempo real."
                />
                <FaqItem
                  question="¿Qué métodos de pago aceptan?"
                  answer="Aceptamos todas las tarjetas de crédito y débito principales. También ofrecemos la opción de pago en efectivo al momento de la entrega para tu comodidad."
                />
                <FaqItem
                  question="¿Cómo puedo ser vendedor en la plataforma?"
                  answer="¡Nos encantaría tenerte! Haz clic en 'Para Tiendas' en la página de inicio y sigue el proceso de registro. Nuestro equipo revisará tu solicitud y se pondrá en contacto contigo."
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <Card className="bg-muted text-foreground border-border">
              <CardHeader>
                <CardTitle>¿Necesitas más ayuda?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Si no encontraste la respuesta que buscabas, nuestro equipo de soporte está listo para ayudarte.
                </p>
                <Link to="/contacto">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Contactar con Soporte
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;