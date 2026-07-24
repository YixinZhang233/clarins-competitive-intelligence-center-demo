import { NextResponse } from "next/server";
import { retryCollectionTask } from "@/lib/collection-service";

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const result = await retryCollectionTask(payload.id);
    const message = "message" in result ? result.message : "重试完成。";
    return NextResponse.json({ ok: true, data: result, message });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "重试失败。" },
      { status: 500 }
    );
  }
}
