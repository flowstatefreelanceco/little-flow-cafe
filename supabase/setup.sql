-- Run this once in Supabase: SQL Editor, New query, paste everything, Run.

-- 1. Newsletter list (signups from the footer form and from account sign ups)
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text,
  last_name text,
  source text,
  consent_text text,
  created_at timestamptz not null default now()
);
alter table public.subscribers add column if not exists first_name text;
alter table public.subscribers add column if not exists last_name text;
alter table public.subscribers enable row level security;

-- 2. Each person's saved cafe (tasks, plants, character, streak)
create table if not exists public.saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.saves enable row level security;

drop policy if exists "read own save" on public.saves;
drop policy if exists "insert own save" on public.saves;
drop policy if exists "update own save" on public.saves;
create policy "read own save" on public.saves for select using (auth.uid() = user_id);
create policy "insert own save" on public.saves for insert with check (auth.uid() = user_id);
create policy "update own save" on public.saves for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. Add someone to the community newsletter list only AFTER they confirm their email
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null
     and (tg_op = 'INSERT' or old.email_confirmed_at is null)
     and coalesce(new.raw_user_meta_data->>'newsletter', '') = 'true'
     and new.email is not null then
    insert into public.subscribers (email, first_name, last_name, source, consent_text)
    values (lower(new.email), new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', 'cafe-account',
            'Joined the Flow State community newsletter by creating an account. Welcome to unsubscribe after the first issue.')
    on conflict (email) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed after insert or update of email_confirmed_at on auth.users
  for each row execute function public.handle_new_user();
