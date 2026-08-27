-- Add pinned column to donations for highlighting special contributors in Overview
alter table public.donations add column if not exists pinned boolean not null default false;

