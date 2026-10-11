-- Run this once in Supabase: SQL Editor, paste, Run.
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  consent_text text,
  created_at timestamptz not null default now()
);

-- Lock the table. Only the server function (service role) can write to it.
alter table public.subscribers enable row level security;
