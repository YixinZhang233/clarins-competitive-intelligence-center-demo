"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Play, RotateCcw, Save, Upload } from "lucide-react";
import { Button, GlassCard } from "@/components/ui";
import { BRANDS, DEMO_USERS } from "@/lib/constants";

type CollectionStatus = {
  mode: "demo" | "live";
  todayAutomatic: number;
  todayManual: number;
  pending: number;
  failed: number;
  lastRunAt: string | null;
  nextRunAt: string;
  platformStatus: Array<{
    platform: string;
    accessType: string;
    status: string;
    healthText: string;
    description: string;
    missingConfig: string[];
    canRun: boolean;
    actionLabel: string;
    metricLabel: string;
    lastSyncAt: string | null;
    todayCount: number;
  }>;
  runs: Array<{
    id: string;
    platform: string;
    started_at: string;
    finished_at: string | null;
    status: string;
    collected_count: number;
    inserted_count: number;
    duplicate_count: number;
    failed_count: number;
    error_message: string | null;
  }>;
};

type HistoryRow = {
  id: string;
  time: string;
  platform: string;
  status: string;
  inserted: number;
  duplicate: number;
  failed: number;
  duration: string;
  detail: string;
};

const fieldClass = "h-12 w-full rounded-2xl bg-neutral-50 px-4 text-sm text-ink outline-none ring-1 ring-black/[0.06] focus:bg-white focus:ring-black/20";
const textareaClass = `${fieldClass} min-h-32 py-4`;

export function CollectionPanel({ initialStatus }: { initialStatus: CollectionStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [selectedHistory, setSelectedHistory] = useState<HistoryRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [manual, setManual] = useState({
    brand: "兰蔻",
    platform: "小红书",
    title: "",
    source_url: "",
    publish_date: "2026-07-23",
    raw_text: "",
    uploaded_by: DEMO_USERS[0] as string,
    notes: "",
    image_urls: [] as string[]
  });
  const blockedAutomaticPlatforms = status.platformStatus.filter((platform) => platform.accessType === "自动采集" && !platform.canRun);
  const runButtonLabel = status.mode === "demo" ? "Run Demo Collection" : "立即采集";
  const historyRows = buildHistoryRows(status);

  function refreshStatus() {
    return fetch("/api/collection/status").then((response) => response.json()).then((payload) => {
      if (payload.ok) setStatus(payload.data);
    });
  }

  function runAction(action: () => Promise<string>) {
    setMessage("");
    setError("");
    setProgress("");
    startTransition(async () => {
      try {
        const result = await action();
        setMessage(result);
        await refreshStatus();
      } catch (err) {
        setError(err instanceof Error ? err.message : "操作失败，请重试。");
      } finally {
        setProgress("");
      }
    });
  }

  async function readFiles(files: FileList | null) {
    if (!files?.length) return;
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, 4);
    const textFiles = Array.from(files).filter((file) => /csv|excel|spreadsheet|text|plain/.test(file.type) || /\.(csv|txt|xlsx)$/i.test(file.name));

    const imageUrls = await Promise.all(imageFiles.map(readAsDataUrl));
    let fileText = "";
    for (const file of textFiles) {
      if (/\.xlsx$/i.test(file.name)) {
        fileText += `\n[已上传 Excel 文件：${file.name}。Demo 页面保留文件名，正式模式可接入服务端解析。]`;
      } else {
        fileText += `\n${await file.text()}`;
      }
    }
    setManual((current) => ({
      ...current,
      image_urls: [...current.image_urls, ...imageUrls].slice(0, 4),
      raw_text: `${current.raw_text}\n${fileText}`.trim()
    }));
  }

  return (
    <div className="space-y-14">
      <div className="rounded-[28px] bg-blue-50 px-6 py-4 text-sm font-semibold leading-6 text-blue-950 ring-1 ring-blue-100">
        当前模式：{status.mode === "demo" ? "Demo Mode。自动采集会使用模拟数据，不访问真实平台。" : "Live Mode。真实 Provider 将读取环境变量中的接口配置。"}
      </div>

      <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Metric label="今日自动采集" value={status.todayAutomatic} />
        <Metric label="今日人工上传" value={status.todayManual} />
        <Metric label="待分析" value={status.pending} />
        <Metric label="采集失败" value={status.failed} />
        <Metric label="最近自动采集" value={formatMaybeDate(status.lastRunAt)} />
        <Metric label="下一次计划" value={status.nextRunAt} />
      </section>

      <section>
        <h2 className="text-3xl font-semibold tracking-tight text-ink">System Status</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {["Collection Service", "AI Analysis", "Database", "Report Generator"].map((item) => (
            <GlassCard key={item}>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-500">{item}</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-700">Healthy</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-semibold tracking-tight text-ink">平台接入状态</h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-4">
          {status.platformStatus.map((platform) => (
            <GlassCard key={platform.platform}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-500">{platform.accessType}</p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink">{platform.platform}</h3>
                </div>
                <Badge tone={platform.status === "真实接口待配置" ? "amber" : "green"}>{platform.status}</Badge>
              </div>
              <div className="mt-6 space-y-2 text-sm leading-6 text-neutral-600">
                <p className="font-semibold text-ink">{platform.healthText}</p>
                <p>最近同步：{formatMaybeDate(platform.lastSyncAt)}</p>
                <p>{platform.metricLabel}：{platform.todayCount}</p>
                <p>{platform.description}</p>
                {platform.missingConfig.length ? <p className="text-amber-700">缺少配置：{platform.missingConfig.join("、")}</p> : null}
              </div>
              <Button
                variant="secondary"
                className="mt-5 h-10 px-4"
                disabled={pending || (platform.accessType === "自动采集" && !platform.canRun)}
                onClick={() => runAction(async () => platform.accessType === "自动采集" ? triggerRun() : "人工上传入口在下方表单。")}
              >
                {platform.actionLabel}
              </Button>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
        <GlassCard>
          <h2 className="text-3xl font-semibold tracking-tight text-ink">自动采集任务</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ConfigItem label="是否启用" value="已启用" />
            <ConfigItem label="执行频率" value="每天一次" />
            <ConfigItem label="每天执行时间" value="09:00" />
            <ConfigItem label="监控品牌" value="六个重点品牌" />
            <ConfigItem label="监控账号" value="官方公众号 / 官方微博" />
            <ConfigItem label="每次最大采集" value="4 条 / 平台" />
            <ConfigItem label="自动 AI 分析" value="开启" />
            <ConfigItem label="加入日报/周报" value="开启" />
          </div>
          {blockedAutomaticPlatforms.length ? (
            <div className="mt-6 rounded-3xl bg-amber-50 px-5 py-4 text-sm font-semibold leading-6 text-amber-800 ring-1 ring-amber-100">
              真实接口待配置：{blockedAutomaticPlatforms.map((platform) => `${platform.platform} 缺少 ${platform.missingConfig.join("、")}`).join("；")}。补齐后才可执行真实采集。
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button disabled={pending || blockedAutomaticPlatforms.length > 0} onClick={() => runAction(triggerRun)}>
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              {runButtonLabel}
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => runAction(async () => "设置已保存。本 Demo 使用固定默认配置。")}>
              <Save className="mr-2 h-4 w-4" />
              保存设置
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => runAction(triggerRetry)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              重试失败任务
            </Button>
          </div>
          {progress ? (
            <div className="mt-6 rounded-3xl bg-neutral-900 px-5 py-4 text-sm font-semibold text-white">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              {progress}
            </div>
          ) : null}
        </GlassCard>

        <GlassCard>
          <h2 className="text-3xl font-semibold tracking-tight text-ink">人工上传</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-600">适用于小红书和微信小程序。上传后会进入同一套 AI 分析、结构化存储、首页/品牌页/日报/周报/Excel 导出流程。</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="品牌">
              <select className={fieldClass} value={manual.brand} onChange={(event) => setManual({ ...manual, brand: event.target.value })}>
                {BRANDS.map((brand) => <option key={brand}>{brand}</option>)}
              </select>
            </Field>
            <Field label="平台">
              <select className={fieldClass} value={manual.platform} onChange={(event) => setManual({ ...manual, platform: event.target.value })}>
                <option>小红书</option>
                <option>微信小程序</option>
              </select>
            </Field>
            <Field label="内容标题">
              <input className={fieldClass} value={manual.title} onChange={(event) => setManual({ ...manual, title: event.target.value })} />
            </Field>
            <Field label="原始链接">
              <input className={fieldClass} value={manual.source_url} onChange={(event) => setManual({ ...manual, source_url: event.target.value })} placeholder="https://example.com/source" />
            </Field>
            <Field label="发布时间">
              <input type="date" className={fieldClass} value={manual.publish_date} onChange={(event) => setManual({ ...manual, publish_date: event.target.value })} />
            </Field>
            <Field label="上传人">
              <select className={fieldClass} value={manual.uploaded_by} onChange={(event) => setManual({ ...manual, uploaded_by: event.target.value })}>
                {DEMO_USERS.map((user) => <option key={user}>{user}</option>)}
              </select>
            </Field>
          </div>
          <div className="mt-4 grid gap-4">
            <Field label="原始正文">
              <textarea className={textareaClass} value={manual.raw_text} onChange={(event) => setManual({ ...manual, raw_text: event.target.value })} placeholder="粘贴正文、OCR 文本，或上传 CSV / Excel / 图片后补充关键信息。" />
            </Field>
            <Field label="上传截图、图片、Excel / CSV">
              <input
                type="file"
                multiple
                accept="image/*,.csv,.txt,.xlsx"
                onChange={(event) => readFiles(event.target.files)}
                className="block w-full text-sm text-neutral-600 file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </Field>
            <Field label="备注">
              <textarea className={`${textareaClass} min-h-20`} value={manual.notes} onChange={(event) => setManual({ ...manual, notes: event.target.value })} />
            </Field>
          </div>
          {manual.image_urls.length ? (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {manual.image_urls.map((src, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src.slice(0, 32) + index} src={src} alt={`上传图片 ${index + 1}`} className="aspect-video rounded-2xl object-cover" />
              ))}
            </div>
          ) : null}
          <Button className="mt-6" disabled={pending} onClick={() => runAction(submitManual)}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            提交并 AI 分析
          </Button>
        </GlassCard>
      </section>

      {(message || error) ? (
        <div className={`rounded-[28px] px-6 py-4 text-sm font-semibold ${error ? "bg-rose-50 text-rose-800 ring-1 ring-rose-100" : "bg-neutral-900 text-white"}`}>
          {error || message}
        </div>
      ) : null}

      <section>
        <h2 className="text-3xl font-semibold tracking-tight text-ink">Recent Collection History</h2>
        <div className="mt-6 overflow-hidden rounded-[32px] bg-white shadow-apple ring-1 ring-black/[0.06]">
          <div className="grid grid-cols-[.6fr_1fr_.9fr_repeat(4,.55fr)] gap-4 border-b border-black/[0.06] px-5 py-4 text-xs font-semibold text-neutral-500">
            <span>时间</span><span>平台</span><span>状态</span><span>新增</span><span>重复</span><span>失败</span><span>耗时</span>
          </div>
          {historyRows.map((row) => (
            <button
              key={row.id}
              className="grid w-full grid-cols-[.6fr_1fr_.9fr_repeat(4,.55fr)] gap-4 px-5 py-4 text-left text-sm text-neutral-700 transition hover:bg-neutral-50"
              onClick={() => setSelectedHistory(row)}
            >
              <span>{row.time}</span>
              <span>{row.platform}</span>
              <span className={row.status === "Success" || row.status === "Manual Upload" ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>{row.status}</span>
              <span>{row.inserted}</span>
              <span>{row.duplicate}</span>
              <span>{row.failed}</span>
              <span>{row.duration}</span>
            </button>
          ))}
        </div>
      </section>

      {selectedHistory ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-5 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl rounded-[36px] bg-white p-7 shadow-apple">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-neutral-500">Collection Detail</p>
                <h3 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{selectedHistory.platform}</h3>
              </div>
              <button className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-ink" onClick={() => setSelectedHistory(null)}>关闭</button>
            </div>
            <div className="mt-6 grid gap-3 text-sm leading-6 text-neutral-700">
              <DetailItem label="时间" value={selectedHistory.time} />
              <DetailItem label="状态" value={selectedHistory.status} />
              <DetailItem label="新增" value={String(selectedHistory.inserted)} />
              <DetailItem label="重复" value={String(selectedHistory.duplicate)} />
              <DetailItem label="失败" value={String(selectedHistory.failed)} />
              <DetailItem label="耗时" value={selectedHistory.duration} />
              <DetailItem label="说明" value={selectedHistory.detail} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  async function triggerRun() {
    const steps = status.mode === "demo"
      ? ["Collecting...", "Fetching WeChat Official Accounts...", "Fetching Weibo...", "AI Analyzing...", "Generating Reports..."]
      : ["Collecting...", "Fetching WeChat Official Accounts...", "Fetching Weibo...", "AI Analyzing...", "Generating Reports..."];

    for (const step of steps) {
      setProgress(step);
      await wait(520);
    }
    const response = await fetch("/api/collection/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "执行失败");
    setProgress("Collection Completed");
    await wait(420);
    return `采集完成：新增 ${payload.data.summary.inserted_count}，重复 ${payload.data.summary.duplicate_count}，失败 ${payload.data.summary.failed_count}。`;
  }

  async function triggerRetry() {
    const response = await fetch("/api/collection/retry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "重试失败");
    return payload.message || "重试完成。";
  }

  async function submitManual() {
    const response = await fetch("/api/collection/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(manual)
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "提交失败");
    return payload.message || "人工上传已完成。";
  }
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-neutral-50 px-4 py-3">
      <span className="font-semibold text-ink">{label}：</span>{value}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-apple ring-1 ring-black/[0.06]">
      <p className="text-sm font-semibold text-neutral-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function Badge({ children, tone }: { children: string; tone: "green" | "amber" }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone === "green" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{children}</span>;
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-neutral-50 p-4">
      <p className="text-xs font-semibold text-neutral-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-neutral-700">{label}</span>
      {children}
    </label>
  );
}

function formatMaybeDate(value: string | null) {
  if (!value) return "暂无";
  if (/^\d{4}-\d{2}-\d{2} 09:00$/.test(value)) return value;
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatDuration(startedAt: string, finishedAt: string | null) {
  if (!finishedAt) return "—";
  const duration = Math.max(0.1, (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000);
  return `${duration.toFixed(1)}s`;
}

function normalizeRunStatus(status: string) {
  if (status === "completed") return "Success";
  if (status === "running") return "Collecting";
  if (status === "partial_failed") return "Partial Success";
  if (status === "failed") return "Failed";
  return status;
}

function buildHistoryRows(status: CollectionStatus): HistoryRow[] {
  if (status.runs.length) {
    return status.runs.map((run) => ({
      id: run.id,
      time: formatTime(run.started_at),
      platform: run.platform,
      status: normalizeRunStatus(run.status),
      inserted: run.inserted_count,
      duplicate: run.duplicate_count,
      failed: run.failed_count,
      duration: formatDuration(run.started_at, run.finished_at),
      detail: run.error_message || `${run.platform} 完成采集、去重、AI 分析与结构化入库。`
    }));
  }

  return [
    { id: "demo-wechat", time: "09:00", platform: "微信公众号", status: "Success", inserted: 12, duplicate: 2, failed: 0, duration: "4.2s", detail: "定时采集官方公众号公开文章，完成去重和 AI 结构化分析。" },
    { id: "demo-weibo", time: "09:10", platform: "微博", status: "Success", inserted: 8, duplicate: 1, failed: 0, duration: "3.5s", detail: "定时采集微博公开内容，生成关键词、摘要和竞争动作建议。" },
    { id: "demo-xhs", time: "09:20", platform: "小红书", status: "Manual Upload", inserted: 3, duplicate: 0, failed: 0, duration: "—", detail: "人工上传公开内容或 OCR 文本，进入统一 AI 分析流程。" }
  ];
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
