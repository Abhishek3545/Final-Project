-- Wishlist table
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid not null,
  created_at timestamptz not null default now(),
  constraint wishlist_items_user_product_unique unique (user_id, product_id),
  constraint wishlist_items_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint wishlist_items_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade
);

alter table public.wishlist_items enable row level security;

drop policy if exists "Users can view own wishlist" on public.wishlist_items;
create policy "Users can view own wishlist"
on public.wishlist_items
for select
using (auth.uid() = user_id);

drop policy if exists "Users can add own wishlist" on public.wishlist_items;
create policy "Users can add own wishlist"
on public.wishlist_items
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can remove own wishlist" on public.wishlist_items;
create policy "Users can remove own wishlist"
on public.wishlist_items
for delete
using (auth.uid() = user_id);

-- Travel packages
create table if not exists public.travel_packages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null,
  duration_days integer not null default 1,
  price numeric(12,2) not null,
  image_url text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.travel_packages enable row level security;

drop policy if exists "Anyone can view travel packages" on public.travel_packages;
create policy "Anyone can view travel packages"
on public.travel_packages
for select
using (true);

drop policy if exists "Service role can manage travel packages" on public.travel_packages;
create policy "Service role can manage travel packages"
on public.travel_packages
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Ticket offers
create table if not exists public.ticket_offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  venue text not null,
  event_date timestamptz not null,
  price numeric(12,2) not null,
  image_url text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.ticket_offers enable row level security;

drop policy if exists "Anyone can view ticket offers" on public.ticket_offers;
create policy "Anyone can view ticket offers"
on public.ticket_offers
for select
using (true);

drop policy if exists "Service role can manage ticket offers" on public.ticket_offers;
create policy "Service role can manage ticket offers"
on public.ticket_offers
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Generic bookings for travel and tickets
create table if not exists public.service_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  booking_type text not null,
  item_id uuid not null,
  quantity integer not null default 1,
  total_amount numeric(12,2) not null,
  status text not null default 'confirmed',
  created_at timestamptz not null default now(),
  constraint service_bookings_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade
);

create index if not exists service_bookings_user_created_idx
  on public.service_bookings (user_id, created_at desc);

alter table public.service_bookings enable row level security;

drop policy if exists "Users can view own service bookings" on public.service_bookings;
create policy "Users can view own service bookings"
on public.service_bookings
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own service bookings" on public.service_bookings;
create policy "Users can create own service bookings"
on public.service_bookings
for insert
with check (auth.uid() = user_id);

-- Seed data
insert into public.travel_packages (title, location, duration_days, price, image_url, description)
select * from (
  values
    ('Beach Escape', 'Goa, India', 5, 22999, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900', 'Resort stay, breakfast, and local transport.'),
    ('Mountain Adventure', 'Manali, India', 4, 18999, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900', 'Hiking package with guided tours and hotel stay.'),
    ('City Explorer', 'Dubai, UAE', 3, 34999, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900', 'City pass, airport transfer, and premium hotel.')
) as seed(title, location, duration_days, price, image_url, description)
where not exists (select 1 from public.travel_packages limit 1);

insert into public.ticket_offers (title, category, venue, event_date, price, image_url, description)
select * from (
  values
    ('Live Music Night', 'Concert', 'Mumbai Arena', now() + interval '21 days', 1999, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900', 'Top indie bands performing live.'),
    ('Championship Final', 'Sports', 'Delhi Stadium', now() + interval '30 days', 2499, 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900', 'Premium seating for the final match.'),
    ('Tech Expo 2026', 'Exhibition', 'Bengaluru Convention Center', now() + interval '40 days', 999, 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900', 'Largest technology and startup expo.')
) as seed(title, category, venue, event_date, price, image_url, description)
where not exists (select 1 from public.ticket_offers limit 1);
