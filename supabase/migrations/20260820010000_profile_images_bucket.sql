-- Profile images storage bucket
insert into storage.buckets (id, name, public)
  values ('profile-images', 'User profile pictures', true)
  on conflict (id) do nothing;

-- Public read access for profile images
drop policy if exists "Public read access for profile images" on storage.objects;
create policy "Public read access for profile images"
  on storage.objects for select
  using (bucket_id = 'profile-images');

-- Authenticated users can upload their own avatar
drop policy if exists "Authenticated upload profile images" on storage.objects;
create policy "Authenticated upload profile images"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-images'
    and auth.role() = 'authenticated'
  );

-- Users can update their own avatar
drop policy if exists "Authenticated update profile images" on storage.objects;
create policy "Authenticated update profile images"
  on storage.objects for update
  using (
    bucket_id = 'profile-images'
    and auth.role() = 'authenticated'
  );

-- Users can delete their own avatar
drop policy if exists "Authenticated delete profile images" on storage.objects;
create policy "Authenticated delete profile images"
  on storage.objects for delete
  using (
    bucket_id = 'profile-images'
    and auth.role() = 'authenticated'
  );
