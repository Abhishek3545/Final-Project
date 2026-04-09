-- Dummy auth event logging table for demo mode
create table if not exists public.auth_demo_events (
  id uuid primary key default gen_random_uuid(),
  method text not null,
  identifier text,
  status text not null,
  user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists auth_demo_events_created_idx
  on public.auth_demo_events (created_at desc);

alter table public.auth_demo_events enable row level security;

-- Allow app clients to log demo auth events.
drop policy if exists "Allow insert auth demo events" on public.auth_demo_events;
create policy "Allow insert auth demo events"
on public.auth_demo_events
for insert
with check (true);

-- Authenticated users can see their own events.
drop policy if exists "Users can view own auth demo events" on public.auth_demo_events;
create policy "Users can view own auth demo events"
on public.auth_demo_events
for select
using (auth.uid() = user_id);
