-- VaultSnap — WebAuthn multi-device support
-- Run this in the Supabase SQL editor after phase4.sql.
--
-- vault_pins.webauthn_credential_id could only ever hold one credential per
-- account, so a second device (e.g. a phone) had nothing to register against
-- without overwriting the first. This replaces it with a proper one-to-many
-- table: one row per registered device, not one column per account.

create table if not exists webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credential_id text not null unique,
  device_label text,
  created_at timestamptz not null default now()
);

alter table webauthn_credentials enable row level security;

create policy "Users can view own webauthn credentials" on webauthn_credentials
  for select using (auth.uid() = user_id);
create policy "Users can insert own webauthn credentials" on webauthn_credentials
  for insert with check (auth.uid() = user_id);
create policy "Users can update own webauthn credentials" on webauthn_credentials
  for update using (auth.uid() = user_id);
create policy "Users can delete own webauthn credentials" on webauthn_credentials
  for delete using (auth.uid() = user_id);

grant all on table webauthn_credentials to service_role;

-- Preserve any existing single credential (e.g. a laptop registered under Phase 4)
-- so nobody has to re-register a device that already worked.
insert into webauthn_credentials (user_id, credential_id)
select user_id, webauthn_credential_id
from vault_pins
where webauthn_credential_id is not null
on conflict (credential_id) do nothing;

alter table vault_pins drop column if exists webauthn_credential_id;
