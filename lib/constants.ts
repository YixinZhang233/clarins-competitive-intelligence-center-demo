export const PRODUCT_NAME = "娇韵诗竞品情报中心";

export const BRANDS = [
  "兰蔻",
  "海蓝之谜",
  "YSL 圣罗兰",
  "科颜氏",
  "资生堂",
  "雅诗兰黛"
] as const;

export const PLATFORM = "小红书" as const;
export const PLATFORMS = ["小红书", "微博", "微信公众号", "官网", "天猫", "抖音", "微信小程序"] as const;

export const CATEGORIES = [
  "新品",
  "Campaign",
  "促销",
  "促销活动",
  "会员权益",
  "节日营销",
  "社交媒体话题",
  "达人合作",
  "线下活动",
  "其他品牌动态"
] as const;

export const DEMO_USERS = ["Lottie Zhang", "Suki", "Clarins Marketing Team"] as const;

export const BRAND_ACCENTS: Record<string, string> = {
  娇韵诗: "from-red-100 via-white to-rose-100",
  兰蔻: "from-rose-100 via-white to-violet-100",
  海蓝之谜: "from-cyan-100 via-white to-slate-100",
  "YSL 圣罗兰": "from-pink-100 via-white to-amber-100",
  科颜氏: "from-emerald-100 via-white to-lime-100",
  资生堂: "from-red-100 via-white to-stone-100",
  雅诗兰黛: "from-blue-100 via-white to-indigo-100"
};

export const BRAND_MARKS: Record<string, string> = {
  娇韵诗: "娇",
  兰蔻: "兰",
  海蓝之谜: "海",
  "YSL 圣罗兰": "YSL",
  科颜氏: "科",
  资生堂: "资",
  雅诗兰黛: "雅"
};

export const BRAND_ASSETS: Record<string, {
  logo: string;
  logoImage: string;
  englishName: string;
  description: string;
  visual: string;
}> = {
  娇韵诗: {
    logo: "CLARINS",
    logoImage: "/brand-assets/clarins/logo.png",
    englishName: "Clarins",
    description: "Premium skincare and beauty brand focused on plant-inspired products, CRM care journeys, and high-touch service experiences.",
    visual: "/brand-assets/clarins/hero.png"
  },
  兰蔻: {
    logo: "LANCÔME",
    logoImage: "/brand-assets/lancome/logo.webp",
    englishName: "Lancôme",
    description: "French luxury beauty house known for premium skincare, makeup, fragrance, and high-touch CRM experiences.",
    visual: "/brand-assets/lancome/hero.webp"
  },
  海蓝之谜: {
    logo: "LA MER",
    logoImage: "/brand-assets/la-mer/logo.svg",
    englishName: "La Mer",
    description: "Ultra-premium skincare brand built around repair rituals, high-value clients, and luxury service experiences.",
    visual: "/brand-assets/la-mer/hero.jpg"
  },
  "YSL 圣罗兰": {
    logo: "YSL BEAUTY",
    logoImage: "/brand-assets/ysl-beauty/logo.svg",
    englishName: "YSL Beauty",
    description: "Luxury makeup, fragrance, and beauty brand with strong fashion codes, celebrity campaigns, and social buzz.",
    visual: "/brand-assets/ysl-beauty/hero.png"
  },
  科颜氏: {
    logo: "KIEHL'S",
    logoImage: "/brand-assets/kiehls/logo.webp",
    englishName: "Kiehl's",
    description: "Apothecary-inspired skincare brand focused on ingredients, community retail, sampling, and membership education.",
    visual: "/brand-assets/kiehls/hero.webp"
  },
  资生堂: {
    logo: "SHISEIDO",
    logoImage: "/brand-assets/shiseido/logo.svg",
    englishName: "Shiseido",
    description: "Japanese prestige beauty brand spanning skincare, suncare, and scientific product storytelling.",
    visual: "/brand-assets/shiseido/hero.jpg"
  },
  雅诗兰黛: {
    logo: "ESTÉE LAUDER",
    logoImage: "/brand-assets/estee-lauder/logo.svg",
    englishName: "Estée Lauder",
    description: "Prestige skincare and makeup brand known for hero serums, anti-aging claims, and loyalty-led conversion.",
    visual: "/brand-assets/estee-lauder/hero.jpg"
  }
};
