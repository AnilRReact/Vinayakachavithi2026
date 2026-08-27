-- Shared admin passcode model from the requirements document.
-- Run after the existing migrations.
create table if not exists public.admin_config (
  id boolean primary key default true check (id),
  passcode text not null,
  updated_at timestamptz not null default now()
);
alter table public.admin_config enable row level security;

create or replace function public.verify_admin_passcode(candidate text)
returns boolean language sql security definer set search_path = public as $$
  select exists(select 1 from public.admin_config where passcode = candidate);
$$;
create or replace function public.set_admin_passcode(new_passcode text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if new_passcode is null or length(trim(new_passcode)) < 6 then raise exception 'Passcode must be at least 6 characters'; end if;
  insert into public.admin_config (id, passcode) values (true, trim(new_passcode))
  on conflict (id) do update set passcode = excluded.passcode, updated_at = now();
  return true;
end; $$;
grant execute on function public.verify_admin_passcode(text) to anon, authenticated;
grant execute on function public.set_admin_passcode(text) to anon, authenticated;

do $$ declare tbl text; begin
  foreach tbl in array array['settings','committee_members','donations','expenses','purchases','bid_items','bid_history','awards','nominees','activities','prasad_sponsors','volunteers','notices','gallery_items','music_playlist'] loop
    execute format('drop policy if exists "passcode pilot public access" on public.%I', tbl);
    execute format('create policy "passcode pilot public access" on public.%I for all to anon using (true) with check (true)', tbl);
  end loop;
end $$;
drop policy if exists "passcode pilot gallery upload" on storage.objects;
drop policy if exists "passcode pilot gallery delete" on storage.objects;
create policy "passcode pilot gallery upload" on storage.objects for insert to anon with check (bucket_id='gallery');
create policy "passcode pilot gallery delete" on storage.objects for delete to anon using (bucket_id='gallery');
