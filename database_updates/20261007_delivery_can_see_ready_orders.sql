-- Migration: Delivery personnel can see orders marked "Listo para recogida"
-- Date: 2026-10-07
--
-- Confirmed via pg_policies: "Allow delivery personnel to see available
-- orders" only allows status IN ('Pendiente', 'Pendiente de pago en
-- efectivo'). But that's not the status a store actually sets when an
-- order is ready for pickup (OrdersManagementTab moves it through
-- Confirmado -> En preparación -> Listo para recogida). A domiciliario
-- could never see the one state that matters for them, even with the
-- column-mismatch fixes in deliveryService.obtenerPedidosDisponibles.

DROP POLICY IF EXISTS "Allow delivery personnel to see available orders" ON public.orders;

CREATE POLICY "Allow delivery personnel to see available orders"
    ON public.orders FOR SELECT
    USING (
        status IN ('Pendiente', 'Pendiente de pago en efectivo', 'Listo para recogida')
        AND (SELECT profiles.role FROM public.profiles WHERE profiles.id = auth.uid()) = 'domiciliario'
    );
