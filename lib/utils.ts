import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CATEGORIES } from "@/lib/constants";
import { isPromotion } from "@/lib/activity-metadata";
import type { Activity, BrandGroup } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(date));
}

export function groupActivitiesByBrand(activities: Activity[], brands: readonly string[]): BrandGroup[] {
  return brands.map((brand) => {
    const all = activities
      .filter((activity) => activity.brand === brand)
      .sort((a, b) => new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime());

    return {
      brand,
      latestProduct: latestByCategory(all, "新品"),
      latestCampaign: latestByCategory(all, "Campaign"),
      latestPromotion: all.filter((activity) => isPromotion(activity.category))[0],
      latestUpdate: latestByCategory(all, "其他品牌动态"),
      all
    };
  });
}

export function latestByCategory(activities: Activity[], category: string) {
  return activities
    .filter((activity) => activity.category === category)
    .sort((a, b) => new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime())[0];
}

export function csvEscape(value: unknown) {
  const text = Array.isArray(value) ? value.join("；") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function activitiesToCsv(activities: Activity[]) {
  const headers = [
    "品牌",
    "发布日期",
    "平台",
    "产品名称",
    "类型",
    "活动",
    "折扣",
    "关键词",
    "AI 摘要",
    "营销洞察",
    "上传人",
    "上传时间",
    "原文链接",
    "标题",
    "产品名",
    "Campaign 名称",
    "核心卖点",
    "目标人群",
    "为什么重要",
    "建议动作",
    "重要性评分",
    "标签"
  ];
  const rows = activities.map((activity) => [
    activity.brand,
    activity.publish_date,
    activity.platform,
    activity.product_name,
    activity.category,
    activity.campaign_name,
    activity.discount,
    activity.tags,
    activity.summary,
    activity.marketing_strategy,
    activity.created_by || "未记录",
    activity.created_at,
    activity.source_url,
    activity.title,
    activity.product_name,
    activity.campaign_name,
    activity.key_points,
    activity.target_audience,
    activity.why_it_matters,
    activity.suggested_action_for_clarins,
    activity.importance_score,
    activity.tags
  ]);
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function activitiesToMarkdown(activities: Activity[]) {
  if (!activities.length) {
    return "# 娇韵诗竞品情报报告\n\n暂无竞品资料，请先添加真实链接。\n";
  }

  const lines = ["# 娇韵诗竞品情报报告", ""];
  for (const activity of activities) {
    lines.push(`## ${activity.brand}｜${activity.title}`);
    lines.push("");
    lines.push(`- 平台：${activity.platform}`);
    lines.push(`- 发布时间：${activity.publish_date}`);
    lines.push(`- 分类：${activity.category}`);
    lines.push(`- 折扣/权益：${activity.discount || "未提及"}`);
    lines.push(`- 上传人：${activity.created_by || "未记录"}`);
    lines.push(`- 上传时间：${activity.created_at}`);
    lines.push(`- 重要性：${activity.importance_score}/10`);
    lines.push(`- 原文链接：${activity.source_url}`);
    lines.push(`- 目标人群：${activity.target_audience || "未明确"}`);
    lines.push(`- 营销策略：${activity.marketing_strategy || "未明确"}`);
    lines.push("");
    lines.push(`**AI 摘要**：${activity.summary}`);
    lines.push("");
    lines.push(`**为什么重要**：${activity.why_it_matters}`);
    lines.push("");
    lines.push(`**建议动作**：${activity.suggested_action_for_clarins}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function emptyCategoryMap() {
  return Object.fromEntries(CATEGORIES.map((category) => [category, undefined]));
}
