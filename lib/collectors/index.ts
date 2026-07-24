import { WechatOfficialCollector } from "@/lib/collectors/wechat-official";
import { WeiboCollector } from "@/lib/collectors/weibo";
import type { CollectorConfig, CollectorProvider } from "@/lib/collectors/types";

export function getCollectionMode(): "demo" | "live" {
  const liveWechat = process.env.WECHAT_COLLECTOR_PROVIDER === "live" && process.env.WECHAT_COLLECTOR_API_KEY && process.env.WECHAT_COLLECTOR_BASE_URL;
  const liveWeibo = process.env.WEIBO_COLLECTOR_PROVIDER === "live" && process.env.WEIBO_COLLECTOR_API_KEY && process.env.WEIBO_COLLECTOR_BASE_URL;
  return liveWechat || liveWeibo ? "live" : "demo";
}

export function getCollectorProviders(): CollectorProvider[] {
  return [new WechatOfficialCollector(), new WeiboCollector()];
}

export function defaultCollectorConfig(): CollectorConfig {
  return {
    enabled: true,
    frequency: "daily",
    runTime: "09:00",
    brands: ["兰蔻", "海蓝之谜", "YSL 圣罗兰", "科颜氏", "资生堂", "雅诗兰黛"],
    accounts: ["官方公众号", "官方微博"],
    maxItems: 4,
    autoAnalyze: true,
    includeDaily: true,
    includeWeekly: true,
    mode: getCollectionMode()
  };
}
