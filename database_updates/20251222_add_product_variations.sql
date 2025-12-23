-- Migration: Add Product Variations Table
-- Goal: Support resizing, colors, materials without duplicating products.

CREATE TABLE IF NOT EXISTS product_variations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "Rojo / XL"
  sku TEXT,
  price NUMERIC(10, 2), -- If null, use parent product price
  stock INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}', -- e.g. {"color": "red", "size": "xl"}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_variations_product_id ON product_variations(product_id);

-- RLS Policies
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read variations" ON product_variations
  FOR SELECT USING (true);

CREATE POLICY "Store owners manage variations" ON product_variations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON p.store_id = s.id
      WHERE p.id = product_variations.product_id
      AND s.owner_id = auth.uid()
    )
  );
