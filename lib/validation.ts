import { z } from "zod";
import { BRANDS, CATEGORIES, PLATFORMS } from "@/lib/constants";

export const intelligenceInputSchema = z.object({
  brand: z.enum(BRANDS),
  platform: z.enum(PLATFORMS),
  source_url: z.string().url("请输入有效原文链接"),
  title: z.string().min(2, "请输入标题"),
  publish_date: z.string().min(1, "请选择发布时间"),
  raw_text: z.string().min(20, "正文内容至少需要 20 个字符"),
  image_url: z.string().url("请输入有效图片链接").optional().or(z.literal("")),
  screenshot_urls: z.array(z.string()).optional().default([]),
  notes: z.string().optional()
});

export const aiAnalysisSchema = z.object({
  brand: z.string().optional(),
  category: z.enum(CATEGORIES),
  productName: z.string().optional(),
  product_name: z.string().optional(),
  publishDate: z.string().optional(),
  platform: z.string().optional(),
  campaign: z.string().optional(),
  campaign_name: z.string().optional(),
  discount: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  summary: z.string(),
  marketingInsight: z.string().optional(),
  key_points: z.array(z.string()).optional(),
  target_audience: z.string().optional(),
  marketing_strategy: z.string().optional(),
  why_it_matters: z.string().optional(),
  suggested_action_for_clarins: z.string().optional(),
  importance_score: z.number().min(1).max(10).optional(),
  tags: z.array(z.string()).optional()
}).transform((value) => {
  const keywords = value.keywords || value.tags || value.key_points || [];
  const marketingInsight = value.marketingInsight || value.marketing_strategy || "未明确";
  return {
    brand: value.brand,
    category: value.category,
    product_name: value.productName || value.product_name || "未明确",
    campaign_name: value.campaign || value.campaign_name || "未明确",
    discount: value.discount || "未提及",
    summary: value.summary,
    key_points: value.key_points || keywords,
    target_audience: value.target_audience || "未明确",
    marketing_strategy: marketingInsight,
    why_it_matters: value.why_it_matters || marketingInsight,
    suggested_action_for_clarins: value.suggested_action_for_clarins || "建议纳入本周竞品观察，并结合自有 CRM 节奏评估是否需要跟进。",
    importance_score: value.importance_score || 7,
    tags: keywords
  };
});

export const batchImportSchema = z.object({
  brand: z.string().optional().or(z.literal("")),
  links: z.string().min(1, "请至少粘贴一个小红书链接"),
  default_notes: z.string().optional()
});

export const batchManualCompletionSchema = z.object({
  batch_item_id: z.string().uuid(),
  brand: z.string().optional().or(z.literal("")),
  title: z.string().min(2, "请输入标题"),
  publish_date: z.string().min(1, "请选择发布时间"),
  raw_text: z.string().min(20, "正文内容至少需要 20 个字符"),
  image_url: z.string().url("请输入有效图片链接").optional().or(z.literal("")),
  notes: z.string().optional()
});
