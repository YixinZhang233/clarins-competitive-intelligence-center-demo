"use client";

import { useMemo, useState } from "react";
import { Download, Loader2, PencilLine, RotateCcw } from "lucide-react";
import { BRANDS } from "@/lib/constants";
import { Button, GlassCard } from "@/components/ui";

type BatchRow = {
  batch_item_id?: string;
  source_url: string;
  status: string;
  brand?: string;
  title?: string;
  publish_date?: string;
  summary?: string;
  error_message?: string;
  activity_id?: string;
};

type Summary = {
  total: number;
  success: number;
  needs_manual: number;
  failed: number;
};

type ManualDraft = {
  brand: string;
  title: string;
  publish_date: string;
  raw_text: string;
  image_url: string;
  notes: string;
};

export function BatchImportForm() {
  const [brand, setBrand] = useState("");
  const [links, setLinks] = useState("");
  const [defaultNotes, setDefaultNotes] = useState("");
  const [batchId, setBatchId] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ManualDraft>>({});

  const progress = summary ? Math.round((summary.success / Math.max(summary.total, 1)) * 100) : 0;
  const canSubmit = links.trim().length > 0 && !loading;

  const exports = useMemo(() => buildExports(rows, batchId), [rows, batchId]);

  async function startBatch() {
    setLoading(true);
    setMessage(null);
    setRows([]);
    setSummary(null);
    try {
      const response = await fetch("/api/batch/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, links, default_notes: defaultNotes })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "批量导入失败");
      setBatchId(payload.batch_id);
      setSummary(payload.summary);
      setRows(payload.rows);
      setMessage(`批量导入完成：${payload.summary.success} 条已保存，${payload.summary.needs_manual} 条需要人工补充。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "批量导入失败");
    } finally {
      setLoading(false);
    }
  }

  function openManual(row: BatchRow) {
    if (!row.batch_item_id) return;
    setDrafts((current) => ({
      ...current,
      [row.batch_item_id!]: current[row.batch_item_id!] || {
        brand: row.brand || brand,
        title: row.title || "",
        publish_date: row.publish_date || new Date().toISOString().slice(0, 10),
        raw_text: "",
        image_url: "",
        notes: defaultNotes
      }
    }));
  }

  function updateDraft(id: string, patch: Partial<ManualDraft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  async function reanalyze(row: BatchRow) {
    if (!row.batch_item_id) return;
    const draft = drafts[row.batch_item_id];
    if (!draft) return;
    setReanalyzingId(row.batch_item_id);
    setMessage(null);
    try {
      const response = await fetch("/api/batch/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_item_id: row.batch_item_id, ...draft })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "重新分析失败");
      setRows((current) => current.map((item) => (item.batch_item_id === row.batch_item_id ? payload.row : item)));
      setDrafts((current) => {
        const next = { ...current };
        delete next[row.batch_item_id!];
        return next;
      });
      setSummary((current) => recalcSummary(rows.map((item) => (item.batch_item_id === row.batch_item_id ? payload.row : item)), current));
      setMessage("人工补充已重新分析并保存。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "重新分析失败");
    } finally {
      setReanalyzingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <GlassCard className="p-7">
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <div className="space-y-5">
            <Field label="品牌选择（可选）">
              <select value={brand} onChange={(event) => setBrand(event.target.value)} className={fieldClass}>
                <option value="">由 AI 从内容判断</option>
                {BRANDS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="默认备注（可选）">
              <textarea value={defaultNotes} onChange={(event) => setDefaultNotes(event.target.value)} className={`${fieldClass} min-h-36 py-4`} placeholder="例如：618 重点观察、会员活动、达人种草等。" />
            </Field>
            <Button disabled={!canSubmit} onClick={startBatch} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              开始批量分析
            </Button>
          </div>
          <Field label="链接批量输入框">
            <textarea
              value={links}
              onChange={(event) => setLinks(event.target.value)}
              className={`${fieldClass} min-h-[340px] resize-y py-5 text-base leading-8`}
              placeholder={"每行一个小红书链接，例如：\nhttps://www.xiaohongshu.com/explore/...\nhttps://xhslink.com/..."}
            />
          </Field>
        </div>
        {message ? <p className="mt-5 rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-700">{message}</p> : null}
      </GlassCard>

      {summary ? (
        <GlassCard className="p-7">
          <div className="grid gap-4 md:grid-cols-4">
            <Metric label="总链接数" value={summary.total} />
            <Metric label="成功解析" value={summary.success} />
            <Metric label="需要人工补充" value={summary.needs_manual} />
            <Metric label="失败" value={summary.failed} />
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${progress}%` }} />
          </div>
        </GlassCard>
      ) : null}

      {rows.length ? (
        <GlassCard className="overflow-hidden p-0">
          <div className="flex flex-col gap-4 border-b border-black/[0.06] p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-neutral-500">批次结果预览</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Batch ID：{batchId}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <DownloadLink filename={`xhs-batch-${batchId}.csv`} content={exports.csv} label="CSV" />
              <DownloadLink filename={`xhs-batch-${batchId}.md`} content={exports.markdown} label="Markdown" />
              <a href="/api/export/excel" className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-ink ring-1 ring-black/10">
                <Download className="mr-2 h-4 w-4" />
                全量 Excel
              </a>
            </div>
          </div>
          <div className="divide-y divide-black/[0.06]">
            {rows.map((row) => (
              <div key={row.batch_item_id || row.source_url} className="p-6">
                <div className="grid gap-4 lg:grid-cols-[1fr_160px_140px]">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <StatusBadge status={row.status} />
                      {row.brand ? <span className="text-sm font-semibold text-neutral-500">{row.brand}</span> : null}
                    </div>
                    <p className="break-all text-sm text-neutral-500">{row.source_url}</p>
                    <h3 className="mt-3 text-lg font-semibold text-ink">{row.title || "等待补充标题与正文"}</h3>
                    {row.summary ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-600">{row.summary}</p> : null}
                    {row.error_message ? <p className="mt-2 text-sm text-rose-600">{row.error_message}</p> : null}
                  </div>
                  <div className="text-sm text-neutral-500">{row.publish_date || "未识别日期"}</div>
                  <div>
                    {row.status === "需要人工补充正文" && row.batch_item_id ? (
                      <Button variant="secondary" className="h-10 px-4" onClick={() => openManual(row)}>
                        <PencilLine className="mr-2 h-4 w-4" />
                        编辑
                      </Button>
                    ) : null}
                  </div>
                </div>
                {row.batch_item_id && drafts[row.batch_item_id] ? (
                  <ManualEditor
                    draft={drafts[row.batch_item_id]}
                    loading={reanalyzingId === row.batch_item_id}
                    onChange={(patch) => updateDraft(row.batch_item_id!, patch)}
                    onSubmit={() => reanalyze(row)}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}

const fieldClass =
  "w-full rounded-[24px] bg-white/90 px-4 text-sm text-ink outline-none ring-1 ring-black/[0.08] transition placeholder:text-neutral-400 focus:bg-white focus:ring-black/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-neutral-700">{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[28px] bg-neutral-50 p-5">
      <p className="text-sm font-semibold text-neutral-500">{label}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-ink">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "已保存"
      ? "bg-emerald-50 text-emerald-700"
      : status === "需要人工补充正文"
        ? "bg-amber-50 text-amber-700"
        : "bg-rose-50 text-rose-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}

function ManualEditor({
  draft,
  loading,
  onChange,
  onSubmit
}: {
  draft: ManualDraft;
  loading: boolean;
  onChange: (patch: Partial<ManualDraft>) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="mt-5 rounded-[28px] bg-neutral-50 p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="品牌">
          <select value={draft.brand} onChange={(event) => onChange({ brand: event.target.value })} className={`${fieldClass} h-12`}>
            <option value="">由 AI 判断</option>
            {BRANDS.map((brand) => (
              <option key={brand}>{brand}</option>
            ))}
          </select>
        </Field>
        <Field label="发布时间">
          <input type="date" value={draft.publish_date} onChange={(event) => onChange({ publish_date: event.target.value })} className={`${fieldClass} h-12`} />
        </Field>
        <Field label="图片链接">
          <input value={draft.image_url} onChange={(event) => onChange({ image_url: event.target.value })} className={`${fieldClass} h-12`} placeholder="https://..." />
        </Field>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[.8fr_1.2fr]">
        <Field label="标题">
          <input value={draft.title} onChange={(event) => onChange({ title: event.target.value })} className={`${fieldClass} h-12`} />
        </Field>
        <Field label="正文">
          <textarea value={draft.raw_text} onChange={(event) => onChange({ raw_text: event.target.value })} className={`${fieldClass} min-h-32 py-4`} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={onSubmit} disabled={loading || !draft.title || draft.raw_text.length < 20}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
          重新分析
        </Button>
      </div>
    </div>
  );
}

function DownloadLink({ filename, content, label }: { filename: string; content: string; label: string }) {
  return (
    <a
      href={`data:text/plain;charset=utf-8,${encodeURIComponent(content)}`}
      download={filename}
      className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-ink ring-1 ring-black/10"
    >
      <Download className="mr-2 h-4 w-4" />
      {label}
    </a>
  );
}

function buildExports(rows: BatchRow[], batchId: string) {
  const csvRows = [["Batch ID", "URL", "状态", "品牌", "标题", "发布时间", "摘要", "错误"]];
  for (const row of rows) {
    csvRows.push([batchId, row.source_url, row.status, row.brand || "", row.title || "", row.publish_date || "", row.summary || "", row.error_message || ""]);
  }
  const csv = csvRows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const markdown = [
    `# 小红书批量导入结果`,
    "",
    `Batch ID：${batchId}`,
    "",
    ...rows.flatMap((row) => [
      `## ${row.title || row.source_url}`,
      "",
      `- 状态：${row.status}`,
      `- 品牌：${row.brand || "未识别"}`,
      `- 链接：${row.source_url}`,
      row.summary ? `- 摘要：${row.summary}` : `- 说明：${row.error_message || "等待人工补充"}`,
      ""
    ])
  ].join("\n");
  return { csv, markdown };
}

function recalcSummary(rows: BatchRow[], current: Summary | null): Summary {
  const total = current?.total || rows.length;
  const success = rows.filter((row) => row.status === "已保存").length;
  const needsManual = rows.filter((row) => row.status === "需要人工补充正文").length;
  return { total, success, needs_manual: needsManual, failed: Math.max(0, total - success - needsManual) };
}
