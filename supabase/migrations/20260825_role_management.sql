-- Committee administrators can assign roles to authenticated users.
-- Run after 20260824_phase2_auth.sql.
create policy "committee manages user roles" on public.profiles
  for update to authenticated
  using (public.is_committee())
  with check (role in ('viewer', 'treasurer', 'committee'));