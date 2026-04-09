-- Analytics planning sheet table (Excel-like editable backend data)
create table if not exists public.analytics_sheet_rows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  period_label text not null,
  metric text not null,
  target_value numeric(14,2) not null default 0,
  actual_value numeric(14,2) not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint analytics_sheet_rows_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint analytics_sheet_rows_unique unique (user_id, period_label, metric)
);

create index if not exists analytics_sheet_rows_user_period_idx
  on public.analytics_sheet_rows (user_id, period_label, updated_at desc);

alter table public.analytics_sheet_rows enable row level security;

drop policy if exists "Users can view own analytics sheet rows" on public.analytics_sheet_rows;
create policy "Users can view own analytics sheet rows"
on public.analytics_sheet_rows
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own analytics sheet rows" on public.analytics_sheet_rows;
create policy "Users can create own analytics sheet rows"
on public.analytics_sheet_rows
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own analytics sheet rows" on public.analytics_sheet_rows;
create policy "Users can update own analytics sheet rows"
on public.analytics_sheet_rows
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own analytics sheet rows" on public.analytics_sheet_rows;
create policy "Users can delete own analytics sheet rows"
on public.analytics_sheet_rows
for delete
using (auth.uid() = user_id);

-- Per-user daily analytics summary view from orders + service bookings.
create or replace view public.analytics_user_daily_summary as
with order_daily as (
  select
    o.user_id,
    date(o.created_at) as day,
    count(*)::bigint as order_count,
    coalesce(sum(o.total_amount), 0)::numeric(14,2) as order_revenue
  from public.orders o
  group by o.user_id, date(o.created_at)
), booking_daily as (
  select
    b.user_id,
    date(b.created_at) as day,
    count(*)::bigint as booking_count,
    coalesce(sum(b.total_amount), 0)::numeric(14,2) as booking_revenue
  from public.service_bookings b
  group by b.user_id, date(b.created_at)
), merged as (
  select
    coalesce(o.user_id, b.user_id) as user_id,
    coalesce(o.day, b.day) as day,
    coalesce(o.order_count, 0)::bigint as order_count,
    coalesce(o.order_revenue, 0)::numeric(14,2) as order_revenue,
    coalesce(b.booking_count, 0)::bigint as booking_count,
    coalesce(b.booking_revenue, 0)::numeric(14,2) as booking_revenue
  from order_daily o
  full outer join booking_daily b
    on o.user_id = b.user_id
   and o.day = b.day
)
select
  m.user_id,
  m.day,
  m.order_count,
  m.order_revenue,
  m.booking_count,
  m.booking_revenue,
  (m.order_revenue + m.booking_revenue)::numeric(14,2) as total_revenue,
  (m.order_count + m.booking_count)::bigint as total_transactions
from merged m;
