import { EmptyState, LinkButton, SectionTitle, Shell } from "@/components/ui";
import { getActivities } from "@/lib/supabase";
import { activitiesToCsv, activitiesToMarkdown } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const activities = await getActivities();
  const csv = activitiesToCsv(activities);
  const markdown = activitiesToMarkdown(activities);

  return (
    <Shell className="pb-20 pt-16">
      <section className="mx-auto max-w-4xl text-center">
        <p className="mb-4 text-sm font-semibold text-neutral-500">情报导出</p>
        <h1 className="text-5xl font-semibold tracking-tight text-ink md:text-7xl">导出竞品情报。</h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl leading-9 text-neutral-600">
          支持 Excel、Markdown、CSV，便于 CRM、Marketing 和 Brand 团队做周报与复盘。
        </p>
      </section>

      {!activities.length ? (
        <section className="mt-14">
          <EmptyState action={<LinkButton href="/add">添加真实链接</LinkButton>} />
        </section>
      ) : (
        <section className="mt-14 grid gap-6 md:grid-cols-3">
          <a href="/api/export/excel" className="rounded-[32px] bg-white p-7 shadow-apple ring-1 ring-black/[0.06] transition hover:-translate-y-1">
            <p className="text-sm font-semibold text-neutral-500">Excel</p>
            <h2 className="mt-4 text-2xl font-semibold text-ink">下载 Excel</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">原生 .xlsx 文件，适合周报和团队共享。</p>
          </a>
          <DownloadCard title="Markdown" filename="clarins-competitive-intelligence.md" content={markdown} mime="text/markdown" />
          <DownloadCard title="CSV" filename="clarins-competitive-intelligence.csv" content={csv} mime="text/csv" />
          <a href="/reports/daily" className="rounded-[32px] bg-white p-7 shadow-apple ring-1 ring-black/[0.06] transition hover:-translate-y-1">
            <p className="text-sm font-semibold text-neutral-500">Daily Report</p>
            <h2 className="mt-4 text-2xl font-semibold text-ink">预览日报</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">基于当前演示周期生成日报，可下载 Markdown。</p>
          </a>
          <a href="/reports/weekly" className="rounded-[32px] bg-white p-7 shadow-apple ring-1 ring-black/[0.06] transition hover:-translate-y-1">
            <p className="text-sm font-semibold text-neutral-500">Weekly Report</p>
            <h2 className="mt-4 text-2xl font-semibold text-ink">预览周报</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">基于当前演示周期生成周报，可下载 Markdown。</p>
          </a>
        </section>
      )}
    </Shell>
  );
}

function DownloadCard({ title, filename, content, mime }: { title: string; filename: string; content: string; mime: string }) {
  const href = `data:${mime};charset=utf-8,${encodeURIComponent(content)}`;
  return (
    <a href={href} download={filename} className="rounded-[32px] bg-white p-7 shadow-apple ring-1 ring-black/[0.06] transition hover:-translate-y-1">
      <p className="text-sm font-semibold text-neutral-500">{title}</p>
      <h2 className="mt-4 text-2xl font-semibold text-ink">下载 {title}</h2>
      <p className="mt-3 text-sm leading-6 text-neutral-600">包含当前情报列表和 AI 分析结果；演示内容会明确标记。</p>
    </a>
  );
}
