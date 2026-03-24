create table if not exists public.sync_sessions (
  sync_code text primary key,
  user_id uuid null,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists sync_sessions_updated_at_idx
  on public.sync_sessions (updated_at desc);
