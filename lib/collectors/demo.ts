import { BRAND_ASSETS } from "@/lib/constants";
import type { CollectedItem, CollectorConfig, CollectorProvider } from "@/lib/collectors/types";

const today = "2026-07-23";

export function createDemoCollector(platform: "微信公众号" | "微博"): CollectorProvider {
  return {
    platform,
    async collect(config: CollectorConfig) {
      const brands = config.brands.length ? config.brands : ["兰蔻", "海蓝之谜", "YSL 圣罗兰", "科颜氏"];
      const maxItems = Math.max(1, Math.min(config.maxItems || 4, 8));
      return brands.slice(0, maxItems).map((brand, index) => buildDemoItem(platform, brand, index));
    }
  };
}

function buildDemoItem(platform: "微信公众号" | "微博", brand: string, index: number): CollectedItem {
  const source = platform === "微信公众号" ? "official-account" : "weibo-official";
  const topic = platform === "微信公众号" ? "会员夏季护理内容更新" : "夏季 Campaign 社交话题更新";
  const title = `${brand}${platform === "微信公众号" ? "会员护理内容" : "夏季社交话题"} Demo Mode 采集`;
  return {
    external_id: `demo-${platform}-${brand}-${today}`,
    platform,
    brand,
    account_name: `${brand}${platform === "微信公众号" ? "官方公众号" : "官方微博"}`,
    title,
    content: `【Demo Mode 自动采集】${brand}在${platform}发布${topic}。内容包含新品、会员权益与活动视觉等公开风格信息，本条为模拟情报，不代表真实市场事实。`,
    published_at: today,
    source_url: `https://example.com/${source}/${encodeURIComponent(brand)}/${today}`,
    image_urls: [BRAND_ASSETS[brand]?.visual].filter(Boolean) as string[],
    raw_data: {
      demo: true,
      index,
      source,
      generated_at: new Date().toISOString()
    }
  };
}
