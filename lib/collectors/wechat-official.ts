import type { CollectedItem, CollectorConfig, CollectorProvider } from "@/lib/collectors/types";
import { createDemoCollector } from "@/lib/collectors/demo";

export class WechatOfficialCollector implements CollectorProvider {
  platform = "微信公众号" as const;

  async collect(config: CollectorConfig): Promise<CollectedItem[]> {
    if (config.mode === "demo" || !process.env.WECHAT_COLLECTOR_BASE_URL || !process.env.WECHAT_COLLECTOR_API_KEY) {
      return createDemoCollector("微信公众号").collect(config);
    }

    const response = await fetch(`${process.env.WECHAT_COLLECTOR_BASE_URL.replace(/\/$/, "")}/collect`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WECHAT_COLLECTOR_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      throw new Error(`微信公众号采集接口返回 ${response.status}`);
    }

    const payload = await response.json();
    return Array.isArray(payload.items) ? payload.items : [];
  }
}
