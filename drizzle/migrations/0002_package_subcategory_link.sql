ALTER TABLE public.package_names ADD COLUMN IF NOT EXISTS subcategory_id integer REFERENCES public.subcategories(id);
CREATE INDEX IF NOT EXISTS package_names_subcategory_idx ON public.package_names(subcategory_id);
COMMENT ON COLUMN public.subcategories.package_name_id IS 'DEPRECATED: link now stored on package_names.subcategory_id';