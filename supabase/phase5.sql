-- VaultSnap — Phase 5: Stripe billing
-- Run this in the Supabase SQL editor after schema.sql, phase3.sql, phase4.sql.

-- Idempotency ledger for stripe-webhook.js — lets a retried Stripe delivery of
-- the same event be detected and skipped instead of reprocessed.
create table if not exists stripe_webhook_events (
  stripe_event_id text primary key,
  processed_at timestamptz not null default now()
);

alter table stripe_webhook_events enable row level security;
-- No policies — this table is never touched by end users, only by
-- stripe-webhook.js using the service role key.

grant all on table stripe_webhook_events to service_role;

-- Free-tier cap: 25 photos unless the owner has an active/trialing subscription.
-- Enforced here, not just client-side or in generate-upload-url.js, because a
-- user's own authenticated client can call Supabase Storage directly, bypassing
-- that function entirely — this trigger is the one gate every upload path has
-- to pass through, since a photo isn't "in the vault" until this row exists.
create or replace function enforce_photo_cap()
returns trigger as $$
declare
  photo_count integer;
  has_active_subscription boolean;
begin
  select count(*) into photo_count from photos where user_id = new.user_id;

  select exists(
    select 1 from subscriptions
    where user_id = new.user_id
      and status in ('active', 'trialing')
  ) into has_active_subscription;

  if photo_count >= 25 and not has_active_subscription then
    raise exception 'FREE_TIER_LIMIT_REACHED';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists photos_enforce_cap on photos;
create trigger photos_enforce_cap
  before insert on photos
  for each row execute function enforce_photo_cap();
