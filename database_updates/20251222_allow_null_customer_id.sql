-- Migration: Allow NULL values for customer_id in orders table
-- Description: Supports anonymous POS sales where no registered customer is associated.

DO $$
BEGIN
    -- Check if the column exists and is not null before altering to avoid errors if re-run
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.orders ALTER COLUMN customer_id DROP NOT NULL;
    END IF;
END $$;
