-- Boss demo upgrade migration.
-- Run this in Supabase SQL Editor before initializing demo data.

alter table if exists public.activities add column if not exists discount text not null default '未提及';
alter table if exists public.activities add column if not exists ai_status text not null default '已完成';
alter table if exists public.activities add column if not exists is_demo boolean not null default false;
alter table if exists public.activities add column if not exists created_by text;
alter table if exists public.activities add column if not exists updated_by text;

alter table if exists public.activities drop constraint if exists activities_platform_check;
alter table if exists public.activities drop constraint if exists activities_category_check;

update public.activities
set
  category = case
    when category = '新品上市' then '新品'
    when category = '最新 Campaign' then 'Campaign'
    when category = '大型促销' then '促销'
    else category
  end,
  discount = coalesce(discount, '未提及'),
  ai_status = coalesce(ai_status, '已完成'),
  is_demo = coalesce(is_demo, false),
  updated_by = coalesce(updated_by, created_by);

alter table if exists public.activities
  add constraint activities_platform_check
  check (platform in ('小红书', '微信公众号', '微博', '品牌官网'));

alter table if exists public.activities
  add constraint activities_category_check
  check (category in ('新品', 'Campaign', '促销', '明星合作', '节日营销', '其他品牌动态'));

create index if not exists activities_created_by_idx on public.activities (created_by);
create index if not exists activities_is_demo_idx on public.activities (is_demo);
