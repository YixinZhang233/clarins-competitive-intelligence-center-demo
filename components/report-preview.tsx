import { LinkButton, SectionTitle } from "@/components/ui";
import { isPromotion } from "@/lib/activity-metadata";
import { filterReportActivities, type ReportKind } from "@/lib/reports";
import type { Activity } from "@/lib/types";

export function ReportPreview({ activities, kind }: { activities: Activity[]; kind: ReportKind }) {
  const scoped = filterReportActivities(activities, kind);
  const title = kind === "daily" ? "竞品情报日报" : "竞品情报周报";
  const subtitle = kind === "daily" ? "展示 2026-07-23 演示周期的竞品动态。" : "展示 2026-W30 演示周期的竞品动态。";
  const top = [...scoped].sort((a, b) => b.importance_score - a.importance_score).slice(0, 8);

  return (
    <>
      <section className="mx-auto max-w-4xl text-center">
        <p className="mb-4 text-sm font-semibold text-neutral-500">报告预览</p>
        <h1 className="text-5xl font-semibold tracking-tight text-ink md:text-7xl">{title}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl leading-9 text-neutral-600">{subtitle}</p>
        <div className="mt-8 flex justify-center gap-3">
          <LinkButton href={`/api/reports/${kind}`}>下载 Markdown</LinkButton>
          <LinkButton href={kind === "daily" ? "/reports/weekly" : "/reports/daily"} variant="secondary">
            查看{kind === "daily" ? "周报" : "日报"}
          </LinkButton>
        </div>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-4">
        <Metric label="情报数量" value={scoped.length} />
        <Metric label="覆盖品牌" value={new Set(scoped.map((activity) => activity.brand)).size} />
        <Metric label="新品" value={scoped.filter((activity) => activity.category === "新品").length} />
        <Metric label="促销" value={scoped.filter((activity) => isPromotion(activity.category)).length} />
      </section>

      <section className="mt-16">
        <SectionTitle title="重点动态" subtitle="按 AI 重要性评分排序，用于晨会或周会快速过一遍。" />
        {!top.length ? (
          <div className="rounded-[32px] bg-white p-8 text-center text-neutral-500 shadow-apple ring-1 ring-black/[0.06]">
            当前周期暂无数据。可先到用户设置初始化演示内容，或添加一条竞品资料。
          </div>
        ) : (
          <div className="space-y-5">
            {top.map((activity) => (
              <article key={activity.id} className="rounded-[32px] bg-white p-6 shadow-apple ring-1 ring-black/[0.06]">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-500">
                  <span>{activity.brand}</span>
                  <span>{activity.platform}</span>
                  <span>{activity.publish_date}</span>
                  <span>{activity.category}</span>
                  {activity.is_demo ? <span>Demo Mode</span> : null}
                  <span>上传人：{activity.created_by || "未记录"}</span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">{activity.title}</h2>
                <p className="mt-3 leading-7 text-neutral-600">{activity.summary}</p>
                <p className="mt-3 text-sm leading-6 text-neutral-700">
                  <span className="font-semibold text-ink">营销洞察：</span>{activity.marketing_strategy}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-apple ring-1 ring-black/[0.06]">
      <p className="text-sm font-semibold text-neutral-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}
