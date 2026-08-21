-- VaultSnap — Phase 4: vault lock
-- Run this in the Supabase SQL editor after schema.sql and phase3.sql.

-- Needed so the PIN can be upserted by user_id (one PIN record per user).
alter table vault_pins add constraint vault_pins_user_id_key unique (user_id);
