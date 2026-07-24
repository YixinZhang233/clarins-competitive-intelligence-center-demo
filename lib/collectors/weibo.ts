import type { CollectedItem, CollectorConfig, CollectorProvider } from "@/lib/collectors/types";
import { createDemoCollector } from "@/lib/collectors/demo";

export class WeiboCollector implements CollectorProvider {
  platform = "微博" as const;

  async collect(config: CollectorConfig): Promise<CollectedItem[]> {
    if (config.mode === "demo" || !process.env.WEIBO_COLLECTOR_BASE_URL || !process.env.WEIBO_COLLECTOR_API_KEY) {
      return createDemoCollector("微博").collect(config);
    }

    const response = await fetch(`${process.env.WEIBO_COLLECTOR_BASE_URL.replace(/\/$/, "")}/collect`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WEIBO_COLLECTOR_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      throw new Error(`微博采集接口返回 ${response.status}`);
    }

    const payload = await response.json();
    return Array.isArray(payload.items) ? payload.items : [];
  }
}
