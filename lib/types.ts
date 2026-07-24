import type { BRANDS, CATEGORIES, PLATFORMS } from "@/lib/constants";

export type Brand = (typeof BRANDS)[number];
export type Platform = (typeof PLATFORMS)[number];
export type ActivityCategory = (typeof CATEGORIES)[number];

export type Activity = {
  id: string;
  batch_id: string | null;
  brand: string;
  platform: string;
  source_url: string;
  title: string;
  publish_date: string;
  raw_text: string;
  image_url: string | null;
  screenshot_urls: string[];
  notes: string | null;
  category: string;
  product_name: string | null;
  campaign_name: string | null;
  discount: string | null;
  summary: string;
  key_points: string[];
  target_audience: string;
  marketing_strategy: string;
  why_it_matters: string;
  suggested_action_for_clarins: string;
  importance_score: number;
  tags: string[];
  collection_status: string;
  ai_status: string;
  is_demo: boolean;
  source_type?: "automatic" | "manual" | "demo";
  collection_method?: "自动采集" | "人工上传" | "Demo Mode";
  collector_run_id?: string | null;
  external_id?: string | null;
  account_name?: string | null;
  collected_at?: string | null;
  ai_analyzed_at?: string | null;
  sentiment?: string | null;
  confidence_score?: number | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
};

export type IntelligenceInput = {
  brand: string;
  platform: string;
  source_url: string;
  title: string;
  publish_date: string;
  raw_text: string;
  image_url?: string;
  screenshot_urls?: string[];
  notes?: string;
};

export type AiAnalysis = {
  brand?: string;
  category: ActivityCategory;
  product_name: string;
  campaign_name: string;
  discount: string;
  summary: string;
  key_points: string[];
  target_audience: string;
  marketing_strategy: string;
  why_it_matters: string;
  suggested_action_for_clarins: string;
  importance_score: number;
  tags: string[];
};

export type BatchImport = {
  id: string;
  created_at: string;
  total_links: number;
  success_count: number;
  needs_manual_count: number;
  failed_count: number;
  created_by: string | null;
  default_brand: string | null;
  default_notes: string | null;
};

export type BatchItemStatus =
  | "已完成"
  | "需要人工补充正文"
  | "链接无效"
  | "页面不可访问"
  | "AI分析失败"
  | "已保存";

export type BatchItem = {
  id: string;
  batch_id: string;
  source_url: string;
  status: BatchItemStatus;
  brand: string | null;
  title: string | null;
  publish_date: string | null;
  raw_text: string | null;
  image_url: string | null;
  summary: string | null;
  error_message: string | null;
  activity_id: string | null;
  created_at: string;
  updated_at: string;
};

export type BrandGroup = {
  brand: string;
  latestProduct?: Activity;
  latestCampaign?: Activity;
  latestPromotion?: Activity;
  latestUpdate?: Activity;
  all: Activity[];
};
