create extension if not exists "pgcrypto";

alter table if exists public.activities add column if not exists source_type text default 'manual';
alter table if exists public.activities add column if not exists collection_method text;
alter table if exists public.activities add column if not exists collector_run_id uuid;
alter table if exists public.activities add column if not exists external_id text;
alter table if exists public.activities add column if not exists account_name text;
alter table if exists public.activities add column if not exists collected_at timestamptz;
alter table if exists public.activities add column if not exists ai_analyzed_at timestamptz;
alter table if exists public.activities add column if not exists sentiment text;
alter table if exists public.activities add column if not exists confidence_score numeric;

create table if not exists public.collection_sources (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  brand text not null,
  account_name text not null,
  account_id text,
  source_type text not null check (source_type in ('automatic', 'manual')),
  is_enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  last_collected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_runs (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('running', 'completed', 'partial_failed', 'failed')),
  collected_count integer not null default 0,
  inserted_count integer not null default 0,
  duplicate_count integer not null default 0,
  failed_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  intelligence_id uuid references public.activities(id) on delete set null,
  platform text not null,
  source_type text not null check (source_type in ('automatic', 'manual')),
  source_url text,
  raw_data jsonb not null default '{}'::jsonb,
  collection_run_id uuid references public.collection_runs(id) on delete set null,
  processing_status text not null default 'pending' check (processing_status in ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create unique index if not exists collection_items_external_id_idx
  on public.collection_items (external_id)
  where external_id is not null;

create index if not exists collection_items_source_url_idx on public.collection_items (source_url);
create index if not exists collection_items_run_idx on public.collection_items (collection_run_id);
create index if not exists collection_runs_created_at_idx on public.collection_runs (created_at desc);
create index if not exists collection_sources_platform_brand_idx on public.collection_sources (platform, brand);
create index if not exists activities_source_type_idx on public.activities (source_type);
create index if not exists activities_external_id_idx on public.activities (external_id);
create index if not exists activities_collected_at_idx on public.activities (collected_at desc);

alter table public.collection_sources enable row level security;
alter table public.collection_runs enable row level security;
alter table public.collection_items enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.collection_sources to anon, authenticated;
grant select on public.collection_runs to anon, authenticated;
grant select on public.collection_items to anon, authenticated;
grant all privileges on public.collection_sources to service_role;
grant all privileges on public.collection_runs to service_role;
grant all privileges on public.collection_items to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'collection_sources'
      and policyname = 'public read collection sources'
  ) then
    create policy "public read collection sources"
    on public.collection_sources for select
    to anon, authenticated
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'collection_runs'
      and policyname = 'public read collection runs'
  ) then
    create policy "public read collection runs"
    on public.collection_runs for select
    to anon, authenticated
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'collection_items'
      and policyname = 'public read collection items'
  ) then
    create policy "public read collection items"
    on public.collection_items for select
    to anon, authenticated
    using (true);
  end if;
end $$;
