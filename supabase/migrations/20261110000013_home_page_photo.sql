-- Description: Add shared home page photo fields to couples table
ALTER TABLE public.couples 
ADD COLUMN IF NOT EXISTS home_photo_url TEXT,
ADD COLUMN IF NOT EXISTS home_photo_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS home_photo_updated_by UUID REFERENCES public.profiles(id);
