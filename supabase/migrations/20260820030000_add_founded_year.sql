-- Add founded_year column to businesses for website "Years in Business" display
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS founded_year integer;
