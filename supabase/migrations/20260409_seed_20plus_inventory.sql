-- Ensure marketplace categories exist
insert into public.categories (name, slug, description, image_url)
select seed.name, seed.slug, seed.description, seed.image_url
from (
  values
    ('Grocery', 'grocery', 'Daily essentials and fresh picks.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900'),
    ('Clothing', 'clothing', 'Fashion for all seasons.', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=900'),
    ('Electronics', 'electronics', 'Smart gadgets and devices.', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=900'),
    ('Home & Garden', 'home-garden', 'Home upgrades and decor.', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=900')
) as seed(name, slug, description, image_url)
where not exists (
  select 1
  from public.categories c
  where c.slug = seed.slug
);

-- Insert 24 dummy products for each shopping section
with category_data as (
  select slug, id
  from public.categories
  where slug in ('grocery', 'clothing', 'electronics', 'home-garden')
), section_templates as (
  select * from (
    values
      ('grocery', 'Grocery', 6.99, 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900'),
      ('clothing', 'Clothing', 24.99, 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=900'),
      ('electronics', 'Electronics', 49.99, 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=900'),
      ('home-garden', 'Home', 29.99, 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=900')
  ) as t(slug, section_name, base_price, image_url)
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
  st.section_name || ' Product ' || gs::text,
  'Premium ' || lower(st.section_name) || ' item for everyday use. Item #' || gs::text,
  round((st.base_price + (gs * 1.75))::numeric, 2),
  round((st.base_price + (gs * 2.10))::numeric, 2),
  30 + gs,
  cd.id,
  st.image_url,
  (gs % 7 = 0),
  (gs % 5 = 0),
  round((3.6 + (gs % 14) * 0.1)::numeric, 1),
  20 + gs * 3
from generate_series(1, 24) gs
join section_templates st on true
join category_data cd on cd.slug = st.slug
where not exists (
  select 1
  from public.products p
  where p.name = st.section_name || ' Product ' || gs::text
);

-- Insert 24 travel packages if table has fewer than 20 records
insert into public.travel_packages (title, location, duration_days, price, image_url, description, is_active)
select
  'Travel Escape ' || gs::text,
  (array['Goa, India', 'Manali, India', 'Kerala, India', 'Bali, Indonesia', 'Dubai, UAE', 'Bangkok, Thailand'])[(gs % 6) + 1],
  2 + (gs % 6),
  round((14999 + gs * 899)::numeric, 2),
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900',
  'Curated package with hotel, local transport, and activity support. Plan #' || gs::text,
  true
from generate_series(1, 24) gs
where (select count(*) from public.travel_packages) < 20;

-- Insert 24 ticket offers if table has fewer than 20 records
insert into public.ticket_offers (title, category, venue, event_date, price, image_url, description, is_active)
select
  'Event Ticket ' || gs::text,
  (array['Concert', 'Sports', 'Exhibition', 'Theatre', 'Workshop'])[(gs % 5) + 1],
  (array['Mumbai Arena', 'Delhi Stadium', 'Bengaluru Expo Center', 'Pune Theatre Hall', 'Hyderabad Convention Dome'])[(gs % 5) + 1],
  now() + make_interval(days => 10 + gs * 2),
  round((799 + gs * 110)::numeric, 2),
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900',
  'Priority seating with easy digital entry. Offer #' || gs::text,
  true
from generate_series(1, 24) gs
where (select count(*) from public.ticket_offers) < 20;
