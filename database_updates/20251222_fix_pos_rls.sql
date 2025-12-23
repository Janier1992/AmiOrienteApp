-- Migration: Allow store owners to create POS orders
-- Date: 2025-12-22
-- Reason: Fix RLS error in POS view where 'orders' insertion failed because the user (Store Owner) was not the 'customer'.

CREATE POLICY "Store owners can create POS orders" ON "orders"
FOR INSERT
WITH CHECK (
  auth.uid() = (
    SELECT owner_id 
    FROM stores 
    WHERE id = store_id
  )
);
