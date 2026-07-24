import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { BrandVisual } from "@/components/brand-visual";
import { GlassCard, Shell } from "@/components/ui";
import { getActivityWindow } from "@/lib/activity-metadata";
import { getActivity } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ActivityDetailPage({ params }: { params: { id: string } }) {
  const activity = await getActivity(params.id);
  if (!activity) notFound();
  const coverImage = activity.image_url || activity.screenshot_urls?.[0];
  const activityWindow = getActivityWindow(activity);
  const collectionMethod = activity.source_type === "automatic" || ["微信公众号", "微博"].includes(activity.platform)
    ? "Automatic Collection"
    : activity.source_type === "manual" || ["小红书", "微信小程序"].includes(activity.platform)
      ? "Manual Upload"
      : activity.is_demo ? "Demo Mode" : activity.collection_method || "Manual Upload";

  return (
    <Shell className="pb-20 pt-12">
      <article className="mx-auto max-w-5xl">
        <Link
          href={`/brands/${encodeURIComponent(activity.brand)}`}
          className="mb-8 inline-flex h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-ink shadow-sm ring-1 ring-black/[0.06] transition hover:bg-neutral-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回品牌详情
        </Link>
        <div className="mb-8 flex flex-wrap items-center gap-3 text-sm font-semibold text-neutral-500">
          <span className="rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-black/[0.06]">{activity.category}</span>
          <span className="rounded-full bg-blue-50 px-4 py-2 text-blue-800 ring-1 ring-blue-100">{collectionMethod}</span>
          <span>{activity.brand}</span>
          <span>{activity.platform}</span>
          <span>{formatDate(activity.publish_date)}</span>
          <span>上传人：{activity.created_by || "未记录"}</span>
          <span>上传时间：{formatDate(activity.created_at)}</span>
        </div>
        <h1 className="text-balance text-5xl font-semibold tracking-tight text-ink md:text-7xl">{activity.title}</h1>
        <p className="mt-7 text-2xl leading-10 text-neutral-600">{activity.summary}</p>

        {activity.is_demo ? (
          <div className="mt-8 rounded-[28px] bg-blue-50 px-6 py-4 text-sm font-semibold leading-6 text-blue-950 ring-1 ring-blue-100">
            Demo Mode：本条为模拟情报，仅用于产品功能演示，不代表真实市场事实或真实抓取结果。
          </div>
        ) : null}

        <BrandVisual
          brand={activity.brand}
          src={coverImage}
          alt={activity.title}
          className="mt-12 aspect-video rounded-[44px] shadow-apple ring-1 ring-black/[0.06]"
        />

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">为什么重要</p>
            <p className="mt-4 text-xl leading-9 text-ink">{activity.why_it_matters}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">建议娇韵诗如何应对</p>
            <p className="mt-4 text-xl leading-9 text-ink">{activity.suggested_action_for_clarins}</p>
          </GlassCard>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-3">
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">产品名</p>
            <p className="mt-3 text-lg font-semibold text-ink">{activity.product_name || "未明确"}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">Campaign 名称</p>
            <p className="mt-3 text-lg font-semibold text-ink">{activity.campaign_name || "未明确"}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">重要性评分</p>
            <p className="mt-3 text-lg font-semibold text-ink">{activity.importance_score}/10</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">折扣/权益</p>
            <p className="mt-3 text-lg font-semibold text-ink">{activity.discount || "未提及"}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">采集方式</p>
            <p className="mt-3 text-lg font-semibold text-ink">{collectionMethod}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">原始平台</p>
            <p className="mt-3 text-lg font-semibold text-ink">{activity.platform}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">采集时间</p>
            <p className="mt-3 text-lg font-semibold text-ink">{activity.collected_at ? formatDate(activity.collected_at) : formatDate(activity.created_at)}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">AI 分析时间</p>
            <p className="mt-3 text-lg font-semibold text-ink">{activity.ai_analyzed_at ? formatDate(activity.ai_analyzed_at) : formatDate(activity.updated_at)}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">分析状态</p>
            <p className="mt-3 text-lg font-semibold text-ink">{activity.ai_status || "未记录"}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">情绪 / 置信度</p>
            <p className="mt-3 text-lg font-semibold text-ink">{activity.sentiment || "neutral"} · {activity.confidence_score ? `${Math.round(activity.confidence_score * 100)}%` : "未记录"}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">活动开始时间</p>
            <p className="mt-3 text-lg font-semibold text-ink">{activityWindow.start}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">活动结束时间</p>
            <p className="mt-3 text-lg font-semibold text-ink">{activityWindow.end}</p>
          </GlassCard>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">目标人群</p>
            <p className="mt-3 text-lg leading-8 text-ink">{activity.target_audience || "未明确"}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">营销策略</p>
            <p className="mt-3 text-lg leading-8 text-ink">{activity.marketing_strategy || "未明确"}</p>
          </GlassCard>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">情报正文</p>
            <p className="mt-3 text-base leading-8 text-ink">{activity.raw_text || "未提供原始正文。"}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-semibold text-neutral-500">核心关键词</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(activity.tags || []).map((tag) => (
                <span key={tag} className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-ink">
                  {tag}
                </span>
              ))}
            </div>
          </GlassCard>
        </section>

        {activity.screenshot_urls?.length ? (
          <section className="mt-10">
            <p className="mb-4 text-sm font-semibold text-neutral-500">用户上传截图</p>
            <div className="grid gap-4 md:grid-cols-4">
              {activity.screenshot_urls.map((src, index) => (
                <BrandVisual
                  key={src.slice(0, 40) + index}
                  brand={activity.brand}
                  src={src}
                  alt={`小红书截图 ${index + 1}`}
                  className="aspect-square rounded-[28px] shadow-apple ring-1 ring-black/[0.06]"
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-10">
          <a
            href={activity.source_url}
            target="_blank"
            className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-sm font-semibold text-white transition hover:bg-black"
          >
            打开原文链接 <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </div>
      </article>
    </Shell>
  );
}
