import { demoToday, isPromotion } from "@/lib/activity-metadata";
import type { Activity } from "@/lib/types";

export type ReportKind = "daily" | "weekly";

export function filterReportActivities(activities: Activity[], kind: ReportKind) {
  const today = demoToday();
  const from = new Date(today);
  from.setDate(today.getDate() - (kind === "daily" ? 1 : 7));
  return activities.filter((activity) => {
    const publishDate = new Date(`${activity.publish_date}T12:00:00+08:00`);
    return publishDate >= from && publishDate <= today;
  });
}

export function buildReportMarkdown(activities: Activity[], kind: ReportKind) {
  const title = kind === "daily" ? "娇韵诗竞品情报日报" : "娇韵诗竞品情报周报";
  const scoped = [...activities].sort((a, b) => b.importance_score - a.importance_score);
  const lines = [
    `# ${title}`,
    "",
    "生成日期：2026-07-23",
    "数据说明：本报告基于 Demo 模拟情报生成，仅用于产品功能演示，不代表真实市场事实。",
    ""
  ];

  if (!scoped.length) {
    lines.push("当前周期暂无可用于报告的竞品资料。");
    return lines.join("\n");
  }

  if (kind === "daily") {
    appendDailyReport(lines, scoped);
  } else {
    appendWeeklyReport(lines, scoped);
  }

  return lines.join("\n");
}

function appendDailyReport(lines: string[], activities: Activity[]) {
  lines.push("## 今日总览", "");
  lines.push(`- 今日新增情报数：${activities.length}`);
  lines.push(`- 涉及品牌：${unique(activities.map((activity) => activity.brand)).join("、")}`);
  lines.push(`- 重点新品：${titlesByCategory(activities, "新品")}`);
  lines.push(`- 重点 Campaign：${titlesByCategory(activities, "Campaign")}`);
  lines.push(`- 重点促销：${titlesByPromotion(activities)}`);
  lines.push(`- 热门关键词：${topKeywords(activities, 8).map(([keyword]) => keyword).join("、")}`);
  lines.push("");

  appendHighlights(lines, activities.slice(0, 6));

  lines.push("## AI 总结", "");
  lines.push(
    "今日模拟情报显示，竞品主要围绕新品试用、夏季修护和社交平台视觉内容发力。高端护肤品牌更倾向于用服务权益与品牌故事承接转化，彩妆品牌则通过新色试色和话题互动快速提升声量。"
  );
  lines.push("");
  lines.push("## 对娇韵诗的建议", "");
  lines.push("- 优先补齐七夕和夏季护理节点的会员触达内容，强调护肤服务与长期陪伴价值。");
  lines.push("- 将重点新品和明星单品拆成小红书、抖音、公众号三种不同内容表达，避免同一套文案重复投放。");
  lines.push("- 对比竞品礼赠门槛，检查自有官网和私域权益是否有清晰购买理由。");
}

function appendWeeklyReport(lines: string[], activities: Activity[]) {
  lines.push("## 本周总览", "");
  lines.push(`- 本周情报总量：${activities.length}`);
  lines.push(`- 品牌活跃度排名：${ranking(activities, "brand").join("；")}`);
  lines.push(`- 平台分布：${ranking(activities, "platform").join("；")}`);
  lines.push(`- 类型分布：${ranking(activities, "category").join("；")}`);
  lines.push(`- 热门关键词：${topKeywords(activities, 10).map(([keyword, count]) => `${keyword}(${count})`).join("、")}`);
  lines.push("");

  lines.push("## 趋势观察", "");
  lines.push(`- 新品趋势：${countByCategory(activities, "新品")} 条，集中在轻盈修护、抗老面霜、新色试色和经典单品升级。`);
  lines.push(`- Campaign 趋势：${countByCategory(activities, "Campaign")} 条，强调夏季、防晒、高端修护和夜间修护。`);
  lines.push(`- 促销趋势：${activities.filter((activity) => isPromotion(activity.category)).length} 条，主要采用会员礼赠、满赠、套装和服务权益。`);
  lines.push("");

  appendHighlights(lines, activities.slice(0, 8));

  lines.push("## 竞争风险", "");
  lines.push("- 竞品在夏季修护、七夕礼盒和会员权益上形成多渠道触达，可能分散目标用户注意力。");
  lines.push("- 部分品牌将官网专题、社交话题和会员权益串联，转化链路比单点活动更完整。");
  lines.push("");
  lines.push("## 机会点", "");
  lines.push("- 娇韵诗可以强化“服务型权益 + 护肤专业建议”的差异，避免卷入单纯赠品比较。");
  lines.push("- 将线下护理、会员课堂和节日礼盒整合为可持续跟进的 CRM 触达链路。");
  lines.push("");
  lines.push("## 下周建议动作", "");
  lines.push("- 复盘竞品七夕礼盒、会员礼赠和新品试用的权益门槛，输出一页对比表。");
  lines.push("- 为重点会员人群准备两套触达话术：高端修护线和节日送礼线。");
  lines.push("- 每日监控小红书与抖音高互动评论，记录真实用户对肤感、价格和赠品的关注点。");
}

function appendHighlights(lines: string[], activities: Activity[]) {
  lines.push("## 重点动态", "");
  for (const activity of activities) {
    lines.push(`### ${activity.brand}｜${activity.title}`);
    lines.push("");
    lines.push(`- 平台：${activity.platform}`);
    lines.push(`- 类型：${activity.category}`);
    lines.push(`- 发布日期：${activity.publish_date}`);
    lines.push(`- 折扣/权益：${activity.discount || "未提及"}`);
    lines.push(`- 上传人：${activity.created_by || "未记录"}`);
    lines.push(`- AI 摘要：${activity.summary}`);
    lines.push(`- 营销洞察：${activity.marketing_strategy}`);
    lines.push(`- 建议动作：${activity.suggested_action_for_clarins}`);
    lines.push("");
  }
}

function titlesByCategory(activities: Activity[], category: string) {
  const titles = activities.filter((activity) => activity.category === category).map((activity) => activity.title);
  return titles.length ? titles.join("；") : "暂无";
}

function titlesByPromotion(activities: Activity[]) {
  const titles = activities.filter((activity) => isPromotion(activity.category)).map((activity) => activity.title);
  return titles.length ? titles.join("；") : "暂无";
}

function countByCategory(activities: Activity[], category: string) {
  return activities.filter((activity) => activity.category === category).length;
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function ranking(activities: Activity[], key: "brand" | "platform" | "category") {
  const counts = new Map<string, number>();
  for (const activity of activities) {
    counts.set(activity[key], (counts.get(activity[key]) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => `${label} ${count} 条`);
}

function topKeywords(activities: Activity[], limit: number) {
  const counts = new Map<string, number>();
  for (const activity of activities) {
    for (const tag of activity.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}
