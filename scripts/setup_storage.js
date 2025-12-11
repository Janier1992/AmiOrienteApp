
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vgpvczyeyqmicuwjkczh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZncHZjenlleXFtaWN1d2prY3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5Mjk0MDYsImV4cCI6MjA2ODUwNTQwNn0.EVCWmGQPtr9Pug0b-t6my-DBm72iMTYVZnnqBaObzrY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupStorage() {
    console.log('Checking storage buckets...');

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }

    const productsBucket = buckets.find(b => b.name === 'products');

    if (productsBucket) {
        console.log('Bucket "products" already exists.');
    } else {
        console.log('Creating bucket "products"...');
        const { data, error: createError } = await supabase.storage.createBucket('products', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
        });

        if (createError) {
            console.error('Error creating bucket:', createError);
        } else {
            console.log('Bucket "products" created successfully.');
        }
    }
}

setupStorage();
