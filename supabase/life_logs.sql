create table if not exists public.life_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key text not null,
  task_id text not null,
  value jsonb not null,
  xp integer not null default 0,
  ts bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, date_key, task_id)
);

create index if not exists life_logs_user_date_idx
  on public.life_logs (user_id, date_key desc);

create or replace function public.set_life_logs_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_life_logs_updated_at on public.life_logs;
create trigger set_life_logs_updated_at
before update on public.life_logs
for each row
execute function public.set_life_logs_updated_at();

alter table public.life_logs enable row level security;

drop policy if exists "Life logs are visible to their owner" on public.life_logs;
create policy "Life logs are visible to their owner"
on public.life_logs
for select
using (auth.uid() = user_id);

drop policy if exists "Life logs are writable by their owner" on public.life_logs;
create policy "Life logs are writable by their owner"
on public.life_logs
for insert
with check (auth.uid() = user_id);

drop policy if exists "Life logs are updatable by their owner" on public.life_logs;
create policy "Life logs are updatable by their owner"
on public.life_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
