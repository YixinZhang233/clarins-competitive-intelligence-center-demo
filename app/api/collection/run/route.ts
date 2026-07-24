import { NextResponse } from "next/server";
import { runAutomaticCollection } from "@/lib/collection-service";

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const result = await runAutomaticCollection(payload.config || {});
    return NextResponse.json({ ok: true, data: result, message: "自动采集任务执行完成。" });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "自动采集执行失败。" },
      { status: 500 }
    );
  }
}
