"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Search } from "lucide-react";
import { BRANDS, PLATFORMS } from "@/lib/constants";
import type { AiAnalysis, IntelligenceInput } from "@/lib/types";
import type { XhsParseResult } from "@/lib/xhs";
import { Button, GlassCard } from "@/components/ui";

const initialInput: IntelligenceInput = {
  brand: "兰蔻",
  platform: "小红书",
  source_url: "",
  title: "",
  publish_date: new Date().toISOString().slice(0, 10),
  raw_text: "",
  image_url: "",
  screenshot_urls: [],
  notes: ""
};

export function AddIntelligenceForm() {
  const [input, setInput] = useState<IntelligenceInput>(initialInput);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [loading, setLoading] = useState<"parse" | "analyze" | "save" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<XhsParseResult | null>(null);

  const canAnalyze = useMemo(() => {
    const hasManualContent = input.raw_text.length >= 20;
    return input.source_url && input.title && input.publish_date && hasManualContent;
  }, [input]);

  function update<K extends keyof IntelligenceInput>(key: K, value: IntelligenceInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  async function parseXhs() {
    if (!input.source_url) {
      setMessage("请先粘贴小红书链接。");
      return;
    }
    if (input.platform !== "小红书") {
      setMessage("当前自动读取仅支持小红书公开链接；公众号、微博和官网请手动粘贴正文或 OCR 文本。");
      return;
    }
    setLoading("parse");
    setMessage(null);
    setParseResult(null);
    try {
      const response = await fetch("/api/xhs/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input.source_url })
      });
      const payload = (await response.json()) as XhsParseResult;
      setParseResult(payload);
      if (!response.ok) throw new Error(payload.error_message || "读取失败");

      if (payload.success) {
        setInput((current) => ({
          ...current,
          source_url: payload.canonical_url || current.source_url,
          title: payload.title || current.title,
          raw_text: payload.raw_text || payload.description || current.raw_text,
          image_url: payload.cover_image || current.image_url,
          publish_date: payload.publish_date || current.publish_date
        }));
        setMessage("已读取到公开可访问内容，并自动填入表单。请确认后继续 AI 分析。");
      } else {
        setMessage("该小红书链接暂时无法自动读取，请粘贴标题/正文或上传截图后继续 AI 分析。");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "小红书链接读取失败，请人工补充正文。");
    } finally {
      setLoading(null);
    }
  }

  async function analyze() {
    setLoading("analyze");
    setMessage(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "AI 分析失败");
      setAnalysis(payload.analysis);
      setMessage("AI 分析完成，请确认结构化结果后保存。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI 分析失败");
    } finally {
      setLoading(null);
    }
  }

  async function save() {
    if (!analysis) return;
    setLoading("save");
    setMessage(null);
    try {
      const response = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, analysis })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "保存失败");
      setMessage(payload.message || "已保存到竞品情报库。");
      setInput(initialInput);
      setAnalysis(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setLoading(null);
    }
  }

  async function uploadScreenshots(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files).slice(0, 4);
    const dataUrls = await Promise.all(
      selected.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      )
    );
    update("screenshot_urls", [...(input.screenshot_urls || []), ...dataUrls].slice(0, 4));
    setMessage("截图已上传。当前版本不会自动 OCR，请将截图中的关键正文粘贴到“正文内容”后再运行 AI 分析。");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
      <GlassCard className="p-7">
        <div className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="品牌">
              <select value={input.brand} onChange={(event) => update("brand", event.target.value)} className={fieldClass}>
                {BRANDS.map((brand) => (
                  <option key={brand}>{brand}</option>
                ))}
              </select>
            </Field>
            <Field label="平台">
              <select value={input.platform} onChange={(event) => update("platform", event.target.value)} className={fieldClass}>
                {PLATFORMS.map((platform) => (
                  <option key={platform}>{platform}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="原文链接">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input value={input.source_url} onChange={(event) => update("source_url", event.target.value)} className={fieldClass} placeholder="粘贴公开来源链接，例如小红书、公众号、微博或官网 URL" />
              <Button type="button" variant="secondary" disabled={loading !== null || !input.source_url || input.platform !== "小红书"} onClick={parseXhs} className="h-12 whitespace-nowrap px-5">
                {loading === "parse" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                读取小红书内容
              </Button>
            </div>
          </Field>
          {parseResult ? (
            <div className={`rounded-[24px] p-4 text-sm leading-6 ${parseResult.success ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
              <p className="font-semibold">{parseResult.success ? "读取成功" : "需要人工补充"}</p>
              <p className="mt-1">
                {parseResult.success
                  ? "系统已尽可能读取公开标题、正文摘要和封面图。请人工核对后再运行 AI 分析。"
                  : parseResult.error_message || "该小红书链接暂时无法自动读取，请粘贴标题/正文或上传截图后继续 AI 分析。"}
              </p>
              {!parseResult.success ? <p className="mt-1">状态：{statusLabel[parseResult.status] || parseResult.status}</p> : null}
            </div>
          ) : null}
          <div className="grid gap-5 md:grid-cols-[1fr_180px]">
            <Field label="标题">
              <input value={input.title} onChange={(event) => update("title", event.target.value)} className={fieldClass} placeholder="粘贴原文标题" />
            </Field>
            <Field label="发布时间">
              <input type="date" value={input.publish_date} onChange={(event) => update("publish_date", event.target.value)} className={fieldClass} />
            </Field>
          </div>
          <Field label="正文内容">
            <textarea value={input.raw_text} onChange={(event) => update("raw_text", event.target.value)} className={`${fieldClass} min-h-56 resize-y py-4`} placeholder="粘贴公开内容正文或 OCR 文本。若只上传截图，请先人工补充截图中的关键文字。" />
          </Field>
          <Field label="图片链接">
            <input value={input.image_url || ""} onChange={(event) => update("image_url", event.target.value)} className={fieldClass} placeholder="https://...（可选）" />
          </Field>
          {input.image_url ? (
            <div className="overflow-hidden rounded-[28px] bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={input.image_url} alt="读取到的封面图" className="max-h-72 w-full object-cover" />
            </div>
          ) : null}
          <Field label="截图上传">
            <div className="rounded-[28px] bg-white/80 p-4 ring-1 ring-black/[0.08]">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => uploadScreenshots(event.target.files)}
                className="block w-full text-sm text-neutral-600 file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              <p className="mt-3 text-xs leading-5 text-neutral-500">支持上传截图，最多 4 张。截图将作为用户提交材料保存；当前 Demo 不会自动 OCR，也不会根据截图编造内容。</p>
              {input.screenshot_urls?.length ? (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {input.screenshot_urls.map((src, index) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src.slice(0, 40) + index} src={src} alt={`截图 ${index + 1}`} className="aspect-square rounded-2xl object-cover" />
                  ))}
                </div>
              ) : null}
            </div>
          </Field>
          <Field label="备注">
            <textarea value={input.notes || ""} onChange={(event) => update("notes", event.target.value)} className={`${fieldClass} min-h-24 py-4`} placeholder="可填写人工观察、互动数据、截图说明等。" />
          </Field>
          <Button disabled={!canAnalyze || loading !== null} onClick={analyze} className="w-full md:w-fit">
            {loading === "analyze" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            AI 分析
          </Button>
          {message ? <p className="rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-700">{message}</p> : null}
        </div>
      </GlassCard>

      <GlassCard className="p-7">
        <p className="text-sm font-semibold text-neutral-500">AI 输出</p>
        {!analysis ? (
          <div className="mt-8 rounded-[28px] bg-neutral-50 p-8 text-center text-neutral-500">
            填写公开来源链接和正文/OCR 文本后点击「AI 分析」，这里会显示结构化 JSON 对应结果。
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <Result label="活动分类" value={analysis.category} />
            <Result label="产品名" value={analysis.product_name} />
            <Result label="Campaign 名称" value={analysis.campaign_name} />
            <Result label="折扣/权益" value={analysis.discount} />
            <Result label="摘要" value={analysis.summary} />
            <Result label="核心卖点" value={analysis.key_points.join("；")} />
            <Result label="目标人群" value={analysis.target_audience} />
            <Result label="营销策略" value={analysis.marketing_strategy} />
            <Result label="为什么重要" value={analysis.why_it_matters} />
            <Result label="建议娇韵诗如何应对" value={analysis.suggested_action_for_clarins} />
            <Result label="重要性评分" value={`${analysis.importance_score}/10`} />
            <Result label="标签" value={analysis.tags.join("，")} />
            <Button onClick={save} disabled={loading !== null} className="w-full">
              {loading === "save" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              保存到情报库
            </Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

const fieldClass =
  "h-12 w-full rounded-2xl border border-black/10 bg-white/80 px-4 text-sm text-ink outline-none transition placeholder:text-neutral-400 focus:border-black/20 focus:ring-4 focus:ring-black/[0.04]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-neutral-700">{label}</span>
      {children}
    </label>
  );
}

const statusLabel: Record<string, string> = {
  success: "读取成功",
  login_required: "需要登录",
  blocked: "访问受限",
  app_only: "App 内打开",
  parse_failed: "解析失败"
};

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-neutral-50 p-4">
      <p className="text-xs font-semibold text-neutral-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-ink">{value || "未明确"}</p>
    </div>
  );
}
