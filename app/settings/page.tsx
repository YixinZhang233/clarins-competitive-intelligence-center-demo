import { SettingsPanel } from "@/components/settings-panel";
import { SectionTitle, Shell } from "@/components/ui";
import { getCollectionMode } from "@/lib/collectors";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const currentUser = getCurrentUser();
  const collectionMode = getCollectionMode();
  const provider = process.env.WECHAT_COLLECTOR_PROVIDER === "live" || process.env.WEIBO_COLLECTOR_PROVIDER === "live" ? "Live Provider" : "Demo Provider";
  const hasCollectorBaseUrl = Boolean(process.env.WECHAT_COLLECTOR_BASE_URL || process.env.WEIBO_COLLECTOR_BASE_URL);
  const hasCollectorApiKey = Boolean(process.env.WECHAT_COLLECTOR_API_KEY || process.env.WEIBO_COLLECTOR_API_KEY);
  const aiProvider = process.env.LLM_PROVIDER || "Not Configured";
  const hasAiKey = Boolean(process.env.LLM_API_KEY);

  return (
    <Shell className="pb-20 pt-16">
      <section className="mx-auto max-w-4xl text-center">
        <p className="mb-4 text-sm font-semibold text-neutral-500">用户设置</p>
        <h1 className="text-5xl font-semibold tracking-tight text-ink md:text-7xl">演示用户与数据。</h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl leading-9 text-neutral-600">
          用轻量演示用户系统记录上传人，并管理可重复初始化的演示内容。
        </p>
      </section>

      <section className="mt-14">
        <SectionTitle title="演示控制台" subtitle="切换用户后，新添加或批量导入的竞品资料会记录当前上传人。" />
        <SettingsPanel currentUser={currentUser} />
      </section>

      <section className="mt-14">
        <SectionTitle title="System Configuration" subtitle="只读配置概览。敏感密钥只显示配置状态，不显示具体值。" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ConfigCard label="Provider" value={provider} />
          <ConfigCard label="API Base URL" value={hasCollectorBaseUrl ? "Configured" : "Not Configured"} />
          <ConfigCard label="API Key" value={hasCollectorApiKey ? "Configured" : "Not Configured"} />
          <ConfigCard label="Collection Schedule" value="09:00" />
          <ConfigCard label="Collection Frequency" value="Daily" />
          <ConfigCard label="AI Provider" value={aiProvider === "deepseek" ? "DeepSeek" : aiProvider} />
          <ConfigCard label="AI API Key" value={hasAiKey ? "Configured" : "Not Configured"} />
          <ConfigCard label="Collection Mode" value={collectionMode === "demo" ? "Demo Mode" : "Live Mode"} />
        </div>
      </section>
    </Shell>
  );
}

function ConfigCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] bg-white p-6 shadow-apple ring-1 ring-black/[0.06]">
      <p className="text-sm font-semibold text-neutral-500">{label}</p>
      <p className="mt-3 text-xl font-semibold text-ink">{value || "Not Configured"}</p>
    </div>
  );
}
