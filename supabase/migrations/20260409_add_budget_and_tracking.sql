-- Budget calculator storage per user
create table if not exists public.budget_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  monthly_income numeric(12,2) not null default 0,
  fixed_expenses numeric(12,2) not null default 0,
  variable_expenses numeric(12,2) not null default 0,
  savings_goal numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_profiles_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade
);

alter table public.budget_profiles enable row level security;

drop policy if exists "Users can view own budget profile" on public.budget_profiles;
create policy "Users can view own budget profile"
on public.budget_profiles
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own budget profile" on public.budget_profiles;
create policy "Users can create own budget profile"
on public.budget_profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own budget profile" on public.budget_profiles;
create policy "Users can update own budget profile"
on public.budget_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- GPS-style order tracking timeline
create table if not exists public.order_tracking_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  status text not null,
  latitude double precision,
  longitude double precision,
  notes text,
  created_at timestamptz not null default now(),
  constraint order_tracking_events_order_id_fkey
    foreign key (order_id) references public.orders(id) on delete cascade
);

create index if not exists order_tracking_events_order_id_created_at_idx
  on public.order_tracking_events (order_id, created_at desc);

alter table public.order_tracking_events enable row level security;

drop policy if exists "Users can view tracking for their orders" on public.order_tracking_events;
create policy "Users can view tracking for their orders"
on public.order_tracking_events
for select
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_tracking_events.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "Service role can manage tracking" on public.order_tracking_events;
create policy "Service role can manage tracking"
on public.order_tracking_events
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
