-- Phase 3: browser push subscriptions and deduplicated reminder deliveries.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.push_deliveries (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  sent_at timestamptz not null default now(),
  unique(activity_id, subscription_id)
);
alter table public.push_subscriptions enable row level security;
alter table public.push_deliveries enable row level security;
-- Client access is intentionally denied. Vercel server routes use service role.
create policy "users read own subscriptions" on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
