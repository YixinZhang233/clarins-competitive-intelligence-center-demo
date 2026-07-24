import { BRANDS } from "@/lib/constants";
import { createLlmAdapter } from "@/lib/llm/providers";
import { aiAnalysisSchema } from "@/lib/validation";
import type { AiAnalysis, IntelligenceInput } from "@/lib/types";

export async function analyzeIntelligence(input: IntelligenceInput): Promise<AiAnalysis> {
  const llm = createLlmAdapter();
  if (!llm) {
    throw new Error("LLM_API_KEY 未配置。请在本地 .env.local 或 Vercel 环境变量中设置 LLM_PROVIDER、LLM_API_KEY、LLM_BASE_URL、LLM_MODEL 后再分析。");
  }

  const parsed = await llm.completeJson([
    {
      role: "system",
      content:
        `你是品牌市场团队的竞品营销情报分析助手。只基于用户提供的标题、正文、平台、链接、截图说明和备注分析，不要编造未提供的信息。必须只输出严格 JSON，不要 Markdown。JSON 字段必须包含：brand, productName, category, publishDate, platform, campaign, discount, keywords, summary, marketingInsight。brand 如果用户未提供，请只从这些品牌中判断：${BRANDS.join("、")}；无法判断时输出空字符串。category 只能是：新品、Campaign、促销、促销活动、会员权益、节日营销、社交媒体话题、达人合作、线下活动、其他品牌动态。discount 无法确认时输出“未提及”。keywords 输出 3-6 个中文关键词。summary 用 1-2 句概括事实。marketingInsight 输出对品牌市场/CRM团队有用的分析。中文输出，专业自然。`
    },
    {
      role: "user",
      content: JSON.stringify(input, null, 2)
    }
  ]);

  try {
    return aiAnalysisSchema.parse(parsed);
  } catch (error) {
    throw new Error(`LLM 返回 JSON 字段不符合要求：${error instanceof Error ? error.message : "请检查字段完整性"}`);
  }
}

export function deterministicAnalysis(input: IntelligenceInput): AiAnalysis {
  const text = `${input.title}\n${input.raw_text}\n${input.notes || ""}`;
  const category = inferCategory(text);
  const tags = inferTags(text);
  const productName = inferProductName(input.title, category);
  const campaignName = ["Campaign", "促销", "促销活动", "会员权益", "节日营销", "达人合作", "线下活动"].includes(category) ? input.title : "未明确";

  return {
    brand: inferBrandFromText(text) || input.brand,
    category,
    product_name: productName,
    campaign_name: campaignName,
    discount: inferDiscount(text),
    summary: `${input.brand}在${input.platform}发布了「${input.title}」。系统已基于标题、正文与备注提取核心营销信号。`,
    key_points: buildKeyPoints(text, category),
    target_audience: inferTargetAudience(text, category),
    marketing_strategy: inferMarketingStrategy(text, category),
    why_it_matters: buildWhyItMatters(input.brand, category),
    suggested_action_for_clarins: buildSuggestedAction(category),
    importance_score: inferImportance(text, category),
    tags
  };
}

export function inferBrandFromText(text: string) {
  return BRANDS.find((brand) => text.includes(brand) || text.toLowerCase().includes(brand.toLowerCase())) || "";
}

function inferCategory(text: string): AiAnalysis["category"] {
  const lower = text.toLowerCase();
  if (/(明星|代言|大使|同款|大片|达人|kol|koc|celebrity)/i.test(lower)) return "达人合作";
  if (/(会员|积分|等级|生日|私域|vip|loyalty)/i.test(lower)) return "会员权益";
  if (/(快闪|门店|到店|沙龙|线下|预约|pop-up)/i.test(lower)) return "线下活动";
  if (/(七夕|情人节|母亲节|父亲节|春节|圣诞|节日|礼盒)/i.test(lower)) return "节日营销";
  if (/(新品|上市|首发|焕新|新升级|new|launch)/i.test(lower)) return "新品";
  if (/(618|双11|优惠|折扣|满赠|礼赠|预售|套装|大促|coupon|promotion)/i.test(lower)) return "促销活动";
  if (/(campaign|活动|快闪|直播|会员日|联名|体验|pop-up)/i.test(lower)) return "Campaign";
  if (/(话题|评论|点赞|收藏|种草|短视频|小红书|微博|抖音)/i.test(lower)) return "社交媒体话题";
  return "其他品牌动态";
}

function inferTags(text: string) {
  const candidates = ["新品", "Campaign", "会员", "618", "限定", "礼赠", "直播", "小红书", "高端护肤", "彩妆", "香水", "CRM", "达人种草", "达人合作", "节日营销"];
  return candidates.filter((tag) => text.includes(tag)).slice(0, 6);
}

function inferProductName(title: string, category: AiAnalysis["category"]) {
  return category === "新品" ? title.replace(/(上市|发布|焕新|升级)/g, "").trim() : "未明确";
}

function inferDiscount(text: string) {
  const match = text.match(/(满\s?\d+\s?元?(?:赠|减)[^。；\n]*|[0-9.]+折|买[一二三四五六七八九十\d]+赠[一二三四五六七八九十\d]+|第二件[^。；\n]*)/);
  return match?.[0] || "未提及";
}

function buildKeyPoints(text: string, category: AiAnalysis["category"]) {
  const points = [];
  if (/会员|CRM|积分|私域/.test(text)) points.push("强化会员权益与私域触点");
  if (/限定|礼盒|联名/.test(text)) points.push("通过限定机制制造稀缺感");
  if (/直播|达人|小红书|种草|笔记/.test(text)) points.push("依赖内容种草放大声量");
  if (/618|预售|满赠|礼赠|折扣/.test(text)) points.push("用促销权益提升转化与客单价");
  if (/明星|代言|同款/.test(text)) points.push("通过明星资产提升社交讨论度");
  if (!points.length) points.push(category === "新品" ? "围绕新品制造购买理由" : "释放可跟踪的竞品营销信号");
  return points.slice(0, 4);
}

function inferTargetAudience(text: string, category: AiAnalysis["category"]) {
  if (/会员|VIP|积分|私域|复购/.test(text)) return "高价值会员与已有护肤用户";
  if (/抗老|修护|精华|面霜|高端/.test(text)) return "关注高端护肤、抗老与修护功效的消费者";
  if (/口红|彩妆|香水|限定/.test(text)) return "关注彩妆、香氛和限定新品的年轻内容用户";
  if (category === "促销" || category === "促销活动") return "价格敏感且容易被礼赠权益驱动的潜在购买者";
  if (category === "会员权益") return "关注积分、等级礼遇和专属服务的存量会员";
  if (category === "线下活动") return "愿意到店体验、预约服务或参与品牌活动的高价值用户";
  if (category === "达人合作") return "关注达人内容、明星同款和视觉示范的社交平台用户";
  if (category === "社交媒体话题") return "受平台讨论、评论口碑和短视频内容影响的潜在消费者";
  if (category === "节日营销") return "有节日送礼需求的现有会员与潜在消费者";
  return "美妆护肤内容用户与品牌市场团队";
}

function inferMarketingStrategy(text: string, category: AiAnalysis["category"]) {
  const tactics = [];
  if (/达人|KOL|KOC|种草|笔记/.test(text)) tactics.push("达人/KOC 内容种草");
  if (/礼赠|套装|满赠|积分|优惠|折扣/.test(text)) tactics.push("权益与礼赠驱动转化");
  if (/限定|联名|首发/.test(text)) tactics.push("限定机制制造稀缺感");
  if (/直播|预约|预售/.test(text)) tactics.push("直播或预售拉动短期成交");
  if (/明星|代言|同款|达人|KOL|KOC/.test(text)) tactics.push("达人/明星资产放大社交声量");
  if (!tactics.length) tactics.push(category === "新品" ? "围绕新品功效建立购买理由" : "通过内容释放品牌信号");
  return tactics.join("；");
}

function buildWhyItMatters(brand: string, category: AiAnalysis["category"]) {
  const map = {
    新品: `${brand}正在用新品制造新的购买理由，可能影响娇韵诗核心护肤品类的关注度与试用转化。`,
    Campaign: `${brand}正在争夺社交声量和用户互动，可能影响娇韵诗同期 Campaign 的注意力窗口。`,
    促销: `${brand}的促销机制可能抬高消费者对礼赠、套组和会员权益的预期。`,
    促销活动: `${brand}的促销机制可能抬高消费者对礼赠、套组和会员权益的预期。`,
    会员权益: `${brand}正在强化会员权益感知，可能影响高价值用户对服务和复购权益的预期。`,
    节日营销: `${brand}正在围绕节日送礼场景设计权益和内容，可能影响礼盒与会员触达节奏。`,
    社交媒体话题: `${brand}正在通过社交话题争夺内容注意力，可能影响同期自然声量和评论关注点。`,
    达人合作: `${brand}正在借助达人或明星资产扩大话题触达，可能提升同期社交声量竞争强度。`,
    线下活动: `${brand}正在强化线下体验触点，可能提升高价值用户的服务期待。`,
    其他品牌动态: `${brand}的品牌动态有助于判断其服务、渠道或会员经营方向。`
  };
  return map[category];
}

function buildSuggestedAction(category: AiAnalysis["category"]) {
  const map = {
    新品: "建议娇韵诗快速对比产品功效、核心成分与试用权益，准备对应内容和会员触达。",
    Campaign: "建议观察互动数据与达人内容表现，并准备一个会员专属内容或权益回应。",
    促销: "建议对比竞品礼赠门槛、套组结构与会员券力度，及时校准促销策略。",
    促销活动: "建议对比竞品礼赠门槛、套组结构与会员券力度，及时校准促销策略。",
    会员权益: "建议检查娇韵诗会员权益说明、生日礼遇和复购触达是否足够清晰。",
    节日营销: "建议对比礼盒包装、赠品组合和会员触达时间，提前准备节日营销备选方案。",
    社交媒体话题: "建议追踪高互动评论中的肤感、价格和赠品关注点，形成下一轮内容优化清单。",
    达人合作: "建议追踪达人内容扩散节奏，评估是否需要调整社交平台话题和达人内容排期。",
    线下活动: "建议把线下护理体验与会员后续触达连接，沉淀到店线索和复购机会。",
    其他品牌动态: "建议纳入周度竞品观察，评估是否影响娇韵诗服务体验或 CRM 旅程。"
  };
  return map[category];
}

function inferImportance(text: string, category: AiAnalysis["category"]) {
  let score = category === "新品" ? 8 : category === "Campaign" ? 7.5 : category === "促销" || category === "促销活动" ? 7.8 : category === "达人合作" ? 8.1 : category === "节日营销" ? 7.6 : 6.2;
  if (/(618|双11|会员|限定|联名|明星|直播|首发)/.test(text)) score += 0.8;
  return Math.min(10, Number(score.toFixed(1)));
}
