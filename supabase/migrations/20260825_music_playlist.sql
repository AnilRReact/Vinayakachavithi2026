-- Music playlist: run after the Phase 2 migration.
create table public.music_playlist (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  language text,
  audio_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.music_playlist enable row level security;
create policy "public can read music" on public.music_playlist for select using (true);
create policy "committee manages music" on public.music_playlist for all to authenticated using (public.is_committee()) with check (public.is_committee());