-- VaultSnap — Phase 1 schema
-- Run this in the Supabase SQL editor for the project.

create extension if not exists pgcrypto;

-- albums ---------------------------------------------------------------

create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table albums enable row level security;

create policy "Users can view own albums" on albums
  for select using (auth.uid() = user_id);
create policy "Users can insert own albums" on albums
  for insert with check (auth.uid() = user_id);
create policy "Users can update own albums" on albums
  for update using (auth.uid() = user_id);
create policy "Users can delete own albums" on albums
  for delete using (auth.uid() = user_id);

grant all on table albums to service_role;

-- photos -----------------------------------------------------------------

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  thumbnail_path text,
  album_id uuid references albums(id) on delete set null,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

alter table photos enable row level security;

create policy "Users can view own photos" on photos
  for select using (auth.uid() = user_id);
create policy "Users can insert own photos" on photos
  for insert with check (auth.uid() = user_id);
create policy "Users can update own photos" on photos
  for update using (auth.uid() = user_id);
create policy "Users can delete own photos" on photos
  for delete using (auth.uid() = user_id);

grant all on table photos to service_role;

-- subscriptions ------------------------------------------------------------

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  current_period_end timestamptz
);

alter table subscriptions enable row level security;

create policy "Users can view own subscription" on subscriptions
  for select using (auth.uid() = user_id);
create policy "Users can insert own subscription" on subscriptions
  for insert with check (auth.uid() = user_id);
create policy "Users can update own subscription" on subscriptions
  for update using (auth.uid() = user_id);
create policy "Users can delete own subscription" on subscriptions
  for delete using (auth.uid() = user_id);

grant all on table subscriptions to service_role;

-- break_in_attempts --------------------------------------------------------

create table if not exists break_in_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_storage_path text,
  attempted_at timestamptz not null default now()
);

alter table break_in_attempts enable row level security;

create policy "Users can view own break-in attempts" on break_in_attempts
  for select using (auth.uid() = user_id);
create policy "Users can insert own break-in attempts" on break_in_attempts
  for insert with check (auth.uid() = user_id);
create policy "Users can update own break-in attempts" on break_in_attempts
  for update using (auth.uid() = user_id);
create policy "Users can delete own break-in attempts" on break_in_attempts
  for delete using (auth.uid() = user_id);

grant all on table break_in_attempts to service_role;

-- vault_pins ----------------------------------------------------------------

create table if not exists vault_pins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pin_hash text not null,
  webauthn_credential_id text
);

alter table vault_pins enable row level security;

create policy "Users can view own vault pin" on vault_pins
  for select using (auth.uid() = user_id);
create policy "Users can insert own vault pin" on vault_pins
  for insert with check (auth.uid() = user_id);
create policy "Users can update own vault pin" on vault_pins
  for update using (auth.uid() = user_id);
create policy "Users can delete own vault pin" on vault_pins
  for delete using (auth.uid() = user_id);

grant all on table vault_pins to service_role;
