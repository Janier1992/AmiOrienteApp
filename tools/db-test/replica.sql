-- =============================================================================
-- Réplica mínima del esquema REAL de Supabase (auditoría 2026-10-07)
-- Sirve para probar migraciones en un PostgreSQL local con los roles anon /
-- authenticated, SIN tocar el proyecto real. Solo incluye lo necesario para
-- las pruebas de seguridad (perfiles, tiendas, pedidos, entregas).
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb
);
-- Igual que Supabase: lee el usuario de los claims del JWT de la petición
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
$$ SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;
GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;

-- ------------------------------ tablas --------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text, phone text, role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  address text, email text UNIQUE
);
CREATE TABLE public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE,
  description text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL, description text, category text, address text, logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(), stripe_connect_id text,
  service_category_id uuid NOT NULL REFERENCES public.service_categories(id),
  cuisine_type text, star_rating integer, activity_type text, interest_type text,
  contact_email text, contact_phone text, whatsapp text, facebook_url text, instagram_url text,
  status text NOT NULL DEFAULT 'active', disabled_modules text[] NOT NULL DEFAULT '{}'
);
CREATE TABLE public.store_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'editor', created_at timestamptz DEFAULT now(),
  UNIQUE (store_id, user_id)
);
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  plan_id text NOT NULL, status text NOT NULL, stripe_customer_id text, stripe_subscription_id text,
  current_period_start timestamptz, current_period_end timestamptz,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL, description text, price numeric NOT NULL, category text, image_url text,
  stock integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), discount numeric DEFAULT 0
);
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Nuevo', total numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), delivery_address text, commission_fee numeric,
  subtotal numeric, service_fee numeric DEFAULT 0, delivery_fee numeric DEFAULT 0,
  delivery_lat numeric, delivery_lng numeric, payment_method text, notes text,
  discount_code text, discount_amount numeric DEFAULT 0, tax_amount numeric DEFAULT 0, shipping_rate_id uuid
);
CREATE TABLE public.deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  delivery_person_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'Buscando', pickup_address text, delivery_address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), pickup_coords real[], delivery_coords real[]
);

-- ----------------------- funciones (tal como están hoy) ---------------------
CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $f$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$f$;
CREATE FUNCTION public.is_customer_of_my_store(p_profile_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $f$
  SELECT EXISTS (SELECT 1 FROM public.orders o JOIN public.stores s ON s.id = o.store_id
                 WHERE o.customer_id = p_profile_id AND s.owner_id = auth.uid());
$f$;
CREATE FUNCTION public.is_store_member(store_id_to_check uuid, user_id_to_check uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $f$
BEGIN RETURN EXISTS (SELECT 1 FROM store_members WHERE store_id = store_id_to_check AND user_id = user_id_to_check); END; $f$;

CREATE FUNCTION public.setup_new_store() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $f$
BEGIN
  INSERT INTO public.store_members(store_id, user_id, role) VALUES(NEW.id, NEW.owner_id, 'admin');
  INSERT INTO public.subscriptions(store_id, plan_id, status) VALUES(NEW.id, 'basic', 'active');
  RETURN NEW;
END; $f$;
CREATE TRIGGER on_store_created_setup AFTER INSERT ON public.stores FOR EACH ROW EXECUTE FUNCTION public.setup_new_store();

-- handle_new_user: VERSIÓN VULNERABLE actual (toma el rol de los metadatos del cliente)
CREATE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE
    v_service_category_id UUID; v_role TEXT; v_service_category_name TEXT; v_category TEXT;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'cliente');
  v_category := new.raw_user_meta_data->>'category';
  INSERT INTO public.profiles (id, full_name, role, phone, address, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', v_role, new.raw_user_meta_data->>'phone',
          new.raw_user_meta_data->>'address', new.email);
  IF v_role IN ('tienda', 'cultivador', 'servicio') THEN
    v_service_category_name := new.raw_user_meta_data->>'service_category';
    IF v_service_category_name IS NOT NULL THEN
        SELECT id INTO v_service_category_id FROM public.service_categories WHERE name = v_service_category_name;
    END IF;
    IF v_service_category_id IS NULL THEN
        SELECT id INTO v_service_category_id FROM public.service_categories WHERE name = 'Domicilios' LIMIT 1;
    END IF;
    INSERT INTO public.stores (owner_id, name, service_category_id, address, cuisine_type, star_rating, activity_type, interest_type, category)
    VALUES (new.id, new.raw_user_meta_data->>'store_name', v_service_category_id, new.raw_user_meta_data->>'address',
            new.raw_user_meta_data->>'cuisine_type', NULLIF(new.raw_user_meta_data->>'star_rating', '')::INT,
            new.raw_user_meta_data->>'activity_type', new.raw_user_meta_data->>'interest_type', v_category);
  END IF;
  RETURN new;
END; $f$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- accept_order: VERSIÓN VULNERABLE actual (SECURITY DEFINER sin validar quién llama)
CREATE FUNCTION public.accept_order(order_id_to_accept uuid, delivery_person_id_to_assign uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $f$
DECLARE customer_delivery_address TEXT; store_pickup_address TEXT; store_coords_arr REAL[]; customer_coords_arr REAL[];
BEGIN
  SELECT o.delivery_address, s.address INTO customer_delivery_address, store_pickup_address
  FROM public.orders o JOIN public.stores s ON o.store_id = s.id WHERE o.id = order_id_to_accept;
  store_coords_arr := ARRAY[6.15515, -75.37367]; customer_coords_arr := ARRAY[6.15000, -75.38000];
  UPDATE public.orders SET status = 'En curso' WHERE id = order_id_to_accept;
  INSERT INTO public.deliveries (order_id, delivery_person_id, status, delivery_address, pickup_address, pickup_coords, delivery_coords)
  VALUES (order_id_to_accept, delivery_person_id_to_assign, 'En curso', customer_delivery_address, store_pickup_address, store_coords_arr, customer_coords_arr)
  ON CONFLICT (order_id) DO UPDATE SET delivery_person_id = delivery_person_id_to_assign, status = 'En curso',
    delivery_address = EXCLUDED.delivery_address, pickup_address = EXCLUDED.pickup_address,
    pickup_coords = EXCLUDED.pickup_coords, delivery_coords = EXCLUDED.delivery_coords;
END; $f$;

-- ------------------------------- RLS ----------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Platform admins can view all profiles" ON public.profiles FOR SELECT USING (is_admin());
CREATE POLICY "Store owners can view their customers' profiles" ON public.profiles FOR SELECT USING (is_customer_of_my_store(id));

CREATE POLICY "Anyone can view service categories" ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Store owners can update their own store" ON public.stores FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);

CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Store owners can view orders for their store" ON public.orders FOR SELECT
  USING (auth.uid() = (SELECT stores.owner_id FROM stores WHERE stores.id = orders.store_id));
CREATE POLICY "Store owners and customers can update order status" ON public.orders FOR UPDATE
  USING ((auth.uid() = customer_id) OR (auth.uid() = (SELECT stores.owner_id FROM stores WHERE stores.id = orders.store_id)));
CREATE POLICY "Store owners can create POS orders" ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = (SELECT stores.owner_id FROM stores WHERE stores.id = orders.store_id));
CREATE POLICY "Allow delivery personnel to see available orders" ON public.orders FOR SELECT
  USING (((status = 'Pendiente') OR (status = 'Pendiente de pago en efectivo')) AND
         ((SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = 'domiciliario'));

CREATE POLICY "Allow delivery personnel to create deliveries" ON public.deliveries FOR INSERT
  WITH CHECK (((SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = 'domiciliario'));
CREATE POLICY "Assigned delivery personnel can see their own deliveries" ON public.deliveries FOR SELECT USING (auth.uid() = delivery_person_id);


-- ---- comisiones (estado actual: 22 % fijo dentro del trigger) y política antigua de equipo ----
CREATE TABLE public.service_types (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, commission_rate numeric);
INSERT INTO public.service_types(name, commission_rate) VALUES ('Productos', 0.22);
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id), quantity integer NOT NULL, price numeric NOT NULL
);
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL, store_id uuid NOT NULL, product_id uuid NOT NULL, service_type_id uuid NOT NULL,
  amount numeric NOT NULL, commission_rate numeric NOT NULL, created_at timestamptz DEFAULT now(),
  commission_fee numeric GENERATED ALWAYS AS (amount * commission_rate) STORED
);
CREATE FUNCTION public.handle_new_order_transaction() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $f$
DECLARE order_store_id UUID; product_price NUMERIC; v_service_type_id UUID; commission_rate_val NUMERIC;
BEGIN
  SELECT o.store_id, p.price INTO order_store_id, product_price FROM public.orders o JOIN public.products p ON p.id = NEW.product_id WHERE o.id = NEW.order_id;
  SELECT id, commission_rate INTO v_service_type_id, commission_rate_val FROM public.service_types WHERE name = 'Productos' LIMIT 1;
  IF commission_rate_val IS NULL THEN commission_rate_val := 0.22; END IF;
  INSERT INTO public.transactions(order_id, store_id, product_id, service_type_id, amount, commission_rate)
  VALUES (NEW.order_id, order_store_id, NEW.product_id, v_service_type_id, product_price * NEW.quantity, commission_rate_val);
  RETURN NEW;
END; $f$;
CREATE TRIGGER on_order_item_created AFTER INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.handle_new_order_transaction();
CREATE FUNCTION public.is_store_admin(store_id_to_check uuid, user_id_to_check uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $f$
BEGIN RETURN EXISTS (SELECT 1 FROM store_members WHERE store_id = store_id_to_check AND user_id = user_id_to_check AND role = 'admin'); END; $f$;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners can insert order items" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM orders JOIN stores ON orders.store_id = stores.id WHERE orders.id = order_items.order_id AND stores.owner_id = auth.uid()));
CREATE POLICY "Users can view order items related to their orders" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (auth.uid() = orders.customer_id OR auth.uid() = (SELECT stores.owner_id FROM stores WHERE stores.id = orders.store_id))));
CREATE POLICY "Store admins can manage members" ON public.store_members FOR ALL USING (is_store_admin(store_id, auth.uid()));
CREATE POLICY "Store owners can create products for their store" ON public.products FOR INSERT
  WITH CHECK (auth.uid() = (SELECT stores.owner_id FROM stores WHERE stores.id = products.store_id));
CREATE POLICY "Store owners can update products in their store" ON public.products FOR UPDATE
  USING (auth.uid() = (SELECT stores.owner_id FROM stores WHERE stores.id = products.store_id));
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Permisos por defecto de Supabase: anon y authenticated con todo; RLS es la barrera
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

INSERT INTO public.service_categories(name) VALUES ('Domicilios'), ('Restaurante');
