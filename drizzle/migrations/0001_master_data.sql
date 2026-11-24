CREATE TABLE public.states (id serial PRIMARY KEY, name text NOT NULL, is_active boolean NOT NULL DEFAULT true);
CREATE UNIQUE INDEX states_name_uq ON public.states (lower(name));
CREATE TABLE public.cities (id serial PRIMARY KEY, city_name text NOT NULL, state_id int NOT NULL REFERENCES public.states(id), district text, aliases text[] NOT NULL DEFAULT '{}', is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX cities_name_state_uq ON public.cities (lower(city_name), state_id);
CREATE TABLE public.destinations (id serial PRIMARY KEY, city_id int NOT NULL REFERENCES public.cities(id), destination_name text NOT NULL, destination_type text NOT NULL DEFAULT 'pilgrimage' CHECK (destination_type IN ('pilgrimage','tourist','stay','other')), is_active boolean NOT NULL DEFAULT true);
CREATE UNIQUE INDEX destinations_uq ON public.destinations (lower(destination_name), city_id);
CREATE TABLE public.vehicle_types (id serial PRIMARY KEY, vehicle_name text NOT NULL, category text NOT NULL CHECK (category IN ('car','suv','tempo','bus','other')), seating_capacity int CHECK (seating_capacity IS NULL OR seating_capacity BETWEEN 1 AND 100), is_active boolean NOT NULL DEFAULT true, display_order int NOT NULL DEFAULT 100);
CREATE UNIQUE INDEX vehicle_types_uq ON public.vehicle_types (lower(vehicle_name));
CREATE TABLE public.package_names (id serial PRIMARY KEY, name text NOT NULL, state_name text, is_active boolean NOT NULL DEFAULT true);
CREATE UNIQUE INDEX package_names_uq ON public.package_names (lower(name));
CREATE TABLE public.subcategories (id serial PRIMARY KEY, name text NOT NULL, package_name_id int REFERENCES public.package_names(id), is_active boolean NOT NULL DEFAULT true);
CREATE UNIQUE INDEX subcategories_uq ON public.subcategories (lower(name));
CREATE TABLE public.durations (id serial PRIMARY KEY, days int NOT NULL CHECK (days BETWEEN 1 AND 60), nights int NOT NULL CHECK (nights BETWEEN 0 AND 60), display_label text NOT NULL, is_active boolean NOT NULL DEFAULT true);
CREATE UNIQUE INDEX durations_uq ON public.durations (days, nights);

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['states','cities','destinations','vehicle_types','package_names','subcategories','durations'] LOOP
  EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
  EXECUTE format('GRANT INSERT, UPDATE ON public.%I TO authenticated', t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  EXECUTE format('GRANT USAGE ON SEQUENCE public.%I TO authenticated', t||'_id_seq');
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('CREATE POLICY "anyone reads masters" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);
  EXECUTE format('CREATE POLICY "admins add masters" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''))', t);
  EXECUTE format('CREATE POLICY "admins edit masters" ON public.%I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))', t);
 END LOOP; END $$;