import { notFound } from "next/navigation";
import { ActivityCard } from "@/components/activity-card";
import { BrandLogo } from "@/components/brand-logo";
import { BrandVisual } from "@/components/brand-visual";
import { EmptyState, LinkButton, SectionTitle, Shell, GlassCard } from "@/components/ui";
import { BRAND_ASSETS, BRANDS } from "@/lib/constants";
import { isPromotion } from "@/lib/activity-metadata";
import { getActivities } from "@/lib/supabase";
import { formatDate, latestByCategory } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BrandDetailPage({ params }: { params: { brand: string } }) {
  const brand = decodeURIComponent(params.brand);
  if (!BRANDS.includes(brand as never)) notFound();

  const activities = (await getActivities()).filter((activity) => activity.brand === brand);
  const latestProduct = latestByCategory(activities, "新品");
  const latestCampaign = latestByCategory(activities, "Campaign");
  const latestPromotion = latestByCategory(activities, "促销活动") || latestByCategory(activities, "促销");
  const latestUpdate = latestByCategory(activities, "其他品牌动态");
  const top = [...activities].sort((a, b) => b.importance_score - a.importance_score)[0];
  const asset = BRAND_ASSETS[brand];
  const bannerImage = top?.image_url || top?.screenshot_urls?.[0] || asset?.visual;
  const latestTimestamp = [...activities]
    .map((activity) => activity.updated_at || activity.publish_date)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <Shell className="pb-20 pt-16">
      <section className="overflow-hidden rounded-[48px] bg-white shadow-apple ring-1 ring-black/[0.06]">
        <div className="grid lg:grid-cols-[.88fr_1.12fr]">
          <div className="p-8 md:p-14">
            <div className="mb-8 inline-flex h-11 items-center rounded-full bg-neutral-100 px-4">
              <BrandLogo brand={brand} className="max-h-6 max-w-[180px]" />
            </div>
            <p className="mb-4 text-sm font-semibold text-neutral-500">品牌竞品情报</p>
            <h1 className="text-5xl font-semibold tracking-tight text-ink md:text-7xl">{brand}</h1>
            <p className="mt-3 text-lg font-medium text-neutral-500">{asset?.englishName}</p>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-600">
              {asset?.description || "最新新品、Campaign、促销、品牌动态时间线、AI 竞品分析与建议动作。"}
            </p>
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-5">
              <BannerMetric label="情报总数" value={activities.length ? `${activities.length}` : "0"} />
              <BannerMetric label="新品数量" value={`${activities.filter((item) => item.category === "新品").length}`} />
              <BannerMetric label="Campaign" value={`${activities.filter((item) => item.category === "Campaign").length}`} />
              <BannerMetric label="促销数量" value={`${activities.filter((item) => isPromotion(item.category)).length}`} />
              <BannerMetric label="最近更新" value={latestTimestamp ? formatDate(latestTimestamp) : "暂无"} />
            </div>
          </div>
          <BrandVisual brand={brand} src={bannerImage} alt={`${brand} 品牌详情视觉`} className="min-h-[380px] rounded-none lg:min-h-full" />
        </div>
      </section>

      {!activities.length ? (
        <section className="mt-12">
          <EmptyState
            title={`${brand} 暂无竞品资料`}
            subtitle="请先添加该品牌的小红书真实链接、正文或截图。"
            action={<LinkButton href="/add">添加竞品资料</LinkButton>}
          />
        </section>
      ) : (
        <>
          <section className="mt-16 grid gap-6 md:grid-cols-2">
            <ActivitySlot title="最新新品" activity={latestProduct} />
            <ActivitySlot title="最新 Campaign" activity={latestCampaign} />
            <ActivitySlot title="促销" activity={latestPromotion} />
            <ActivitySlot title="最近动态" activity={latestUpdate} />
          </section>

          {top ? (
            <section className="mt-16 grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
              <GlassCard>
                <p className="text-sm font-semibold text-neutral-500">AI 竞品分析</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink">{top.title}</h2>
                <p className="mt-5 leading-8 text-neutral-600">{top.why_it_matters}</p>
              </GlassCard>
              <GlassCard>
                <p className="text-sm font-semibold text-neutral-500">建议动作</p>
                <p className="mt-4 text-2xl font-semibold leading-10 text-ink">{top.suggested_action_for_clarins}</p>
                <a href={top.source_url} target="_blank" className="mt-6 inline-flex text-sm font-semibold text-neutral-500">
                  打开原文链接 ↗
                </a>
              </GlassCard>
            </section>
          ) : null}

          <section className="mt-20">
            <SectionTitle title="品牌动态时间线" subtitle="按发布时间排序的模拟情报记录，均用于产品功能演示。" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </section>
        </>
      )}
    </Shell>
  );
}

function BannerMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-neutral-50 p-4">
      <p className="text-lg font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-xs font-medium text-neutral-500">{label}</p>
    </div>
  );
}

function ActivitySlot({ title, activity }: { title: string; activity?: Awaited<ReturnType<typeof latestByCategory>> }) {
  return (
    <GlassCard>
      <p className="text-sm font-semibold text-neutral-500">{title}</p>
      {activity ? (
        <div className="mt-4">
          <h3 className="text-2xl font-semibold leading-tight text-ink">{activity.title}</h3>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-600">{activity.summary}</p>
          <p className="mt-4 text-xs font-medium text-neutral-500">{activity.platform} · {activity.publish_date}</p>
        </div>
      ) : (
        <p className="mt-4 text-neutral-500">暂无资料</p>
      )}
    </GlassCard>
  );
}
