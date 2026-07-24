export type CollectorConfig = {
  enabled?: boolean;
  frequency?: "daily" | "hourly";
  runTime?: string;
  brands: string[];
  accounts: string[];
  maxItems: number;
  autoAnalyze: boolean;
  includeDaily: boolean;
  includeWeekly: boolean;
  mode: "demo" | "live";
};

export type CollectedItem = {
  external_id: string;
  platform: "微信公众号" | "微博";
  brand: string;
  account_name: string;
  title: string;
  content: string;
  published_at: string;
  source_url: string;
  image_urls: string[];
  raw_data: Record<string, unknown>;
};

export type CollectorResult = {
  platform: string;
  items: CollectedItem[];
  error?: string;
};

export interface CollectorProvider {
  platform: "微信公众号" | "微博";
  collect(config: CollectorConfig): Promise<CollectedItem[]>;
}
