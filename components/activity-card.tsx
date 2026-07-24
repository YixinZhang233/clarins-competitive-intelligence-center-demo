import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { BrandVisual } from "@/components/brand-visual";
import type { Activity } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ActivityCard({ activity, featured = false }: { activity: Activity; featured?: boolean }) {
  const coverImage = activity.image_url || activity.screenshot_urls?.[0];
  const sourceLabel = getSourceLabel(activity);

  return (
    <article className="group overflow-hidden rounded-[32px] bg-white shadow-apple ring-1 ring-black/[0.06] transition duration-500 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(17,24,39,.12)]">
      <Link href={`/activities/${activity.id}`} className="block">
        <BrandVisual
          brand={activity.brand}
          src={coverImage}
          alt={activity.title}
          className="aspect-video rounded-none"
          imageClassName="transition duration-700 group-hover:scale-105"
        />
        <div className="p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-500">
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-ink">{activity.category}</span>
            <span className={sourceBadgeClass(sourceLabel)}>{sourceLabel}</span>
            {activity.is_demo ? <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-800">Demo Mode</span> : null}
            <span>{activity.brand}</span>
            <span>{activity.platform}</span>
            <span>{formatDate(activity.publish_date)}</span>
          </div>
          <h3 className="text-2xl font-semibold leading-tight tracking-tight text-ink">{activity.title}</h3>
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-600">{activity.summary}</p>
          <div className="mt-5 rounded-3xl bg-neutral-50 p-4">
            <p className="text-xs font-semibold text-neutral-500">建议娇韵诗如何应对</p>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-700">
              {activity.suggested_action_for_clarins}
            </p>
          </div>
          {activity.target_audience || activity.marketing_strategy ? (
            <div className="mt-4 grid gap-3 text-xs leading-5 text-neutral-600">
              <p>
                <span className="font-semibold text-ink">目标人群：</span>
                {activity.target_audience || "未明确"}
              </p>
              <p>
                <span className="font-semibold text-ink">营销策略：</span>
                {activity.marketing_strategy || "未明确"}
              </p>
            </div>
          ) : null}
          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="font-semibold text-ink">重要性 {activity.importance_score}/10</span>
            <span className="inline-flex items-center gap-1 font-semibold text-neutral-500">
              查看详情 <ExternalLink className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-3 text-xs font-medium text-neutral-500">
            上传人：{activity.created_by || "未记录"} · 上传时间：{formatDate(activity.created_at)}
          </p>
        </div>
      </Link>
    </article>
  );
}

function getSourceLabel(activity: Activity) {
  if (activity.source_type === "automatic" || ["微信公众号", "微博"].includes(activity.platform)) return "Automatic Collection";
  if (activity.source_type === "manual" || ["小红书", "微信小程序"].includes(activity.platform)) return "Manual Upload";
  if (activity.is_demo) return "Demo Mode";
  if (activity.collection_method) return activity.collection_method;
  return "Manual Upload";
}

function sourceBadgeClass(label: string) {
  if (label === "Automatic Collection") return "rounded-full bg-emerald-50 px-3 py-1 text-emerald-700";
  if (label === "Manual Upload") return "rounded-full bg-violet-50 px-3 py-1 text-violet-700";
  return "rounded-full bg-blue-50 px-3 py-1 text-blue-800";
}
