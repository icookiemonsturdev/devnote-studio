ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_notebook_skin text NOT NULL DEFAULT 'nb_default';

-- Ensure skin_purchases has the unique constraint the webhook upsert relies on
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'skin_purchases_user_skin_unique'
  ) THEN
    ALTER TABLE public.skin_purchases
    ADD CONSTRAINT skin_purchases_user_skin_unique UNIQUE (user_id, skin_id);
  END IF;
END $$;