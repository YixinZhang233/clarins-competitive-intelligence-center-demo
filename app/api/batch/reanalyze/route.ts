import { NextResponse } from "next/server";
import { PLATFORM } from "@/lib/constants";
import { analyzeIntelligence, inferBrandFromText } from "@/lib/ai";
import { getServerSupabase } from "@/lib/supabase";
import { batchManualCompletionSchema } from "@/lib/validation";
import { getCurrentUser } from "@/lib/users";

export async function POST(request: Request) {
  try {
    const payload = batchManualCompletionSchema.parse(await request.json());
    const supabase = getServerSupabase();
    const currentUser = getCurrentUser();

    if (!supabase) {
      const inferredBrand = payload.brand || inferBrandFromText(`${payload.title}\n${payload.raw_text}`) || "未识别品牌";
      const input = {
        brand: inferredBrand,
        platform: PLATFORM,
        source_url: "https://example.com/competitive-intelligence/manual-completion",
        title: payload.title,
        publish_date: payload.publish_date,
        raw_text: payload.raw_text,
        image_url: payload.image_url || "",
        screenshot_urls: [],
        notes: payload.notes || ""
      };
      const analysis = await analyzeIntelligence(input);
      const brand = payload.brand || analysis.brand || inferredBrand;
      return NextResponse.json({
        row: {
          batch_item_id: payload.batch_item_id,
          source_url: input.source_url,
          status: "已保存",
          brand,
          title: payload.title,
          publish_date: payload.publish_date,
          summary: analysis.summary,
          activity_id: `local-${Date.now()}`
        },
        message: "演示模式：已完成 AI 分析预览，未写入远程数据库。",
        current_user: currentUser
      });
    }

    const { data: item, error: itemError } = await supabase
      .from("batch_items")
      .select("*")
      .eq("id", payload.batch_item_id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: "未找到该批量导入记录。" }, { status: 404 });
    }

    const inferredBrand = payload.brand || inferBrandFromText(`${payload.title}\n${payload.raw_text}`) || "未识别品牌";
    const input = {
      brand: inferredBrand,
      platform: PLATFORM,
      source_url: item.source_url,
      title: payload.title,
      publish_date: payload.publish_date,
      raw_text: payload.raw_text,
      image_url: payload.image_url || "",
      screenshot_urls: [],
      notes: payload.notes || ""
    };
    const analysis = await analyzeIntelligence(input);
    const brand = payload.brand || analysis.brand || inferredBrand;

    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .insert({
        batch_id: item.batch_id,
        brand,
        platform: PLATFORM,
        source_url: item.source_url,
        title: payload.title,
        publish_date: payload.publish_date,
        raw_text: payload.raw_text,
        image_url: payload.image_url || null,
        screenshot_urls: [],
        notes: payload.notes || null,
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

    if (activityError) {
      throw new Error(activityError.message);
    }

    await supabase
      .from("batch_items")
      .update({
        status: "已保存",
        brand,
        title: payload.title,
        publish_date: payload.publish_date,
        raw_text: payload.raw_text,
        image_url: payload.image_url || null,
        summary: analysis.summary,
        error_message: null,
        activity_id: activity.id
      })
      .eq("id", item.id);

    await refreshBatchCounts(supabase, item.batch_id);

    return NextResponse.json({
      row: {
        batch_item_id: item.id,
        source_url: item.source_url,
        status: "已保存",
        brand,
        title: payload.title,
        publish_date: payload.publish_date,
        summary: analysis.summary,
        activity_id: activity.id
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "重新分析失败" }, { status: 400 });
  }
}

async function refreshBatchCounts(supabase: NonNullable<ReturnType<typeof getServerSupabase>>, batchId: string) {
  const { data } = await supabase.from("batch_items").select("status").eq("batch_id", batchId);
  const rows = data || [];
  const success = rows.filter((row) => row.status === "已保存").length;
  const needsManual = rows.filter((row) => row.status === "需要人工补充正文").length;
  const failed = rows.length - success - needsManual;
  await supabase
    .from("batch_imports")
    .update({ success_count: success, needs_manual_count: needsManual, failed_count: failed })
    .eq("id", batchId);
}
