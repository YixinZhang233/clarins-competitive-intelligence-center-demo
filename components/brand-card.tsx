import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { BrandVisual } from "@/components/brand-visual";
import { BRAND_ASSETS } from "@/lib/constants";
import { isPromotion } from "@/lib/activity-metadata";
import type { Activity, BrandGroup } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const slots: Array<[keyof BrandGroup, string]> = [
  ["latestProduct", "最新新品"],
  ["latestCampaign", "最新 Campaign"],
  ["latestPromotion", "促销"],
  ["latestUpdate", "其他品牌动态"]
];

export function BrandCard({ group }: { group: BrandGroup }) {
  const hero = group.latestProduct || group.latestCampaign || group.latestPromotion || group.latestUpdate;
  const asset = BRAND_ASSETS[group.brand];
  const heroImage = hero?.image_url || hero?.screenshot_urls?.[0] || asset?.visual;

  return (
    <section className="overflow-hidden rounded-[36px] bg-white shadow-apple ring-1 ring-black/[0.06]">
      <div className="grid min-h-[420px] lg:grid-cols-[.92fr_1.08fr]">
        <div className="flex flex-col justify-between p-7 md:p-8">
          <div>
            <div className="mb-8 inline-flex h-10 items-center rounded-full bg-neutral-100 px-4">
              <BrandLogo brand={group.brand} className="max-h-5 max-w-[150px]" />
            </div>
            <h2 className="text-4xl font-semibold tracking-tight text-ink">{group.brand}</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-500">{asset?.englishName}</p>
            <p className="mt-5 line-clamp-3 text-sm leading-6 text-neutral-600">
              {asset?.description || "按品牌整理的公开来源、AI 摘要与 CRM 竞品分析。"}
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-4 gap-3">
              <Metric label="情报" value={group.all.length} />
              <Metric label="新品" value={group.all.filter((item) => item.category === "新品").length} />
              <Metric label="Campaign" value={group.all.filter((item) => item.category === "Campaign").length} />
              <Metric label="促销" value={group.all.filter((item) => isPromotion(item.category)).length} />
            </div>

            <div className="mt-6 rounded-3xl bg-neutral-50 p-5">
              <p className="text-xs font-semibold text-neutral-500">最新活动</p>
              <p className="mt-2 line-clamp-2 text-base font-semibold leading-6 text-ink">
                {hero?.title || "暂无活动"}
              </p>
              <p className="mt-3 text-xs font-medium text-neutral-500">
                更新时间：{hero ? formatDate(hero.updated_at || hero.publish_date) : "暂无"}
              </p>
            </div>

            <Link
              href={`/brands/${encodeURIComponent(group.brand)}`}
              className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-black"
            >
              查看详情 <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        <BrandVisual brand={group.brand} src={heroImage} alt={`${group.brand} 品牌视觉`} className="min-h-[360px] rounded-none lg:min-h-full" />
      </div>

      <div className="border-t border-black/[0.06] p-7">
        <div className="grid gap-3 md:grid-cols-2">
          {slots.map(([key, label]) => (
            <Slot key={label} label={label} activity={group[key] as Activity | undefined} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-neutral-50 p-4">
      <p className="text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-xs font-medium text-neutral-500">{label}</p>
    </div>
  );
}

function Slot({ label, activity }: { label: string; activity?: Activity }) {
  if (!activity) {
    return (
      <div className="rounded-3xl bg-neutral-50 p-4 text-sm text-neutral-500">
        <p className="font-semibold text-neutral-700">{label}</p>
        <p className="mt-2">暂无资料</p>
      </div>
    );
  }

  return (
    <Link href={`/activities/${activity.id}`} className="rounded-3xl bg-neutral-50 p-4 transition hover:bg-neutral-100">
      <p className="text-sm font-semibold text-neutral-500">{label}</p>
      <h3 className="mt-2 line-clamp-2 font-semibold leading-snug text-ink">{activity.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-600">{activity.summary}</p>
      <p className="mt-3 text-xs font-medium text-neutral-500">
        {activity.platform} · {formatDate(activity.publish_date)}
      </p>
    </Link>
  );
}
