-- ==============================================================================
-- VINAYAKA VEDIKA 2026 - COMPLETE MASTER DATABASE SCHEMA & MIGRATIONS
-- Run this script in the Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- ==============================================================================

create extension if not exists pgcrypto;

-- 1. SETTINGS TABLE
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean unique not null default true check (singleton),
  village_name text default 'Vinayaka Vedika',
  tagline text default 'Our village celebration, in one place.',
  festival_date date default '2026-09-14',
  upi_id text,
  morning_aarti_time time default '06:30:00',
  evening_aarti_time time default '19:30:00',
  daily_schedule_note text default 'Daily Pooja & Maha Harathi every morning & evening.',
  google_drive_folder_url text,
  google_drive_upload_url text default 'https://script.google.com/macros/s/AKfycbw3O382NowkBlPVFSfGbMEOM5SOw453GXbYLJQl5pmpFSTBfEHIvV2ok5UvoHH-wgIkEA/exec',
  em_doctor_name text,
  em_doctor_phone text,
  em_police_phone text,
  em_coord_name text,
  em_coord_phone text,
  committee_passcode text default 'admin123',
  created_at timestamptz not null default now()
);

-- 2. CORE TABLES
create table if not exists public.committee_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  phone text not null,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_name text not null,
  amount numeric(12,2) not null check(amount > 0),
  date date not null default current_date,
  note text,
  phone text,
  payment_mode text default 'Cash',
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  amount numeric(12,2) not null check(amount > 0),
  date date not null default current_date,
  paid_to text not null,
  payment_mode text default 'Cash',
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  item text not null,
  category text not null,
  cost numeric(12,2) not null check(cost >= 0),
  year integer not null default 2026,
  reusable boolean not null default true,
  condition_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.bid_items (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  description text,
  starting_bid numeric(12,2) not null check(starting_bid > 0),
  current_bid numeric(12,2),
  current_bidder text,
  status text not null default 'open' check(status in ('open','closed')),
  date date default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.bid_history (
  id uuid primary key default gen_random_uuid(),
  bid_item_id uuid not null references public.bid_items(id) on delete cascade,
  bidder text not null,
  amount numeric(12,2) not null check(amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.awards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  recipient text not null,
  year integer not null default 2026,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.nominees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  note text,
  photo_url text,
  votes integer not null default 0 check(votes >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null default current_date,
  start_time time,
  end_time time,
  location text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.prasad_sponsors (
  id uuid primary key default gen_random_uuid(),
  sponsor_name text not null,
  date date not null default current_date,
  item text not null,
  note text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.volunteers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duty text not null,
  date date not null default current_date,
  contact text,
  shift_time text,
  created_at timestamptz not null default now()
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  date date not null default current_date,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check(type in ('photo','video')),
  url text not null,
  caption text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.music_playlist (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text default 'Traditional Devotional',
  platform text default 'youtube',
  url text not null,
  thumbnail text,
  added_by text default 'Committee',
  language text default 'Telugu',
  plays integer default 0,
  created_at timestamptz not null default now()
);

-- 3. BID CLOSURE TRIGGER
create or replace function public.create_winning_bid_donation() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'open' and new.status = 'closed' then
    if new.current_bidder is null or new.current_bid is null then
      raise exception 'A winner and current bid are required before closing';
    end if;
    insert into donations (donor_name, amount, date, note)
    values (new.current_bidder, new.current_bid, current_date, 'Winning bid: ' || new.item_name);
  end if;
  return new;
end; $$;

drop trigger if exists bid_closure_creates_donation on public.bid_items;
create trigger bid_closure_creates_donation after update of status on public.bid_items for each row execute function public.create_winning_bid_donation();

-- 4. PASSCODE VERIFICATION RPC
create or replace function public.verify_admin_passcode(candidate text)
returns boolean
language plpgsql
security definer
as $$
declare
  stored_passcode text;
begin
  select committee_passcode into stored_passcode from public.settings limit 1;
  if stored_passcode is null or stored_passcode = '' then
    stored_passcode := 'admin123';
  end if;
  return candidate = stored_passcode;
end;
$$;

create or replace function public.set_admin_passcode(new_passcode text)
returns boolean
language plpgsql
security definer
as $$
begin
  if length(new_passcode) < 6 then
    raise exception 'Passcode must be at least 6 characters.';
  end if;
  update public.settings set committee_passcode = new_passcode;
  return true;
end;
$$;

-- 5. ROW LEVEL SECURITY & PUBLIC ACCESS
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
alter table public.music_playlist enable row level security;

do $$
declare tbl text;
begin
  foreach tbl in array array[
    'settings','committee_members','donations','expenses','purchases',
    'bid_items','bid_history','awards','nominees','activities',
    'prasad_sponsors','volunteers','notices','gallery_items','music_playlist'
  ] loop
    execute format('drop policy if exists "phase1 public access" on public.%I', tbl);
    execute format('create policy "phase1 public access" on public.%I for all to anon using (true) with check (true)', tbl);
  end loop;
end $$;

-- 6. DEFAULT SEED ROW IN SETTINGS
insert into public.settings (village_name, tagline, festival_date, morning_aarti_time, evening_aarti_time, daily_schedule_note, committee_passcode)
values ('Vinayaka Vedika', 'Our village celebration, in one place.', '2026-09-14', '06:30:00', '19:30:00', 'Daily Pooja & Maha Harathi every morning & evening.', 'admin123')
on conflict (singleton) do nothing;
