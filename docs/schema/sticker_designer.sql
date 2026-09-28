-- Sticker designer: saved label designs, shop-wide values and extra product details.
-- Safe to run more than once. Until it is run the app keeps designs and shop values
-- in the browser and hides the extra product details.

-- One saved sticker layout. size holds the label stock (roll or A4 sheet) in mm,
-- elements the positioned objects, variables the design's own formulas and prompts,
-- default_for the supplier ids whose products print with this design by default.
create table if not exists public.label_designs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_default boolean not null default false,
  size jsonb not null default '{}'::jsonb,
  elements jsonb not null default '[]'::jsonb,
  variables jsonb not null default '[]'::jsonb,
  default_for jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.label_designs enable row level security;

drop policy if exists label_designs_rw on public.label_designs;
create policy label_designs_rw on public.label_designs for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Shop-wide values used on stickers and messages: shop_name, tagline, phone,
-- whatsapp, upi_id, cost_code_word, product_fields.
create table if not exists public.shop_settings (
  key text primary key,
  value jsonb,
  updated_at timestamp with time zone not null default now()
);

alter table public.shop_settings enable row level security;

drop policy if exists shop_settings_rw on public.shop_settings;
create policy shop_settings_rw on public.shop_settings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Extra product details such as fabric, colour, size, design no. and work type.
alter table public.products add column if not exists attributes jsonb not null default '{}'::jsonb;

-- Make PostgREST see the new tables and column straight away.
notify pgrst, 'reload schema';
