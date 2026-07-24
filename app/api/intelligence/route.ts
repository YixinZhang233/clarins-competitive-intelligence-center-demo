import { NextResponse } from "next/server";
import { analyzeIntelligence } from "@/lib/ai";
import { getServerSupabase } from "@/lib/supabase";
import { aiAnalysisSchema, intelligenceInputSchema } from "@/lib/validation";
import { getCurrentUser } from "@/lib/users";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const input = intelligenceInputSchema.parse(payload.input || payload);
    const analysis = aiAnalysisSchema.optional().parse(payload.analysis) || await analyzeIntelligence(input);
    const supabase = getServerSupabase();
    const currentUser = getCurrentUser();

    if (!supabase) {
      return NextResponse.json({
        message: "演示模式：AI 结构化结果已生成。当前未连接数据库，因此不会写入远程表。",
        activity: {
          id: `local-${Date.now()}`,
          ...input,
          ...analysis,
          collection_status: "演示模式",
          ai_status: "已完成",
          is_demo: true,
          created_by: currentUser,
          updated_by: currentUser,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });
    }

    const { data, error } = await supabase
      .from("activities")
      .insert({
        brand: input.brand,
        platform: input.platform,
        source_url: input.source_url,
        title: input.title,
        publish_date: input.publish_date,
        raw_text: input.raw_text,
        image_url: input.image_url || null,
        screenshot_urls: input.screenshot_urls || [],
        notes: input.notes || null,
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ activity: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存失败" },
      { status: 400 }
    );
  }
}
