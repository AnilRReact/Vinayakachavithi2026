-- Phase 2: invite-only phone OTP access and database-enforced roles.
-- Apply this AFTER 20260820_phase1.sql.

create type public.portal_role as enum ('viewer', 'treasurer', 'committee');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique,
  role public.portal_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.committee_invites (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  role public.portal_role not null check (role in ('treasurer', 'committee')),
  invited_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- A profile is created when someone signs in. Its role is read from a
-- pre-existing invitation; without an invite it remains Viewer.
create or replace function public.handle_new_profile() returns trigger
language plpgsql security definer set search_path = public as $$
declare invited_role public.portal_role;
begin
  select role into invited_role from public.committee_invites where phone = new.phone;
  insert into public.profiles (id, phone, role)
  values (new.id, new.phone, coalesce(invited_role, 'viewer'));
  update public.committee_invites set accepted_at = now() where phone = new.phone;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_profile();

create or replace function public.my_portal_role() returns public.portal_role
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'viewer'::public.portal_role);
$$;
grant execute on function public.my_portal_role() to anon, authenticated;

-- The database, rather than the browser, decides what each person may change.
create or replace function public.is_committee() returns boolean language sql stable security definer set search_path = public as $$
  select public.my_portal_role() = 'committee'::public.portal_role;
$$;
create or replace function public.is_money_team() returns boolean language sql stable security definer set search_path = public as $$
  select public.my_portal_role() in ('treasurer'::public.portal_role, 'committee'::public.portal_role);
$$;
grant execute on function public.is_committee() to authenticated;
grant execute on function public.is_money_team() to authenticated;

-- Remove deliberately-open Phase 1 policies.
do $$ declare tbl text; begin
  foreach tbl in array array['settings','committee_members','donations','expenses','purchases','bid_items','bid_history','awards','nominees','activities','prasad_sponsors','volunteers','notices','gallery_items'] loop
    execute format('drop policy if exists "phase1 public access" on public.%I', tbl);
    execute format('create policy "public can read" on public.%I for select using (true)', tbl);
  end loop;
end $$;

-- Committee-only operational records.
do $$ declare tbl text; begin
  foreach tbl in array array['settings','committee_members','awards','activities','prasad_sponsors','volunteers','notices','gallery_items'] loop
    execute format('create policy "committee manages records" on public.%I for all to authenticated using (public.is_committee()) with check (public.is_committee())', tbl);
  end loop;
end $$;
-- Treasurer plus Committee may manage the finance area.
do $$ declare tbl text; begin
  foreach tbl in array array['donations','expenses','purchases','bid_items','bid_history'] loop
    execute format('create policy "money team manages records" on public.%I for all to authenticated using (public.is_money_team()) with check (public.is_money_team())', tbl);
  end loop;
end $$;

-- Public voting stays session-scoped in the browser. This function only adds one
-- vote, so anonymous callers cannot overwrite name/photo fields.
create or replace function public.cast_nominee_vote(nominee_id uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare updated_votes integer;
begin
  update public.nominees set votes = votes + 1 where id = nominee_id returning votes into updated_votes;
  if updated_votes is null then raise exception 'Nominee not found'; end if;
  return updated_votes;
end; $$;
grant execute on function public.cast_nominee_vote(uuid) to anon, authenticated;
create policy "committee manages nominees" on public.nominees for all to authenticated using (public.is_committee()) with check (public.is_committee());

alter table public.profiles enable row level security;
alter table public.committee_invites enable row level security;
create policy "users view own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "committee views profiles" on public.profiles for select to authenticated using (public.is_committee());
create policy "committee manages invitations" on public.committee_invites for all to authenticated using (public.is_committee()) with check (public.is_committee());

-- Phase 2 removes the client-visible shared passcode entirely.
alter table public.settings drop column if exists committee_passcode;

drop policy if exists "phase1 gallery upload" on storage.objects;
drop policy if exists "phase1 gallery delete" on storage.objects;
create policy "committee gallery upload" on storage.objects for insert to authenticated with check (bucket_id='gallery' and public.is_committee());
create policy "committee gallery update" on storage.objects for update to authenticated using (bucket_id='gallery' and public.is_committee()) with check (bucket_id='gallery' and public.is_committee());
create policy "committee gallery delete" on storage.objects for delete to authenticated using (bucket_id='gallery' and public.is_committee());

-- Bootstrap your first committee administrator once, then remove this statement:
-- insert into public.committee_invites (phone, role) values ('+919999999999', 'committee');
