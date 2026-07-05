-- Nosy database schema
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query)
-- This sets up the foundation now so Sprint 3 (briefing history) doesn't
-- require a schema redesign later.

-- Users table. For MVP this mirrors the two demo accounts (see
-- backend/config/demoUsers.js); it exists in the database so that
-- briefings can be linked to a real row via foreign key, even though
-- login itself is handled by simple demo credentials for now.
create table if not exists public.app_users (
  id text primary key,
  email text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

-- Briefing history (Sprint 3). Stores each generated briefing as JSON,
-- linked to the user who generated it.
create table if not exists public.briefings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.app_users(id) on delete cascade,
  content jsonb not null,
  created_at timestamptz not null default now()
);

-- VIP sender list (referenced in the PRD's Prioritization Logic).
-- Ships empty for MVP; this table just gives it a real home once it's
-- filled in after the agent has run against real data.
create table if not exists public.vip_senders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.app_users(id) on delete cascade,
  sender_email text not null,
  created_at timestamptz not null default now(),
  unique (user_id, sender_email)
);

-- Row Level Security: users can only ever see their own rows.
-- The backend currently connects with the service role key (which
-- bypasses RLS by design, for the trusted server), so these policies
-- are defense in depth for if/when a direct client connection is ever
-- added, per the security checklist for this project.
alter table public.app_users enable row level security;
alter table public.briefings enable row level security;
alter table public.vip_senders enable row level security;

create policy "Users can view their own row"
  on public.app_users for select
  using (id = auth.uid()::text);

create policy "Users can view their own briefings"
  on public.briefings for select
  using (user_id = auth.uid()::text);

create policy "Users can view their own VIP senders"
  on public.vip_senders for select
  using (user_id = auth.uid()::text);

-- Seed the two demo users so foreign keys resolve cleanly once
-- briefing history starts being written.
insert into public.app_users (id, email, name) values
  ('demo-user-1', 'alex@demo.test', 'Alex'),
  ('demo-user-2', 'sam@demo.test', 'Sam')
on conflict (id) do nothing;
