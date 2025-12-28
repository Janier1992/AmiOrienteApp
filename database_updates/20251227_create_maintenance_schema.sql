-- Create store_equipment table
CREATE TABLE IF NOT EXISTS public.store_equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    serial_number TEXT,
    purchase_date DATE,
    status TEXT NOT NULL CHECK (status IN ('operational', 'maintenance_needed', 'in_repair', 'retired')) DEFAULT 'operational',
    next_maintenance_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create maintenance_logs table
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_id UUID NOT NULL REFERENCES public.store_equipment(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('preventive', 'corrective')),
    description TEXT NOT NULL,
    cost NUMERIC DEFAULT 0,
    performed_by TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.store_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Policies for store_equipment
CREATE POLICY "Store owners can view their equipment"
    ON public.store_equipment FOR SELECT
    USING (store_id IN (
        SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Store owners can insert equipment"
    ON public.store_equipment FOR INSERT
    WITH CHECK (store_id IN (
        SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Store owners can update their equipment"
    ON public.store_equipment FOR UPDATE
    USING (store_id IN (
        SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Store owners can delete their equipment"
    ON public.store_equipment FOR DELETE
    USING (store_id IN (
        SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
    ));

-- Policies for maintenance_logs
CREATE POLICY "Store owners can view logs for their equipment"
    ON public.maintenance_logs FOR SELECT
    USING (equipment_id IN (
        SELECT id FROM public.store_equipment WHERE store_id IN (
            SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Store owners can insert logs"
    ON public.maintenance_logs FOR INSERT
    WITH CHECK (equipment_id IN (
        SELECT id FROM public.store_equipment WHERE store_id IN (
            SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
        )
    ));

-- Add deleted_at to store_equipment for soft deletes if needed later, but simplified for now per plan.
