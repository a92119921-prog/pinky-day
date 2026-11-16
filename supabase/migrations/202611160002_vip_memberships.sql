-- Pinky Day: VIP membership foundation
-- Membership status is written only by a trusted payment backend.
create table if not exists public.vip_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan text not null check (plan in ('monthly', 'yearly')),
  status text not null default 'pending' check (status in ('pending', 'active', 'expired', 'cancelled')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vip_memberships enable row level security;

drop policy if exists "Users can view their own VIP membership" on public.vip_memberships;
create policy "Users can view their own VIP membership"
  on public.vip_memberships for select
  using (auth.uid() = user_id);

-- Intentionally no client insert/update/delete policies.
-- A verified payment webhook using the server-side service role must manage VIP status.
