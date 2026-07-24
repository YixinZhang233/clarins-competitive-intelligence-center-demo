import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getActivityWindow, isPromotion } from "@/lib/activity-metadata";
import { getActivities } from "@/lib/supabase";
import type { Activity } from "@/lib/types";

export async function GET() {
  const activities = await getActivities();
  const workbook = XLSX.utils.book_new();

  appendSheet(workbook, "情报明细", activities.map(toDetailRow), [
    16, 34, 14, 14, 14, 14, 14, 16, 20, 20, 24, 30, 48, 48, 48, 18, 14, 14, 12, 12
  ]);
  appendSheet(workbook, "品牌汇总", buildSummaryRows(activities, "brand"), [18, 12, 12, 14, 14, 16]);
  appendSheet(workbook, "平台分布", buildDistributionRows(activities, "platform"), [16, 12, 16]);
  appendSheet(workbook, "类型分布", buildDistributionRows(activities, "category"), [18, 12, 16]);
  appendSheet(workbook, "热门关键词", buildKeywordRows(activities), [18, 12, 24]);
  appendSheet(workbook, "建议动作", activities.map(toActionRow), [16, 34, 18, 54, 14, 18]);

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Clarins-Competitive-Intelligence-2026-07-23.xlsx"'
    }
  });
}

function toDetailRow(activity: Activity) {
  const window = getActivityWindow(activity);
  return {
    品牌: activity.brand,
    标题: activity.title,
    类型: activity.category,
    平台: activity.platform,
    发布时间: activity.publish_date,
    活动开始时间: window.start,
    活动结束时间: window.end,
    数据来源: activity.source_type === "automatic" ? "Automatic Collection" : activity.source_type === "manual" ? "Manual Upload" : activity.is_demo ? "Demo Mode" : activity.collection_method || "Manual Upload",
    采集时间: activity.collected_at || activity.created_at,
    AI分析时间: activity.ai_analyzed_at || activity.updated_at,
    折扣权益: activity.discount || "未提及",
    关键词: (activity.tags || []).join("；"),
    "AI 摘要": activity.summary,
    "AI 洞察": activity.marketing_strategy || "",
    建议动作: activity.suggested_action_for_clarins || "",
    上传人: activity.created_by || "未记录",
    情绪倾向: activity.sentiment || "neutral",
    置信度: activity.confidence_score ? `${Math.round(activity.confidence_score * 100)}%` : "",
    Demo标记: activity.is_demo ? "Demo 模拟数据" : "正式数据"
  };
}

function toActionRow(activity: Activity) {
  return {
    品牌: activity.brand,
    标题: activity.title,
    类型: activity.category,
    建议动作: activity.suggested_action_for_clarins || "",
    发布时间: activity.publish_date,
    上传人: activity.created_by || "未记录"
  };
}

function buildSummaryRows(activities: Activity[], key: "brand") {
  const groups = groupBy(activities, key);
  return [...groups.entries()]
    .map(([label, rows]) => ({
      品牌: label,
      情报总数: rows.length,
      新品数量: rows.filter((activity) => activity.category === "新品").length,
      Campaign数量: rows.filter((activity) => activity.category === "Campaign").length,
      促销数量: rows.filter((activity) => isPromotion(activity.category)).length,
      最近更新时间: rows.map((activity) => activity.updated_at || activity.publish_date).sort().at(-1) || ""
    }))
    .sort((a, b) => b.情报总数 - a.情报总数);
}

function buildDistributionRows(activities: Activity[], key: "platform" | "category") {
  const groups = groupBy(activities, key);
  return [...groups.entries()]
    .map(([label, rows]) => ({
      名称: label,
      数量: rows.length,
      占比: `${Math.round((rows.length / Math.max(activities.length, 1)) * 100)}%`
    }))
    .sort((a, b) => b.数量 - a.数量);
}

function buildKeywordRows(activities: Activity[]) {
  const counts = new Map<string, number>();
  for (const activity of activities) {
    for (const tag of activity.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([keyword, count]) => ({
      关键词: keyword,
      出现次数: count,
      相关品牌: [...new Set(activities.filter((activity) => activity.tags?.includes(keyword)).map((activity) => activity.brand))].join("、")
    }));
}

function groupBy(activities: Activity[], key: "brand" | "platform" | "category") {
  const groups = new Map<string, Activity[]>();
  for (const activity of activities) {
    const label = activity[key];
    groups.set(label, [...(groups.get(label) || []), activity]);
  }
  return groups;
}

function appendSheet(workbook: XLSX.WorkBook, name: string, rows: Record<string, unknown>[], widths: number[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = widths.map((wch) => ({ wch }));
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");
  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: column })];
    if (cell) cell.s = { font: { bold: true } };
  }
  XLSX.utils.book_append_sheet(workbook, worksheet, name);
}
