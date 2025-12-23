import { supabase } from '@/lib/customSupabaseClient';

export const pharmacyService = {

    _parseMetadata(product) {
        if (!product) return product;
        let meta = {
            expirationDate: '',
            batchNumber: '',
            requiresPrescription: false,
            presentation: 'Caja',
            laboratory: ''
        };

        const match = product.description?.match(/PHARMA_META:\s*({.*})/s);
        let cleanDesc = product.description || '';

        if (match) {
            try {
                meta = { ...meta, ...JSON.parse(match[1]) };
                cleanDesc = product.description.replace(/\n\nPHARMA_META:\s*{.*}/s, '');
            } catch (e) { }
        }
        return { ...product, meta, description: cleanDesc, full_description: product.description };
    },

    async getPharmacyProducts(storeId) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(this._parseMetadata);
    },

    async savePharmacyProduct(productData) {
        const { meta, description, ...fields } = productData;

        const metaJson = JSON.stringify(meta);
        const finalDescription = `${description || ''}\n\nPHARMA_META: ${metaJson}`;

        const payload = {
            ...fields,
            description: finalDescription
        };

        if (payload.id) {
            const { data, error } = await supabase
                .from('products')
                .update(payload)
                .eq('id', payload.id)
                .select()
                .single();
            if (error) throw error;
            return this._parseMetadata(data);
        } else {
            const { data, error } = await supabase
                .from('products')
                .insert(payload)
                .select()
                .single();
            if (error) throw error;
            return this._parseMetadata(data);
        }
    },

    async deletePharmacyProduct(id) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
    },

    async createPOSTransaction({ orderPayload, items }) {
        // 1. Create Order
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert(orderPayload)
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Create Order Items
        const orderItems = items.map(item => ({
            order_id: orderData.id,
            product_id: item.id,
            quantity: item.qty,
            price: item.price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            // Rollback order if possible or just throw (MVP)
            console.error("Error creating items", itemsError);
            throw itemsError;
        }

        return orderData;
    }
};
