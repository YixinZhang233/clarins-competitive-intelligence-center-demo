import { ArrowRight, Database, RadioTower, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { ActivityCard } from "@/components/activity-card";
import { BrandCard } from "@/components/brand-card";
import { CountUp } from "@/components/count-up";
import { EmptyState, LinkButton, SectionTitle, Shell } from "@/components/ui";
import { BRANDS, CATEGORIES, DEMO_USERS, PLATFORMS } from "@/lib/constants";
import { demoToday, isPromotion } from "@/lib/activity-metadata";
import { getCollectionMode } from "@/lib/collectors";
import { getActivities, isSupabaseConfigured } from "@/lib/supabase";
import { groupActivitiesByBrand } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams
}: {
  searchParams?: { q?: string; brand?: string; category?: string; platform?: string; createdBy?: string; from?: string; to?: string };
}) {
  const activities = await getActivities();
  const groups = groupActivitiesByBrand(activities, BRANDS);
  const filtered = filterActivities(activities, searchParams || {});
  const featured = [...activities].sort((a, b) => b.importance_score - a.importance_score).slice(0, 3);
  const stats = buildStats(activities);
  const collectionMode = getCollectionMode();
  const todayUpdates = buildTodayUpdates(activities, collectionMode);
  const keywords = topKeywords(activities);

  return (
    <Shell className="pb-20 pt-16">
      <section className="relative overflow-hidden rounded-[48px] bg-white/80 p-6 shadow-apple ring-1 ring-black/[0.06] backdrop-blur-xl md:p-10">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(255,255,255,.96),rgba(245,247,250,.74))]" />
        <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-neutral-600 shadow-sm ring-1 ring-black/[0.06]">
              <Sparkles className="h-4 w-4" />
              Demo Mode · AI Competitive Intelligence
            </div>
            <h1 className="text-balance text-5xl font-semibold tracking-tight text-ink md:text-7xl">
              Clarins Competitive Intelligence Center
            </h1>
            <p className="mt-7 max-w-3xl text-xl leading-9 text-neutral-600">
              Automatically collect competitor content from WeChat Official Accounts and Weibo, support manual uploads for Xiaohongshu and Mini Programs, and generate AI-powered competitive intelligence reports.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-semibold text-neutral-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-neutral-50 px-4 py-2 ring-1 ring-black/[0.06]">
                <RadioTower className="h-4 w-4" />
                Last Updated
              </span>
              <span>Today 09:00</span>
              <span className="text-neutral-400">·</span>
              <span>{collectionMode === "demo" ? "Updated from Demo Collection" : "Updated from Live Collection"}</span>
            </div>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <LinkButton href="/batch">批量导入小红书链接</LinkButton>
            <LinkButton href="/add" variant="secondary">单条添加</LinkButton>
            <LinkButton href="#brands" variant="secondary">
              查看品牌情报 <ArrowRight className="ml-2 h-4 w-4" />
            </LinkButton>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <HeroMetric label="Brands Monitored" value={6} />
            <HeroMetric label="Intelligence Records" value={Math.max(48, stats.total)} suffix="+" />
            <HeroMetric label="Data Sources" value={4} />
            <HeroMetric label="AI Analysis" value="Enabled" icon={<Database className="h-5 w-5" />} />
          </div>
        </div>
      </section>

      {!isSupabaseConfigured() ? (
        <div className="mt-10 rounded-[32px] bg-amber-50 p-6 text-amber-900 ring-1 ring-amber-200">
        <p className="font-semibold">本地演示模式已启用</p>
          <p className="mt-2 text-sm leading-6">
            当前未连接远程数据库，系统会自动使用内置 Demo 模拟情报完成首页、品牌详情、报告和导出展示。
          </p>
        </div>
      ) : null}

      <div className="mt-10 rounded-[28px] bg-blue-50 px-6 py-4 text-sm font-semibold leading-6 text-blue-950 ring-1 ring-blue-100">
        当前展示内容仅用于产品功能演示，不代表真实市场情报。
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="情报总数" value={stats.total} />
        <StatCard label="本周新增" value={stats.weekly} />
        <StatCard label="新品数量" value={stats.products} />
        <StatCard label="Campaign 数量" value={stats.campaigns} />
        <StatCard label="促销数量" value={stats.promotions} />
        <StatCard label="活跃品牌数" value={stats.activeBrands} />
      </section>

      <section className="mt-10 rounded-[32px] bg-white p-6 shadow-apple ring-1 ring-black/[0.06]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
          <p className="text-sm font-semibold text-neutral-500">Today&apos;s Updates</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Collection and upload activity</h2>
          </div>
          <LinkButton href="/collection" variant="secondary">进入数据采集</LinkButton>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <MiniMetric label="微信公众号" value={todayUpdates.wechat} suffix=" new" />
          <MiniMetric label="微博" value={todayUpdates.weibo} suffix=" new" />
          <MiniMetric label="小红书" value={todayUpdates.xhsManual} suffix=" uploaded" />
          <MiniMetric label="微信小程序" value={todayUpdates.miniProgramManual} suffix=" uploaded" />
        </div>
      </section>

      <section id="brands" className="mt-20">
        <SectionTitle
          eyebrow="竞品品牌"
          title="六个重点品牌，一眼看到最新动向。"
            subtitle="每个品牌卡片聚合最新新品、Campaign、大促和其他品牌动态。当前内容均为明确标记的模拟情报。"
        />
        <div className="grid gap-8">
          {groups.map((group) => (
            <BrandCard key={group.brand} group={group} />
          ))}
        </div>
      </section>

      {!activities.length ? (
        <section className="mt-16">
          <EmptyState action={<LinkButton href="/add">添加第一条小红书真实链接</LinkButton>} />
        </section>
      ) : (
        <>
          <section className="mt-20">
            <SectionTitle
              eyebrow="重点关注"
              title="最新竞品信号"
              subtitle="按重要性排序，展示用户录入、批量导入或 Demo 初始化的竞品资料与 AI 分析结果。"
            />
            <div className="grid gap-6 lg:grid-cols-3">
              {featured.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} featured />
              ))}
            </div>
          </section>

          <section className="mt-20 grid gap-8 lg:grid-cols-[1.3fr_.7fr]">
            <div>
              <SectionTitle title="近期动态时间线" subtitle="按发布时间展示最近 8 条竞品动作，适合晨会快速浏览。" />
              <div className="space-y-4">
                {activities.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="rounded-[28px] bg-white p-5 shadow-apple ring-1 ring-black/[0.06]">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-500">
                      <span>{activity.publish_date}</span>
                      <span>{activity.brand}</span>
                      <span>{activity.platform}</span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-ink">{activity.category}</span>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-ink">{activity.title}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-600">{activity.summary}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <SectionTitle title="热门关键词" subtitle="从当前情报标签中自动聚合。" />
              <div className="rounded-[32px] bg-white p-6 shadow-apple ring-1 ring-black/[0.06]">
                <div className="flex flex-wrap gap-3">
                  {keywords.map(({ keyword, count }) => (
                    <span key={keyword} className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-ink">
                      {keyword} · {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-24">
            <SectionTitle title="全部活动流" subtitle="支持按品牌、平台、分类、上传人、关键词和时间筛选。" />
            <SearchFilters searchParams={searchParams || {}} />
            {!filtered.length ? (
              <div className="mt-8">
                <EmptyState title="没有匹配的竞品资料" subtitle="请调整搜索词或筛选条件。" />
              </div>
            ) : null}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </section>
        </>
      )}
    </Shell>
  );
}

function SearchFilters({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  return (
    <form className="mt-8 rounded-[32px] bg-white/80 p-5 shadow-apple ring-1 ring-black/[0.06] backdrop-blur-xl">
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_.8fr_.8fr_auto]">
        <input name="q" defaultValue={searchParams.q || ""} placeholder="搜索品牌、产品、Campaign 或关键词" className={filterClass} />
        <select name="brand" defaultValue={searchParams.brand || ""} className={filterClass}>
          <option value="">全部品牌</option>
          {BRANDS.map((brand) => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
        <select name="category" defaultValue={searchParams.category || ""} className={filterClass}>
          <option value="">全部分类</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select name="platform" defaultValue={searchParams.platform || ""} className={filterClass}>
          <option value="">全部平台</option>
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>{platform}</option>
          ))}
        </select>
        <select name="createdBy" defaultValue={searchParams.createdBy || ""} className={filterClass}>
          <option value="">全部上传人</option>
          {DEMO_USERS.map((user) => (
            <option key={user} value={user}>{user}</option>
          ))}
        </select>
        <input type="date" name="from" defaultValue={searchParams.from || ""} className={filterClass} />
        <input type="date" name="to" defaultValue={searchParams.to || ""} className={filterClass} />
        <button className="h-12 rounded-full bg-ink px-6 text-sm font-semibold text-white transition hover:bg-black">筛选</button>
      </div>
    </form>
  );
}

const filterClass = "h-12 rounded-2xl bg-neutral-50 px-4 text-sm text-ink outline-none ring-1 ring-black/[0.06] transition focus:bg-white focus:ring-black/20";

function filterActivities(
  activities: Awaited<ReturnType<typeof getActivities>>,
  params: { q?: string; brand?: string; category?: string; platform?: string; createdBy?: string; from?: string; to?: string }
) {
  const q = (params.q || "").trim().toLowerCase();
  return activities.filter((activity) => {
    const haystack = [
      activity.brand,
      activity.title,
      activity.product_name,
      activity.campaign_name,
      activity.summary,
      activity.marketing_strategy,
      activity.raw_text,
      activity.tags?.join(" ")
    ].join(" ").toLowerCase();
    if (q && !haystack.includes(q)) return false;
    if (params.brand && activity.brand !== params.brand) return false;
    if (params.category && activity.category !== params.category) return false;
    if (params.platform && activity.platform !== params.platform) return false;
    if (params.createdBy && activity.created_by !== params.createdBy) return false;
    if (params.from && activity.publish_date < params.from) return false;
    if (params.to && activity.publish_date > params.to) return false;
    return true;
  });
}

function HeroMetric({ label, value, suffix = "", icon }: { label: string; value: number | string; suffix?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-[30px] bg-white/90 p-6 shadow-sm ring-1 ring-black/[0.06]">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-900 text-white">
        {icon || <Sparkles className="h-5 w-5" />}
      </div>
      <p className="text-sm font-semibold text-neutral-500">{label}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-ink">
        {typeof value === "number" ? <CountUp value={value} suffix={suffix} /> : value}
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-apple ring-1 ring-black/[0.06]">
      <p className="text-sm font-semibold text-neutral-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink"><CountUp value={value} /></p>
    </div>
  );
}

function MiniMetric({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-3xl bg-neutral-50 p-4">
      <p className="text-sm font-semibold text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink"><CountUp value={value} suffix={suffix} /></p>
    </div>
  );
}

function buildStats(activities: Awaited<ReturnType<typeof getActivities>>) {
  const now = demoToday();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  return {
    total: activities.length,
    weekly: activities.filter((activity) => new Date(activity.publish_date) >= weekAgo).length,
    products: activities.filter((activity) => activity.category === "新品").length,
    campaigns: activities.filter((activity) => activity.category === "Campaign").length,
    promotions: activities.filter((activity) => isPromotion(activity.category)).length,
    activeBrands: new Set(activities.map((activity) => activity.brand)).size
  };
}

function topKeywords(activities: Awaited<ReturnType<typeof getActivities>>) {
  const counts = new Map<string, number>();
  for (const activity of activities) {
    for (const tag of activity.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([keyword, count]) => ({ keyword, count }));
}

function buildTodayUpdates(activities: Awaited<ReturnType<typeof getActivities>>, mode: "demo" | "live") {
  const today = "2026-07-23";
  const updates = {
    wechat: activities.filter((activity) => activity.platform === "微信公众号" && activity.source_type === "automatic" && activity.publish_date === today).length,
    weibo: activities.filter((activity) => activity.platform === "微博" && activity.source_type === "automatic" && activity.publish_date === today).length,
    xhsManual: activities.filter((activity) => activity.platform === "小红书" && activity.source_type === "manual" && activity.publish_date === today).length,
    miniProgramManual: activities.filter((activity) => activity.platform === "微信小程序" && activity.source_type === "manual" && activity.publish_date === today).length
  };
  if (mode === "demo" && updates.wechat + updates.weibo + updates.xhsManual + updates.miniProgramManual === 0) {
    return { wechat: 12, weibo: 8, xhsManual: 3, miniProgramManual: 2 };
  }
  return updates;
}
