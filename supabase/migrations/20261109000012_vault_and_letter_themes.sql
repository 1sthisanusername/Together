-- ==============================================================================
-- MIGRATION: 20261109000012_vault_and_letter_themes.sql
-- Features:
-- 1. Support stationery themes and wax seal stickers on letters
-- 2. Vault privacy flag on memories and letters
-- 3. Dedicated vault_items table for sensitive couple items
-- ==============================================================================

-- 1. Add letter stationery styling and vault flag
ALTER TABLE public.letters
  ADD COLUMN IF NOT EXISTS stationery_theme TEXT DEFAULT 'parchment_cream',
  ADD COLUMN IF NOT EXISTS seal_sticker TEXT DEFAULT '❤️',
  ADD COLUMN IF NOT EXISTS is_vault BOOLEAN DEFAULT false;

-- 2. Add vault flag on memories
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS is_vault BOOLEAN DEFAULT false;

-- 3. Dedicated vault items table
CREATE TABLE IF NOT EXISTS public.vault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  media_id UUID REFERENCES public.media_files(id) ON DELETE SET NULL,
  category TEXT DEFAULT 'photo', -- 'photo', 'note', 'letter'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_vault_items_couple_id ON public.vault_items(couple_id);

ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vault_items_couple_select" ON public.vault_items;
CREATE POLICY "vault_items_couple_select" ON public.vault_items
  FOR SELECT TO authenticated
  USING (couple_id = public.get_active_couple_id(auth.uid()));

DROP POLICY IF EXISTS "vault_items_couple_insert" ON public.vault_items;
CREATE POLICY "vault_items_couple_insert" ON public.vault_items
  FOR INSERT TO authenticated
  WITH CHECK (
    couple_id = public.get_active_couple_id(auth.uid()) AND
    created_by = auth.uid()
  );

DROP POLICY IF EXISTS "vault_items_couple_delete" ON public.vault_items;
CREATE POLICY "vault_items_couple_delete" ON public.vault_items
  FOR DELETE TO authenticated
  USING (
    couple_id = public.get_active_couple_id(auth.uid()) AND
    created_by = auth.uid()
  );
