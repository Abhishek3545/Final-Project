-- Ensure cart backend table exists with RLS and duplicate protection
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid not null,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint cart_items_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade
);

create index if not exists cart_items_user_created_idx
  on public.cart_items (user_id, created_at desc);

create index if not exists cart_items_product_idx
  on public.cart_items (product_id);

alter table public.cart_items enable row level security;

drop policy if exists "Users can view own cart" on public.cart_items;
create policy "Users can view own cart"
on public.cart_items
for select
using (auth.uid() = user_id);

drop policy if exists "Users can add own cart items" on public.cart_items;
create policy "Users can add own cart items"
on public.cart_items
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own cart items" on public.cart_items;
create policy "Users can update own cart items"
on public.cart_items
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can remove own cart items" on public.cart_items;
create policy "Users can remove own cart items"
on public.cart_items
for delete
using (auth.uid() = user_id);

-- Add a unique constraint for reliable upserts and duplicate prevention
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cart_items_user_product_unique'
  ) then
    alter table public.cart_items
      add constraint cart_items_user_product_unique unique (user_id, product_id);
  end if;
end $$;

-- Ensure Clothing category exists
insert into public.categories (name, slug, description, image_url)
select 'Clothing', 'clothing', 'Fashion for all seasons', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=900'
where not exists (
  select 1
  from public.categories
  where slug = 'clothing'
);

-- Add 15 clothing dummy products
with clothing_category as (
  select id from public.categories where slug = 'clothing' limit 1
)
insert into public.products (
  name,
  description,
  price,
  original_price,
  stock,
  category_id,
  image_url,
  is_featured,
  is_bestseller,
  rating,
  reviews_count
)
select
  'Clothing Collection ' || gs::text,
  'Comfortable and stylish clothing item #' || gs::text || ' for daily wear.',
  round((24.99 + gs * 2.25)::numeric, 2),
  round((29.99 + gs * 2.40)::numeric, 2),
  40 + gs,
  cc.id,
  (array[
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900',
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900',
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=900',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900',
    'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=900'
  ])[(gs % 5) + 1],
  (gs % 4 = 0),
  (gs % 5 = 0),
  round((3.9 + (gs % 9) * 0.1)::numeric, 1),
  30 + gs * 5
from generate_series(1, 15) gs
cross join clothing_category cc
where not exists (
  select 1
  from public.products p
  where p.name = 'Clothing Collection ' || gs::text
);

-- Add 15 travel dummy packages
insert into public.travel_packages (title, location, duration_days, price, image_url, description, is_active)
select
  'Travel Escape ' || gs::text,
  (array['Goa, India', 'Manali, India', 'Kerala, India', 'Dubai, UAE', 'Bangkok, Thailand'])[(gs % 5) + 1],
  2 + (gs % 6),
  round((13999 + gs * 899)::numeric, 2),
  (array[
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=900',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=900'
  ])[(gs % 5) + 1],
  'Holiday package #' || gs::text || ' with hotel, local transfers, and guided experiences.',
  true
from generate_series(1, 15) gs
where not exists (
  select 1
  from public.travel_packages t
  where t.title = 'Travel Escape ' || gs::text
);

-- Add 15 ticket dummy offers
insert into public.ticket_offers (title, category, venue, event_date, price, image_url, description, is_active)
select
  'Event Ticket ' || gs::text,
  (array['Concert', 'Sports', 'Exhibition', 'Theatre', 'Workshop'])[(gs % 5) + 1],
  (array['Mumbai Arena', 'Delhi Stadium', 'Bengaluru Expo Center', 'Pune Theatre Hall', 'Hyderabad Convention Dome'])[(gs % 5) + 1],
  now() + make_interval(days => 7 + gs * 2),
  round((699 + gs * 120)::numeric, 2),
  (array[
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=900'
  ])[(gs % 5) + 1],
  'Digital admission with fast check-in for event #' || gs::text || '.',
  true
from generate_series(1, 15) gs
where not exists (
  select 1
  from public.ticket_offers o
  where o.title = 'Event Ticket ' || gs::text
);
