export type XhsParseStatus = "success" | "login_required" | "blocked" | "app_only" | "parse_failed";

export type XhsParseResult = {
  success: boolean;
  status: XhsParseStatus;
  title: string;
  description: string;
  cover_image: string;
  images: string[];
  canonical_url: string;
  raw_text: string;
  publish_date?: string;
  author?: string;
  likes?: string;
  collects?: string;
  comments?: string;
  error_message: string;
};

export type ExtractedXhsContent = {
  title: string;
  raw_text: string;
  image_url: string;
  publish_date: string;
};

const browserUserAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export function normalizeXhsLinks(input: string) {
  const seen = new Set<string>();
  return input
    .split(/\r?\n/)
    .map((line) => extractXhsUrl(line.trim()) || line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/[，,。；;]+$/, ""))
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    });
}

export function extractXhsUrl(input: string) {
  const match = input.match(/https?:\/\/[^\s"'<>，。；、)）]+/i);
  return match?.[0] || "";
}

export function isValidXhsUrl(url: string) {
  try {
    const parsed = new URL(url);
    return /(^|\.)xiaohongshu\.com$|(^|\.)xhslink\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

export async function parseXhsUrl(inputUrl: string): Promise<XhsParseResult> {
  const url = extractXhsUrl(inputUrl) || inputUrl;
  if (!isValidXhsUrl(url)) {
    return emptyResult("parse_failed", url, "请输入有效的小红书链接。");
  }

  const staticResult = await parseXhsStatic(url);
  if (staticResult.success || staticResult.status === "login_required" || staticResult.status === "blocked" || staticResult.status === "app_only") {
    return staticResult;
  }

  return parseXhsWithPlaywright(url, staticResult.canonical_url || url);
}

export async function fetchXhsPublicContent(url: string): Promise<ExtractedXhsContent | null> {
  const result = await parseXhsUrl(url);
  if (!result.success) return null;
  return {
    title: result.title,
    raw_text: result.raw_text || result.description,
    image_url: result.cover_image,
    publish_date: result.publish_date || new Date().toISOString().slice(0, 10)
  };
}

async function parseXhsStatic(url: string): Promise<XhsParseResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": browserUserAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
      }
    });

    const canonicalUrl = response.url || url;
    if ([401, 403].includes(response.status)) {
      return emptyResult("blocked", canonicalUrl, "页面访问受限，小红书可能触发了登录或风控。");
    }
    if (!response.ok) {
      return emptyResult("parse_failed", canonicalUrl, `页面请求失败：HTTP ${response.status}`);
    }

    const html = await response.text();
    const status = detectBlockedStatus(html);
    if (status) return emptyResult(status, canonicalUrl, statusMessage(status));

    const structured = extractStructuredData(html);
    const title = cleanText(
      structured.title ||
        extractMeta(html, "og:title") ||
        extractMeta(html, "twitter:title") ||
        extractTitle(html)
    );
    const description = cleanText(
      structured.description ||
        extractMeta(html, "description") ||
        extractMeta(html, "og:description") ||
        extractMeta(html, "twitter:description")
    );
    const images = unique([
      structured.image,
      extractMeta(html, "og:image"),
      extractMeta(html, "twitter:image"),
      ...extractImagesFromJson(html)
    ]).filter(isLikelyImageUrl);
    const canonical = extractCanonical(html) || canonicalUrl;
    const rawText = cleanText(structured.articleBody || description);

    if (!hasEnoughContent(title, rawText, images)) {
      return emptyResult("parse_failed", canonical, "公开 HTML 中没有足够可解析的标题、正文或图片。");
    }

    return {
      success: true,
      status: "success",
      title,
      description,
      cover_image: images[0] || "",
      images,
      canonical_url: canonical,
      raw_text: rawText,
      publish_date: normalizeDate(structured.datePublished) || new Date().toISOString().slice(0, 10),
      author: structured.author,
      error_message: ""
    };
  } catch (error) {
    return emptyResult("parse_failed", url, error instanceof Error ? error.message : "静态解析失败。");
  } finally {
    clearTimeout(timeout);
  }
}

async function parseXhsWithPlaywright(originalUrl: string, canonicalUrl: string): Promise<XhsParseResult> {
  try {
    const playwright = await optionalImportPlaywright();
    if (!playwright) {
      return emptyResult("parse_failed", canonicalUrl, "当前部署环境未安装 Playwright，无法进行浏览器 fallback。");
    }

    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent: browserUserAgent,
      viewport: { width: 1440, height: 1200 },
      locale: "zh-CN"
    });
    await page.goto(originalUrl, { waitUntil: "domcontentloaded", timeout: 18000 });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);

    const parsed = await page.evaluate(() => {
      const text = (selector: string) => document.querySelector(selector)?.textContent?.trim() || "";
      const meta = (selector: string) => document.querySelector<HTMLMetaElement>(selector)?.content?.trim() || "";
      const bodyText = document.body?.innerText || "";
      const images = Array.from(document.images)
        .map((image) => image.currentSrc || image.src)
        .filter(Boolean)
        .slice(0, 12);
      return {
        url: location.href,
        title:
          text("[class*='title']") ||
          text("h1") ||
          meta("meta[property='og:title']") ||
          meta("meta[name='twitter:title']") ||
          document.title ||
          "",
        description:
          text("[class*='desc']") ||
          text("[class*='content']") ||
          meta("meta[name='description']") ||
          meta("meta[property='og:description']") ||
          "",
        cover: meta("meta[property='og:image']") || meta("meta[name='twitter:image']") || images[0] || "",
        images,
        bodyText
      };
    });
    await browser.close();

    const status = detectBlockedStatus(parsed.bodyText);
    if (status) return emptyResult(status, parsed.url || canonicalUrl, statusMessage(status));

    const rawText = cleanText(parsed.description || parsed.bodyText);
    if (!hasEnoughContent(parsed.title, rawText, parsed.images)) {
      return emptyResult("parse_failed", parsed.url || canonicalUrl, "浏览器打开后仍未找到足够的公开正文。");
    }

    const images = unique([parsed.cover, ...parsed.images]).filter(isLikelyImageUrl);
    return {
      success: true,
      status: "success",
      title: cleanText(parsed.title),
      description: cleanText(parsed.description),
      cover_image: images[0] || "",
      images,
      canonical_url: parsed.url || canonicalUrl,
      raw_text: rawText,
      publish_date: new Date().toISOString().slice(0, 10),
      error_message: ""
    };
  } catch (error) {
    return emptyResult("parse_failed", canonicalUrl, error instanceof Error ? error.message : "Playwright 解析失败。");
  }
}

async function optionalImportPlaywright(): Promise<{ chromium: any } | null> {
  try {
    const dynamicImport = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<any>;
    return await dynamicImport("playwright");
  } catch {
    return null;
  }
}

function detectBlockedStatus(text: string): XhsParseStatus | null {
  const value = text.toLowerCase();
  if (/登录|login|sign in|请先登录/.test(value)) return "login_required";
  if (/验证码|captcha|访问过于频繁|安全验证|风控|verify|forbidden|拒绝访问/.test(value)) return "blocked";
  if (/打开小红书|app内打开|app 内打开|open in app|用小红书扫码|唤起客户端/.test(value)) return "app_only";
  return null;
}

function statusMessage(status: XhsParseStatus) {
  const messages: Record<XhsParseStatus, string> = {
    success: "",
    login_required: "该页面需要登录小红书后查看。",
    blocked: "该页面可能触发了小红书访问限制或安全验证。",
    app_only: "该链接更适合在小红书 App 内打开。",
    parse_failed: "暂时无法自动读取该小红书链接。"
  };
  return messages[status];
}

function extractMeta(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["'][^>]*>`, "i")
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }
  return "";
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/i);
  return match?.[1] ? decodeHtml(match[1]) : "";
}

function extractCanonical(html: string) {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i);
  return match?.[1] ? decodeHtml(match[1]) : "";
}

function extractStructuredData(html: string) {
  const result: Record<string, string> = {};
  const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of matches) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1]));
      const item = Array.isArray(parsed) ? parsed[0] : parsed;
      result.title ||= item.name || item.headline || "";
      result.description ||= item.description || "";
      result.articleBody ||= item.articleBody || "";
      result.datePublished ||= item.datePublished || "";
      result.author ||= typeof item.author === "string" ? item.author : item.author?.name || "";
      result.image ||= Array.isArray(item.image) ? item.image[0] : item.image || "";
    } catch {
      // Ignore malformed embedded JSON.
    }
  }
  return result;
}

function extractImagesFromJson(html: string) {
  const values = new Set<string>();
  const decoded = html.replace(/\\u002F/g, "/").replace(/\\\//g, "/");
  const matches = decoded.matchAll(/https?:\/\/[^"'\\\s]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s]*)?/gi);
  for (const match of matches) values.add(decodeHtml(match[0]));
  return Array.from(values).slice(0, 12);
}

function normalizeDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function hasEnoughContent(title: string, rawText: string, images: string[]) {
  return Boolean(title && (rawText.length >= 20 || images.length));
}

function isLikelyImageUrl(value: string) {
  return /^https?:\/\//i.test(value) && !/favicon|avatar|icon/i.test(value);
}

function unique(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter(Boolean).map((value) => String(value).trim())));
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ");
}

function cleanText(value: string) {
  return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function emptyResult(status: XhsParseStatus, canonicalUrl: string, errorMessage: string): XhsParseResult {
  return {
    success: false,
    status,
    title: "",
    description: "",
    cover_image: "",
    images: [],
    canonical_url: canonicalUrl,
    raw_text: "",
    error_message: errorMessage
  };
}
