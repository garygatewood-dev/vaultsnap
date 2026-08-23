-- VaultSnap — Phase 6: AI photo enhancement
-- Run this in the Supabase SQL editor after schema.sql, phase3.sql, phase4.sql, phase5.sql.

-- Points a photo at its AI-enhanced version once one exists. A column, not a
-- separate table, since it's strictly 1:1 with the photo and the viewer only
-- ever needs "does one exist, and where".
alter table photos add column if not exists enhanced_storage_path text;

-- One row per successful enhancement run — this is what the monthly soft cap
-- is actually computed from (a real count of real rows), not a counter that
-- can drift out of sync with reality.
create table if not exists photo_enhancements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_id uuid not null references photos(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table photo_enhancements enable row level security;

create policy "Users can view own enhancement history" on photo_enhancements
  for select using (auth.uid() = user_id);
-- No insert/update/delete policies — rows are only ever written by
-- enhance-photo.js using the service role key, same pattern as
-- stripe_webhook_events in phase5.sql.

grant all on table photo_enhancements to service_role;

-- Premium-only, 100 enhancements per calendar month per user. Enforced here
-- (not just in enhance-photo.js) for the same reason as enforce_photo_cap in
-- phase5.sql: a client could otherwise insert into this table directly and
-- bypass a function-only check. This trigger is the one gate every insert
-- path actually has to pass through.
create or replace function enforce_enhancement_cap()
returns trigger as $$
declare
  monthly_count integer;
  has_active_subscription boolean;
begin
  select exists(
    select 1 from subscriptions
    where user_id = new.user_id
      and status in ('active', 'trialing')
  ) into has_active_subscription;

  if not has_active_subscription then
    raise exception 'PREMIUM_REQUIRED';
  end if;

  select count(*) into monthly_count
  from photo_enhancements
  where user_id = new.user_id
    and created_at >= date_trunc('month', now());

  if monthly_count >= 100 then
    raise exception 'MONTHLY_ENHANCEMENT_CAP_REACHED';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists photo_enhancements_enforce_cap on photo_enhancements;
create trigger photo_enhancements_enforce_cap
  before insert on photo_enhancements
  for each row execute function enforce_enhancement_cap();
