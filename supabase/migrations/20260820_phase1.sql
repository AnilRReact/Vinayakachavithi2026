-- Vinayaka Vedika, Phase 1. Run in Supabase SQL Editor or through Supabase CLI.
create extension if not exists pgcrypto;

create table public.settings (
  id uuid primary key default gen_random_uuid(), singleton boolean unique not null default true check (singleton),
  village_name text, tagline text, festival_date date, upi_id text,
  morning_aarti_time time, evening_aarti_time time, daily_schedule_note text,
  em_doctor_name text, em_doctor_phone text, em_police_phone text, em_coord_name text, em_coord_phone text,
  committee_passcode text, created_at timestamptz not null default now()
);
create table public.committee_members (id uuid primary key default gen_random_uuid(), name text not null, role text not null, phone text not null, photo_url text, created_at timestamptz not null default now());
create table public.donations (id uuid primary key default gen_random_uuid(), donor_name text not null, amount numeric(12,2) not null check(amount > 0), date date not null, note text, created_at timestamptz not null default now());
create table public.expenses (id uuid primary key default gen_random_uuid(), category text not null, amount numeric(12,2) not null check(amount > 0), date date not null, paid_to text not null, note text, created_at timestamptz not null default now());
create table public.purchases (id uuid primary key default gen_random_uuid(), item text not null, category text not null, cost numeric(12,2) not null check(cost >= 0), year integer not null, reusable boolean not null default false, condition_note text, created_at timestamptz not null default now());
create table public.bid_items (id uuid primary key default gen_random_uuid(), item_name text not null, description text, starting_bid numeric(12,2) not null check(starting_bid > 0), current_bid numeric(12,2), current_bidder text, status text not null default 'open' check(status in ('open','closed')), date date, created_at timestamptz not null default now());
create table public.bid_history (id uuid primary key default gen_random_uuid(), bid_item_id uuid not null references public.bid_items(id) on delete cascade, bidder text not null, amount numeric(12,2) not null check(amount > 0), created_at timestamptz not null default now());
create table public.awards (id uuid primary key default gen_random_uuid(), title text not null, recipient text not null, year integer not null, note text, created_at timestamptz not null default now());
create table public.nominees (id uuid primary key default gen_random_uuid(), name text not null, note text, photo_url text, votes integer not null default 0 check(votes >= 0), created_at timestamptz not null default now());
create table public.activities (id uuid primary key default gen_random_uuid(), title text not null, date date not null, start_time time, end_time time, location text, description text, created_at timestamptz not null default now());
create table public.prasad_sponsors (id uuid primary key default gen_random_uuid(), sponsor_name text not null, date date not null, item text not null, note text, created_at timestamptz not null default now());
create table public.volunteers (id uuid primary key default gen_random_uuid(), name text not null, duty text not null, date date not null, contact text, created_at timestamptz not null default now());
create table public.notices (id uuid primary key default gen_random_uuid(), message text not null, date date not null default current_date, pinned boolean not null default false, created_at timestamptz not null default now());
create table public.gallery_items (id uuid primary key default gen_random_uuid(), type text not null check(type in ('photo','video')), url text not null, caption text, date date not null default current_date, created_at timestamptz not null default now());

-- Closing an auction creates the donation exactly once at database level.
create or replace function public.create_winning_bid_donation() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'open' and new.status = 'closed' then
    if new.current_bidder is null or new.current_bid is null then raise exception 'A winner and current bid are required before closing'; end if;
    insert into donations (donor_name, amount, date, note) values (new.current_bidder, new.current_bid, current_date, 'Winning bid: ' || new.item_name);
  end if;
  return new;
end; $$;
create trigger bid_closure_creates_donation after update of status on public.bid_items for each row execute function public.create_winning_bid_donation();

-- Phase 1 deliberately uses a shared passcode as an editing deterrent, not authentication.
-- These broad policies are replaced by role-based policies in Phase 2.
alter table public.settings enable row level security;
alter table public.committee_members enable row level security;
alter table public.donations enable row level security;
alter table public.expenses enable row level security;
alter table public.purchases enable row level security;
alter table public.bid_items enable row level security;
alter table public.bid_history enable row level security;
alter table public.awards enable row level security;
alter table public.nominees enable row level security;
alter table public.activities enable row level security;
alter table public.prasad_sponsors enable row level security;
alter table public.volunteers enable row level security;
alter table public.notices enable row level security;
alter table public.gallery_items enable row level security;
do $$ declare tbl text; begin foreach tbl in array array['settings','committee_members','donations','expenses','purchases','bid_items','bid_history','awards','nominees','activities','prasad_sponsors','volunteers','notices','gallery_items'] loop execute format('create policy "phase1 public access" on public.%I for all to anon using (true) with check (true)',tbl); end loop; end $$;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('gallery','gallery',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict (id) do nothing;
create policy "public gallery read" on storage.objects for select to public using (bucket_id='gallery');
create policy "phase1 gallery upload" on storage.objects for insert to anon with check (bucket_id='gallery');
create policy "phase1 gallery delete" on storage.objects for delete to anon using (bucket_id='gallery');
