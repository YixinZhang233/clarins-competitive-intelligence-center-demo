create extension if not exists "pgcrypto";

create table if not exists public.batch_imports (
  id uuid primary key default gen_random_uuid(),
  total_links integer not null default 0,
  success_count integer not null default 0,
  needs_manual_count integer not null default 0,
  failed_count integer not null default 0,
  created_by text,
  default_brand text,
  default_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.batch_imports(id) on delete set null,
  brand text not null,
  platform text not null default '小红书' check (platform in ('小红书', '微信公众号', '微博', '品牌官网')),
  source_url text not null,
  title text not null,
  publish_date date not null,
  raw_text text not null,
  image_url text,
  screenshot_urls text[] not null default '{}',
  notes text,
  category text not null check (category in ('新品', 'Campaign', '促销', '明星合作', '节日营销', '其他品牌动态')),
  product_name text,
  campaign_name text,
  discount text not null default '未提及',
  summary text not null,
  key_points text[] not null default '{}',
  target_audience text not null default '',
  marketing_strategy text not null default '',
  why_it_matters text not null,
  suggested_action_for_clarins text not null,
  importance_score numeric not null check (importance_score >= 1 and importance_score <= 10),
  tags text[] not null default '{}',
  collection_status text not null default '已保存',
  ai_status text not null default '已完成',
  is_demo boolean not null default false,
  created_by text,
  created_at timestamptz not null default now(),
  updated_by text,
  updated_at timestamptz not null default now()
);

alter table if exists public.activities add column if not exists batch_id uuid references public.batch_imports(id) on delete set null;
alter table if exists public.activities add column if not exists screenshot_urls text[] not null default '{}';
alter table if exists public.activities add column if not exists target_audience text not null default '';
alter table if exists public.activities add column if not exists marketing_strategy text not null default '';
alter table if exists public.activities add column if not exists collection_status text not null default '已保存';
alter table if exists public.activities add column if not exists discount text not null default '未提及';
alter table if exists public.activities add column if not exists ai_status text not null default '已完成';
alter table if exists public.activities add column if not exists is_demo boolean not null default false;
alter table if exists public.activities add column if not exists created_by text;
alter table if exists public.activities add column if not exists updated_by text;

create table if not exists public.batch_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batch_imports(id) on delete cascade,
  source_url text not null,
  status text not null check (status in ('已完成', '需要人工补充正文', '链接无效', '页面不可访问', 'AI分析失败', '已保存')),
  brand text,
  title text,
  publish_date date,
  raw_text text,
  image_url text,
  summary text,
  error_message text,
  activity_id uuid references public.activities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists activities_brand_idx on public.activities (brand);
create index if not exists activities_batch_id_idx on public.activities (batch_id);
create index if not exists activities_publish_date_idx on public.activities (publish_date desc);
create index if not exists activities_category_idx on public.activities (category);
create index if not exists activities_created_by_idx on public.activities (created_by);
create index if not exists activities_is_demo_idx on public.activities (is_demo);
create index if not exists batch_items_batch_id_idx on public.batch_items (batch_id);
create index if not exists batch_imports_created_at_idx on public.batch_imports (created_at desc);

alter table public.activities enable row level security;
alter table public.batch_imports enable row level security;
alter table public.batch_items enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.activities to anon, authenticated;
grant select on public.batch_imports to anon, authenticated;
grant select on public.batch_items to anon, authenticated;
grant all privileges on public.activities to service_role;
grant all privileges on public.batch_imports to service_role;
grant all privileges on public.batch_items to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'activities'
      and policyname = 'public read activities'
  ) then
    create policy "public read activities"
    on public.activities for select
    to anon, authenticated
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'batch_imports'
      and policyname = 'public read batch imports'
  ) then
    create policy "public read batch imports"
    on public.batch_imports for select
    to anon, authenticated
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'batch_items'
      and policyname = 'public read batch items'
  ) then
    create policy "public read batch items"
    on public.batch_items for select
    to anon, authenticated
    using (true);
  end if;
end $$;

-- Writes should go through Next.js API routes using SUPABASE_SERVICE_ROLE_KEY.
