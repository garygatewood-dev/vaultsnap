-- VaultSnap — Phase 3: private storage bucket + search column
-- Run this in the Supabase SQL editor after schema.sql has already been applied.

insert into storage.buckets (id, name, public)
values ('vault-photos', 'vault-photos', false)
on conflict (id) do nothing;

-- storage.objects has RLS enabled by default in Supabase; these policies
-- scope every user to their own folder: paths are always "{user_id}/...".

create policy "Users can view own vault files" on storage.objects
  for select using (
    bucket_id = 'vault-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can upload own vault files" on storage.objects
  for insert with check (
    bucket_id = 'vault-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own vault files" on storage.objects
  for update using (
    bucket_id = 'vault-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own vault files" on storage.objects
  for delete using (
    bucket_id = 'vault-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- searchable filename, needed for the gallery search box
alter table photos add column if not exists original_filename text;
