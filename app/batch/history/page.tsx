import { EmptyState, GlassCard, LinkButton, Shell } from "@/components/ui";
import { getBatchImports } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BatchHistoryPage() {
  const batches = await getBatchImports();

  return (
    <Shell className="pb-20 pt-16">
      <section className="mx-auto max-w-5xl text-center">
        <p className="mb-4 text-sm font-semibold text-neutral-500">批次历史</p>
        <h1 className="text-5xl font-semibold tracking-tight text-ink md:text-7xl">小红书导入记录。</h1>
        <p className="mx-auto mt-6 max-w-3xl text-xl leading-9 text-neutral-600">
          查看每一次批量导入的处理结果，帮助团队追踪成功解析、人工补充和失败链接。
        </p>
      </section>

      {!batches.length ? (
        <section className="mt-14">
          <EmptyState
            title="暂无批量导入记录"
            subtitle="开始一次批量导入后，这里会展示 batch_id、总链接数、成功数和失败数。"
            action={<LinkButton href="/batch">开始批量导入</LinkButton>}
          />
        </section>
      ) : (
        <section className="mt-14 space-y-4">
          {batches.map((batch) => (
            <GlassCard key={batch.id} className="p-6">
              <div className="grid gap-5 lg:grid-cols-[1.5fr_repeat(4,.6fr)] lg:items-center">
                <div>
                  <p className="text-xs font-semibold text-neutral-500">Batch ID</p>
                  <p className="mt-2 break-all text-lg font-semibold text-ink">{batch.id}</p>
                  <p className="mt-2 text-sm text-neutral-500">
                    创建时间：{formatDate(batch.created_at)} · 创建人：{batch.created_by || "未记录"}
                  </p>
                </div>
                <Metric label="总链接数" value={batch.total_links} />
                <Metric label="成功" value={batch.success_count} />
                <Metric label="需补充" value={batch.needs_manual_count} />
                <Metric label="失败" value={batch.failed_count} />
              </div>
            </GlassCard>
          ))}
        </section>
      )}
    </Shell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] bg-neutral-50 p-4">
      <p className="text-xs font-semibold text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
