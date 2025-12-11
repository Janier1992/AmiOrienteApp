import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const OrderConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, stores(name)')
          .eq('id', orderId)
          .single();
        
        if (error) throw error;
        setOrder(data);
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return (
    <>
      <Helmet>
        <title>Pedido Confirmado - Domicilios MiOriente</title>
      </Helmet>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-lg text-center shadow-xl bg-card text-card-foreground border-border">
            <CardHeader>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
              >
                <CheckCircle className="mx-auto h-20 w-20 text-primary" />
              </motion.div>
              <CardTitle className="text-3xl font-bold mt-4">¡Pedido Realizado con Éxito!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground text-lg">
                Gracias por tu compra. Hemos recibido tu pedido y ya lo estamos procesando.
              </p>
              {loading ? (
                <p className="text-muted-foreground">Cargando detalles del pedido...</p>
              ) : order ? (
                <div className="text-left bg-muted p-4 rounded-lg border border-border">
                  <p className="text-foreground"><strong>Número de Pedido:</strong> #{order.id.substring(0, 8)}</p>
                  <p className="text-foreground"><strong>Tienda:</strong> {order.stores.name}</p>
                  <p className="text-foreground"><strong>Total:</strong> ${Number(order.total).toLocaleString()}</p>
                  <p className="text-foreground"><strong>Estado:</strong> {order.status}</p>
                </div>
              ) : (
                 <p className="text-destructive">No se pudieron cargar los detalles del pedido.</p>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/cliente/dashboard">
                  <Button className="w-full sm:w-auto">
                    Ir a Mis Pedidos <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/productos">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <ShoppingBag className="mr-2 h-4 w-4" /> Seguir Comprando
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default OrderConfirmationPage;