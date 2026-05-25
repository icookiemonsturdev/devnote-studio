
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS heading_font text NOT NULL DEFAULT 'inter',
  ADD COLUMN IF NOT EXISTS body_font text NOT NULL DEFAULT 'inter';

CREATE TABLE IF NOT EXISTS public.skin_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skin_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, skin_id)
);

ALTER TABLE public.skin_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skin_purchases_select_own" ON public.skin_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
