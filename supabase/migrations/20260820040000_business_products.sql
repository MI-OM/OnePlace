-- Business products table for digital/physical goods on generated websites
CREATE TABLE IF NOT EXISTS public.business_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric,
  price_type text DEFAULT 'fixed' CHECK (price_type IN ('fixed','starting_from','range','quote_required')),
  min_price numeric,
  max_price numeric,
  currency text DEFAULT 'CAD',
  image_url text,
  url text,
  product_type text DEFAULT 'product' CHECK (product_type IN ('product','digital','gift_card','service_addon')),
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_products_business ON public.business_products(business_id);

ALTER TABLE public.business_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for active products" ON public.business_products;
CREATE POLICY "Public read for active products" ON public.business_products
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated manage products" ON public.business_products;
CREATE POLICY "Authenticated manage products" ON public.business_products
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Service role full access products" ON public.business_products;
CREATE POLICY "Service role full access products" ON public.business_products
  FOR ALL USING (auth.role() = 'service_role');

GRANT SELECT ON public.business_products TO anon;
GRANT ALL ON public.business_products TO authenticated;
GRANT ALL ON public.business_products TO service_role;
