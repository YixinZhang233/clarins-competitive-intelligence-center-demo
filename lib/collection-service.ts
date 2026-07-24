import { createHash, randomUUID } from "crypto";
import { analyzeIntelligence, deterministicAnalysis } from "@/lib/ai";
import { BRAND_ASSETS } from "@/lib/constants";
import { defaultCollectorConfig, getCollectionMode, getCollectorProviders } from "@/lib/collectors";
import type { CollectedItem, CollectorConfig } from "@/lib/collectors/types";
import {
  addCollectionItem,
  addCollectionRun,
  addStoredCollectionActivity,
  getCollectionItems,
  getCollectionRuns,
  getStoredCollectionActivities,
  updateCollectionRun,
  type CollectionRunRecord
} from "@/lib/collection-store";
import { getServerSupabase } from "@/lib/supabase";
import type { Activity, IntelligenceInput } from "@/lib/types";

export type ManualCollectionPayload = {
  brand: string;
  platform: "小红书" | "微信小程序";
  title: string;
  source_url: string;
  publish_date: string;
  raw_text: string;
  image_urls?: string[];
  uploaded_by?: string;
  notes?: string;
};

export async function runAutomaticCollection(config: Partial<CollectorConfig> = {}) {
  const finalConfig = { ...defaultCollectorConfig(), ...config, mode: config.mode || getCollectionMode() };
  const blockedPlatforms = getAutomaticPlatformStatuses().filter((platform) => !platform.canRun);
  if (blockedPlatforms.length) {
    const details = blockedPlatforms
      .map((platform) => `${platform.platform} 缺少 ${platform.missingConfig.join("、")}`)
      .join("；");
    throw new Error(`真实接口待配置：${details}。请补齐环境变量后再执行真实采集。`);
  }
  const providers = getCollectorProviders();
  const runs: CollectionRunRecord[] = [];
  const details = [];

  for (const provider of providers) {
    const startedAt = new Date().toISOString();
    const run: CollectionRunRecord = {
      id: randomUUID(),
      platform: provider.platform,
      started_at: startedAt,
      finished_at: null,
      status: "running",
      collected_count: 0,
      inserted_count: 0,
      duplicate_count: 0,
      failed_count: 0,
      error_message: null,
      created_at: startedAt
    };
    addCollectionRun(run);
    await persistCollectionRun(run);

    try {
      const items = await provider.collect(finalConfig);
      run.collected_count = items.length;
      for (const item of items) {
        const result = await processCollectedItem(item, run.id);
        if (result.status === "inserted") run.inserted_count += 1;
        if (result.status === "duplicate") run.duplicate_count += 1;
        if (result.status === "failed") run.failed_count += 1;
      }
      run.status = run.failed_count ? "partial_failed" : "completed";
      run.finished_at = new Date().toISOString();
      updateCollectionRun(run.id, run);
      await persistCollectionRun(run);
      details.push({ platform: provider.platform, status: run.status, collected: items.length, inserted: run.inserted_count });
    } catch (error) {
      run.status = "failed";
      run.failed_count += 1;
      run.error_message = error instanceof Error ? error.message : "采集失败";
      run.finished_at = new Date().toISOString();
      updateCollectionRun(run.id, run);
      await persistCollectionRun(run);
      details.push({ platform: provider.platform, status: run.status, error: run.error_message });
    }
    runs.push(run);
  }

  return {
    mode: finalConfig.mode,
    runs,
    details,
    summary: summarizeRuns(runs)
  };
}

export async function processManualCollection(payload: ManualCollectionPayload) {
  const input: IntelligenceInput = {
    brand: payload.brand,
    platform: payload.platform,
    source_url: payload.source_url,
    title: payload.title,
    publish_date: payload.publish_date,
    raw_text: payload.raw_text,
    image_url: payload.image_urls?.[0] || "",
    screenshot_urls: payload.image_urls || [],
    notes: payload.notes || ""
  };
  const activity = await buildActivityFromInput(input, {
    sourceType: "manual",
    uploadedBy: payload.uploaded_by || "Lottie Zhang",
    externalId: `manual-${hashKey(`${payload.platform}-${payload.source_url}-${payload.title}`)}`,
    accountName: payload.platform
  });

  const duplicate = isDuplicate(activity);
  if (!duplicate) await saveActivity(activity);

  return {
    status: duplicate ? "duplicate" : "inserted",
    activity,
    message: duplicate ? "检测到重复内容，未重复创建情报。" : "人工上传内容已完成 AI 分析并保存到演示情报流。"
  };
}

export async function retryCollectionTask(id?: string) {
  if (!id) return runAutomaticCollection();
  const failed = getCollectionItems().find((item) => item.id === id && item.processing_status === "failed");
  if (!failed) {
    return { status: "not_found", message: "未找到可重试的失败任务。", summary: summarizeRuns(getCollectionRuns()) };
  }
  failed.processing_status = "processing";
  failed.processing_status = "completed";
  return { status: "completed", message: "失败任务已标记为完成。", summary: summarizeRuns(getCollectionRuns()) };
}

async function processCollectedItem(item: CollectedItem, runId: string) {
  const activity = await buildActivityFromInput(
    {
      brand: item.brand,
      platform: item.platform,
      source_url: item.source_url,
      title: item.title,
      publish_date: item.published_at,
      raw_text: item.content,
      image_url: item.image_urls[0] || "",
      screenshot_urls: item.image_urls || [],
      notes: `采集账号：${item.account_name}`
    },
    {
      sourceType: "automatic",
      externalId: item.external_id,
      accountName: item.account_name,
      collectorRunId: runId,
      rawData: item.raw_data
    }
  );

  if (isDuplicate(activity)) {
    const duplicateItem = buildCollectionItem(item, runId, null, "completed");
    addCollectionItem(duplicateItem);
    await persistCollectionItem(duplicateItem);
    return { status: "duplicate" as const };
  }

  try {
    await saveActivity(activity);
    const completedItem = buildCollectionItem(item, runId, activity.id, "completed");
    addCollectionItem(completedItem);
    await persistCollectionItem(completedItem);
    return { status: "inserted" as const };
  } catch {
    const failedItem = buildCollectionItem(item, runId, null, "failed");
    addCollectionItem(failedItem);
    await persistCollectionItem(failedItem);
    return { status: "failed" as const };
  }
}

async function buildActivityFromInput(
  input: IntelligenceInput,
  meta: {
    sourceType: "automatic" | "manual";
    uploadedBy?: string;
    externalId: string;
    accountName: string;
    collectorRunId?: string;
    rawData?: Record<string, unknown>;
  }
): Promise<Activity> {
  const analysis = await analyzeWithFallback(input);
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    batch_id: null,
    brand: input.brand,
    platform: input.platform,
    source_url: input.source_url,
    title: input.title,
    publish_date: input.publish_date,
    raw_text: cleanText(input.raw_text),
    image_url: input.image_url || BRAND_ASSETS[input.brand]?.visual || null,
    screenshot_urls: input.screenshot_urls || [],
    notes: input.notes || null,
    category: analysis.category,
    product_name: analysis.product_name,
    campaign_name: analysis.campaign_name,
    discount: analysis.discount,
    summary: analysis.summary,
    key_points: analysis.key_points,
    target_audience: analysis.target_audience,
    marketing_strategy: analysis.marketing_strategy,
    why_it_matters: analysis.why_it_matters,
    suggested_action_for_clarins: analysis.suggested_action_for_clarins,
    importance_score: analysis.importance_score,
    tags: analysis.tags,
    collection_status: "已保存",
    ai_status: "已完成",
    is_demo: getCollectionMode() === "demo",
    source_type: meta.sourceType,
    collection_method: meta.sourceType === "automatic" ? "自动采集" : "人工上传",
    collector_run_id: meta.collectorRunId || null,
    external_id: meta.externalId,
    account_name: meta.accountName,
    collected_at: now,
    ai_analyzed_at: now,
    sentiment: inferSentiment(input.raw_text),
    confidence_score: inferConfidence(input.raw_text),
    created_by: meta.uploadedBy || (meta.sourceType === "automatic" ? "Collection Agent" : "Lottie Zhang"),
    created_at: now,
    updated_by: meta.uploadedBy || "Collection Agent",
    updated_at: now
  };
}

async function analyzeWithFallback(input: IntelligenceInput) {
  try {
    return await analyzeIntelligence(input);
  } catch {
    return deterministicAnalysis(input);
  }
}

async function saveActivity(activity: Activity) {
  const supabase = getServerSupabase();
  const insertedInMemory = addStoredCollectionActivity(activity);
  if (!supabase) return insertedInMemory;

  const { error } = await supabase.from("activities").insert({
    brand: activity.brand,
    platform: activity.platform === "官网" ? "品牌官网" : activity.platform,
    source_url: activity.source_url,
    title: activity.title,
    publish_date: activity.publish_date,
    raw_text: activity.raw_text,
    image_url: activity.image_url,
    screenshot_urls: activity.screenshot_urls,
    notes: activity.notes,
    category: normalizeLegacyCategory(activity.category),
    product_name: activity.product_name,
    campaign_name: activity.campaign_name,
    discount: activity.discount,
    summary: activity.summary,
    key_points: activity.key_points,
    target_audience: activity.target_audience,
    marketing_strategy: activity.marketing_strategy,
    why_it_matters: activity.why_it_matters,
    suggested_action_for_clarins: activity.suggested_action_for_clarins,
    importance_score: activity.importance_score,
    tags: activity.tags,
    collection_status: activity.collection_status,
    ai_status: activity.ai_status,
    is_demo: activity.is_demo,
    created_by: activity.created_by,
    updated_by: activity.updated_by
  });
  if (error) return insertedInMemory;
  return true;
}

function isDuplicate(activity: Activity) {
  const existing = getStoredCollectionActivities();
  const key = dedupeKey(activity);
  return existing.some((item) => dedupeKey(item) === key || item.source_url === activity.source_url || item.external_id === activity.external_id);
}

function buildCollectionItem(item: CollectedItem, runId: string, intelligenceId: string | null, status: "pending" | "processing" | "completed" | "failed") {
  return {
    id: randomUUID(),
    external_id: item.external_id,
    intelligence_id: intelligenceId,
    platform: item.platform,
    source_type: "automatic" as const,
    source_url: item.source_url,
    raw_data: item.raw_data,
    collection_run_id: runId,
    processing_status: status,
    created_at: new Date().toISOString()
  };
}

export function getCollectionStatus() {
  const runs = getCollectionRuns();
  const activities = getStoredCollectionActivities();
  const today = "2026-07-23";
  const automaticPlatforms = getAutomaticPlatformStatuses();
  return {
    mode: getCollectionMode(),
    todayAutomatic: activities.filter((item) => item.source_type === "automatic" && item.publish_date === today).length,
    todayManual: activities.filter((item) => item.source_type === "manual" && item.publish_date === today).length,
    pending: getCollectionItems().filter((item) => item.processing_status === "pending" || item.processing_status === "processing").length,
    failed: getCollectionItems().filter((item) => item.processing_status === "failed").length,
    lastRunAt: runs[0]?.finished_at || null,
    nextRunAt: "2026-07-24 09:00",
    platformStatus: [
      ...automaticPlatforms,
      manualPlatformStatus("小红书", activities.filter((item) => item.platform === "小红书").length),
      manualPlatformStatus("微信小程序", activities.filter((item) => item.platform === "微信小程序").length)
    ],
    runs
  };
}

function getAutomaticPlatformStatuses() {
  return [automaticPlatformStatus("微信公众号"), automaticPlatformStatus("微博")];
}

function automaticPlatformStatus(platform: "微信公众号" | "微博") {
  const activities = getStoredCollectionActivities().filter((item) => item.platform === platform);
  const provider = process.env[platform === "微信公众号" ? "WECHAT_COLLECTOR_PROVIDER" : "WEIBO_COLLECTOR_PROVIDER"];
  const apiKey = process.env[platform === "微信公众号" ? "WECHAT_COLLECTOR_API_KEY" : "WEIBO_COLLECTOR_API_KEY"];
  const baseUrl = process.env[platform === "微信公众号" ? "WECHAT_COLLECTOR_BASE_URL" : "WEIBO_COLLECTOR_BASE_URL"];
  const isLiveProvider = provider === "live";
  const missingConfig = [
    ...(isLiveProvider && !apiKey ? ["API Key"] : []),
    ...(isLiveProvider && !baseUrl ? ["Base URL"] : [])
  ];

  if (!isLiveProvider) {
    return {
      platform,
      accessType: "自动采集",
      status: "Demo 模式",
      healthText: "模拟采集正常",
      description: "当前使用模拟数据，配置真实接口后可切换至 Live Mode",
      missingConfig: [],
      canRun: true,
      actionLabel: "Run Demo Collection",
      metricLabel: "今日生成演示内容",
      lastSyncAt: getCollectionRuns().find((run) => run.platform === platform)?.finished_at || null,
      todayCount: activities.filter((item) => item.publish_date === "2026-07-23").length
    };
  }

  if (missingConfig.length) {
    return {
      platform,
      accessType: "自动采集",
      status: "真实接口待配置",
      healthText: `缺少 ${missingConfig.join("、")}`,
      description: "补齐真实 Provider 的环境变量后才会允许执行采集。",
      missingConfig,
      canRun: false,
      actionLabel: "配置后可采集",
      metricLabel: "今日新增",
      lastSyncAt: getCollectionRuns().find((run) => run.platform === platform)?.finished_at || null,
      todayCount: activities.filter((item) => item.publish_date === "2026-07-23").length
    };
  }

  return {
    platform,
    accessType: "自动采集",
    status: "Live 模式",
    healthText: "真实采集已启用",
    description: "真实接口配置完整，将调用外部 Provider 获取公开数据。",
    missingConfig: [],
    canRun: true,
    actionLabel: "立即采集",
    metricLabel: "今日新增",
    lastSyncAt: getCollectionRuns().find((run) => run.platform === platform)?.finished_at || null,
    todayCount: activities.filter((item) => item.publish_date === "2026-07-23").length
  };
}

function manualPlatformStatus(platform: "小红书" | "微信小程序", todayCount: number) {
  return {
    platform,
    accessType: "人工上传",
    status: "可用",
    healthText: "人工录入入口可用",
    description: "粘贴公开内容或 OCR 文本后进入统一 AI 分析流程。",
    missingConfig: [],
    canRun: true,
    actionLabel: "去上传",
    metricLabel: "今日人工上传",
    lastSyncAt: null,
    todayCount
  };
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function dedupeKey(activity: Activity) {
  return [
    activity.external_id || "",
    activity.source_url || "",
    activity.platform,
    activity.account_name || "",
    activity.publish_date,
    activity.title,
    hashKey(activity.raw_text)
  ].join("|");
}

function hashKey(text: string) {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function inferSentiment(text: string) {
  if (/负面|投诉|翻车|争议|不满|失败/.test(text)) return "negative";
  if (/增长|热议|好评|升温|积极|预约|礼遇/.test(text)) return "positive";
  return "neutral";
}

function inferConfidence(text: string) {
  return Math.min(0.96, Math.max(0.62, Number((text.length / 500).toFixed(2))));
}

function normalizeLegacyCategory(category: string) {
  if (category === "促销活动") return "促销";
  if (category === "达人合作") return "明星合作";
  if (["会员权益", "社交媒体话题", "线下活动"].includes(category)) return "其他品牌动态";
  return category;
}

function summarizeRuns(runs: CollectionRunRecord[]) {
  return {
    collected_count: runs.reduce((sum, run) => sum + run.collected_count, 0),
    inserted_count: runs.reduce((sum, run) => sum + run.inserted_count, 0),
    duplicate_count: runs.reduce((sum, run) => sum + run.duplicate_count, 0),
    failed_count: runs.reduce((sum, run) => sum + run.failed_count, 0)
  };
}

async function persistCollectionRun(run: CollectionRunRecord) {
  const supabase = getServerSupabase();
  if (!supabase) return;
  await supabase.from("collection_runs").upsert({
    id: run.id,
    platform: run.platform,
    started_at: run.started_at,
    finished_at: run.finished_at,
    status: run.status,
    collected_count: run.collected_count,
    inserted_count: run.inserted_count,
    duplicate_count: run.duplicate_count,
    failed_count: run.failed_count,
    error_message: run.error_message,
    created_at: run.created_at
  });
}

async function persistCollectionItem(item: ReturnType<typeof buildCollectionItem>) {
  const supabase = getServerSupabase();
  if (!supabase) return;
  await supabase.from("collection_items").upsert({
    id: item.id,
    external_id: item.external_id,
    intelligence_id: item.intelligence_id,
    platform: item.platform,
    source_type: item.source_type,
    source_url: item.source_url,
    raw_data: item.raw_data,
    collection_run_id: item.collection_run_id,
    processing_status: item.processing_status,
    created_at: item.created_at
  });
}
