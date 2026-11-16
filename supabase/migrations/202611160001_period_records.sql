-- Pinky Day: private menstrual-cycle records
create table if not exists public.period_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date,
  flow text not null default '普通' check (flow in ('少量', '普通', '較多')),
  symptoms text[] not null default '{}',
  mood text not null default '平靜',
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint period_records_valid_dates check (end_date is null or end_date >= start_date)
);

create index if not exists period_records_user_start_idx
  on public.period_records (user_id, start_date desc);

alter table public.period_records enable row level security;

drop policy if exists "Users can view their own period records" on public.period_records;
create policy "Users can view their own period records"
  on public.period_records for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own period records" on public.period_records;
create policy "Users can insert their own period records"
  on public.period_records for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own period records" on public.period_records;
create policy "Users can update their own period records"
  on public.period_records for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own period records" on public.period_records;
create policy "Users can delete their own period records"
  on public.period_records for delete
  using (auth.uid() = user_id);
