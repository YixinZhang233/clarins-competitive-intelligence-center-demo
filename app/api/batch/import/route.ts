import { NextResponse } from "next/server";
import { PLATFORM } from "@/lib/constants";
import { analyzeIntelligence, inferBrandFromText } from "@/lib/ai";
import { getServerSupabase } from "@/lib/supabase";
import { batchImportSchema } from "@/lib/validation";
import { getCurrentUser } from "@/lib/users";
import { fetchXhsPublicContent, isValidXhsUrl, normalizeXhsLinks } from "@/lib/xhs";

type RowResult = {
  batch_item_id?: string;
  source_url: string;
  status: string;
  brand?: string;
  title?: string;
  publish_date?: string;
  summary?: string;
  error_message?: string;
  activity_id?: string;
};

export async function POST(request: Request) {
  try {
    const payload = batchImportSchema.parse(await request.json());
    const links = normalizeXhsLinks(payload.links);
    const supabase = getServerSupabase();
    const currentUser = getCurrentUser();

    if (!supabase) {
      const batchId = `local-demo-batch-${Date.now()}`;
      const rows = links.map((sourceUrl, index) => ({
        batch_item_id: `00000000-0000-4000-9000-${String(index + 1).padStart(12, "0")}`,
        source_url: sourceUrl,
        status: isValidXhsUrl(sourceUrl) ? "需要人工补充正文" : "链接无效",
        brand: payload.brand || undefined,
        error_message: isValidXhsUrl(sourceUrl)
          ? "演示模式未连接数据库；请人工补充标题和正文后查看分析流程。"
          : "不是有效的小红书链接"
      }));
      return NextResponse.json({
        batch_id: batchId,
        summary: summarizeRows(rows, links.length),
        rows,
        message: "演示模式：已生成批量导入预览，未写入远程数据库。"
      });
    }

    const { data: batch, error: batchError } = await supabase
      .from("batch_imports")
      .insert({
        total_links: links.length,
        created_by: currentUser,
        default_brand: payload.brand || null,
        default_notes: payload.default_notes || null
      })
      .select()
      .single();

    if (batchError) return NextResponse.json({ error: batchError.message }, { status: 500 });

    const rows: RowResult[] = [];

    for (const sourceUrl of links) {
      if (!isValidXhsUrl(sourceUrl)) {
        const item = await insertBatchItem(supabase, {
          batch_id: batch.id,
          source_url: sourceUrl,
          status: "链接无效",
          error_message: "不是有效的小红书链接"
        });
        rows.push({ batch_item_id: item?.id, source_url: sourceUrl, status: "链接无效", error_message: "不是有效的小红书链接" });
        continue;
      }

      const extracted = await fetchXhsPublicContent(sourceUrl);
      if (!extracted) {
        const item = await insertBatchItem(supabase, {
          batch_id: batch.id,
          source_url: sourceUrl,
          status: "需要人工补充正文",
          brand: payload.brand || null,
          error_message: "小红书页面不可公开访问或未能提取正文"
        });
        rows.push({
          batch_item_id: item?.id,
          source_url: sourceUrl,
          status: "需要人工补充正文",
          brand: payload.brand || undefined,
          error_message: "小红书页面不可公开访问或未能提取正文"
        });
        continue;
      }

      try {
        const initialBrand = payload.brand || inferBrandFromText(`${extracted.title}\n${extracted.raw_text}`);
        const input = {
          brand: initialBrand || "未识别品牌",
          platform: PLATFORM,
          source_url: sourceUrl,
          title: extracted.title,
          publish_date: extracted.publish_date,
          raw_text: extracted.raw_text,
          image_url: extracted.image_url,
          screenshot_urls: [],
          notes: payload.default_notes || ""
        };
        const analysis = await analyzeIntelligence(input);
        const brand = payload.brand || analysis.brand || initialBrand || "未识别品牌";

        const { data: activity, error: activityError } = await supabase
          .from("activities")
          .insert({
            batch_id: batch.id,
            brand,
            platform: PLATFORM,
            source_url: sourceUrl,
            title: extracted.title,
            publish_date: extracted.publish_date,
            raw_text: extracted.raw_text,
            image_url: extracted.image_url || null,
            screenshot_urls: [],
            notes: payload.default_notes || null,
            category: analysis.category,
            product_name: analysis.product_name,
            campaign_name: analysis.campaign_name,
            discount: analysis.discount,
            summary: analysis.summary,
            key_points: analysis.key_points,
            target_audience: analysis.target_audience,
            marketing_strategy: analysis.marketing_strategy,
            why_it_matters: analysis.why_it_matters,
            suggested_action_for_clarins: analysis.suggested_action_for_clarins,
            importance_score: analysis.importance_score,
            tags: analysis.tags,
            collection_status: "已保存",
            ai_status: "已完成",
            is_demo: false,
            created_by: currentUser,
            updated_by: currentUser
          })
          .select()
          .single();

        if (activityError) throw new Error(activityError.message);

        const item = await insertBatchItem(supabase, {
          batch_id: batch.id,
          source_url: sourceUrl,
          status: "已保存",
          brand,
          title: extracted.title,
          publish_date: extracted.publish_date,
          raw_text: extracted.raw_text,
          image_url: extracted.image_url || null,
          summary: analysis.summary,
          activity_id: activity.id
        });

        rows.push({
          batch_item_id: item?.id,
          source_url: sourceUrl,
          status: "已保存",
          brand,
          title: extracted.title,
          publish_date: extracted.publish_date,
          summary: analysis.summary,
          activity_id: activity.id
        });
      } catch (error) {
        const item = await insertBatchItem(supabase, {
          batch_id: batch.id,
          source_url: sourceUrl,
          status: "AI分析失败",
          brand: payload.brand || null,
          title: extracted.title,
          publish_date: extracted.publish_date,
          raw_text: extracted.raw_text,
          image_url: extracted.image_url || null,
          error_message: error instanceof Error ? error.message : "AI 分析失败"
        });
        rows.push({
          batch_item_id: item?.id,
          source_url: sourceUrl,
          status: "AI分析失败",
          brand: payload.brand || undefined,
          title: extracted.title,
          error_message: error instanceof Error ? error.message : "AI 分析失败"
        });
      }
    }

    const summary = summarizeRows(rows, links.length);
    await supabase
      .from("batch_imports")
      .update({
        success_count: summary.success,
        needs_manual_count: summary.needs_manual,
        failed_count: summary.failed
      })
      .eq("id", batch.id);

    return NextResponse.json({ batch_id: batch.id, summary, rows });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "批量导入失败" }, { status: 400 });
  }
}

async function insertBatchItem(supabase: ReturnType<typeof getServerSupabase>, row: Record<string, unknown>) {
  if (!supabase) return null;
  const { data } = await supabase.from("batch_items").insert(row).select().single();
  return data;
}

function summarizeRows(rows: RowResult[], total: number) {
  const success = rows.filter((row) => row.status === "已保存").length;
  const needsManual = rows.filter((row) => row.status === "需要人工补充正文").length;
  return {
    total,
    success,
    needs_manual: needsManual,
    failed: Math.max(0, total - success - needsManual)
  };
}
