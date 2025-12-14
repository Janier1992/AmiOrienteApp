import { supabase } from '@/lib/customSupabaseClient';

/**
 * SERVICIO ESPECÍFICO PARA ROPA (MODA)
 * Maneja la lógica de variantes (Talla/Color) almacenada en metadatos.
 */
export const clothingService = {

    _parseVariants(product) {
        if (!product) return product;
        let variants = [];
        const variantsMatch = product.description?.match(/VARIANTS_JSON:\s*(\[.*\])/s);
        let cleanDesc = product.description || '';

        if (variantsMatch) {
            try {
                variants = JSON.parse(variantsMatch[1]);
                cleanDesc = product.description.replace(/\n\nVARIANTS_JSON:\s*\[.*\]/s, '');
            } catch (e) {
                console.error('Error parsing variants', e);
            }
        }
        return { ...product, variants, description: cleanDesc, full_description: product.description };
    },

    async getClothingProducts(storeId) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map(this._parseVariants);
    },

    async saveClothingProduct(productData) {
        // Serialize variants back to description
        const { variants, description, ...fields } = productData;

        let finalDescription = description || '';
        if (variants && variants.length > 0) {
            const variantsJson = JSON.stringify(variants);
            finalDescription = `${description || ''}\n\nVARIANTS_JSON: ${variantsJson}`;
        }

        // Calculate total stock from variants if present
        let totalStock = fields.stock;
        if (variants && variants.length > 0) {
            totalStock = variants.reduce((sum, v) => sum + (Number(v.qty) || 0), 0);
        }

        const payload = {
            ...fields,
            description: finalDescription,
            stock: totalStock,
            product_type: 'physical',
            requires_shipping: true
        };

        if (payload.id) {
            const { data, error } = await supabase
                .from('products')
                .update(payload)
                .eq('id', payload.id)
                .select()
                .single();
            if (error) throw error;
            return this._parseVariants(data);
        } else {
            const { data, error } = await supabase
                .from('products')
                .insert(payload)
                .select()
                .single();
            if (error) throw error;
            return this._parseVariants(data);
        }
    },

    async deleteClothingProduct(id) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
    }
};
