import { NextResponse } from "next/server";
import { buildDemoActivities } from "@/lib/demo-data";
import { getServerSupabase } from "@/lib/supabase";

export async function POST() {
  const supabase = getServerSupabase();
  const rows = buildDemoActivities();
  if (!supabase) {
    return NextResponse.json({
      message: `已启用本地演示内容兜底，共 ${rows.length} 条模拟情报。`,
      count: rows.length,
      mode: "local-fallback"
    });
  }

  await supabase.from("activities").delete().eq("is_demo", true);

  const { error } = await supabase.from("activities").insert(rows);
  if (error) {
    return NextResponse.json({
      message: `数据库写入未完成，已启用本地演示内容兜底，共 ${rows.length} 条模拟情报。`,
      count: rows.length,
      mode: "local-fallback",
      warning: error.message
    });
  }

  return NextResponse.json({ message: `已初始化 ${rows.length} 条演示内容。`, count: rows.length });
}

export async function DELETE() {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({
      message: "本地演示内容为内置兜底内容，无需清除；连接数据库后可清除已写入的演示内容。",
      mode: "local-fallback"
    });
  }

  const { error } = await supabase.from("activities").delete().eq("is_demo", true);
  if (error) {
    return NextResponse.json({ error: `清除演示内容失败：${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ message: "已清除演示内容。" });
}
