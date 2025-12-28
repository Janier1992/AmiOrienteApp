
CREATE OR REPLACE FUNCTION public.handle_new_order_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
    DECLARE
        order_store_id UUID;
        product_price NUMERIC;
        v_service_category_id UUID;
        v_service_type_id UUID;
        commission_rate_val NUMERIC;
    BEGIN
        SELECT o.store_id, p.price
        INTO order_store_id, product_price
        FROM public.orders o
        JOIN public.products p ON p.id = NEW.product_id
        WHERE o.id = NEW.order_id;
        
        SELECT s.service_category_id
        INTO v_service_category_id
        FROM public.stores s
        WHERE s.id = order_store_id;

        SELECT st.id, st.commission_rate 
        INTO v_service_type_id, commission_rate_val
        FROM public.service_types st
        JOIN public.service_categories sc ON st.id = sc.id
        WHERE sc.id = v_service_category_id
        LIMIT 1;

        IF v_service_type_id IS NULL THEN
            SELECT id, commission_rate INTO v_service_type_id, commission_rate_val
            FROM public.service_types
            WHERE name = 'Domicilios'
            LIMIT 1;
        END IF;

        IF commission_rate_val IS NULL THEN
            commission_rate_val := 0.22;
        END IF;

        -- Removed commission_fee from INSERT because it is GENERATED ALWAYS
        INSERT INTO public.transactions(order_id, store_id, product_id, service_type_id, amount, commission_rate)
        VALUES (
            NEW.order_id,
            order_store_id,
            NEW.product_id,
            v_service_type_id,
            product_price * NEW.quantity,
            commission_rate_val
        );

        RETURN NEW;
    END;
$function$;
