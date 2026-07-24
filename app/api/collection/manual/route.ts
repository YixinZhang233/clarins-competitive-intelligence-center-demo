import { NextResponse } from "next/server";
import { processManualCollection } from "@/lib/collection-service";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    if (!payload.brand || !payload.platform || !payload.title || !payload.source_url || !payload.publish_date || !payload.raw_text) {
      return NextResponse.json({ ok: false, error: "请填写品牌、平台、标题、原始链接、发布时间和原始正文。" }, { status: 400 });
    }
    const result = await processManualCollection({
      brand: payload.brand,
      platform: payload.platform,
      title: payload.title,
      source_url: payload.source_url,
      publish_date: payload.publish_date,
      raw_text: payload.raw_text,
      image_urls: payload.image_urls || [],
      uploaded_by: payload.uploaded_by,
      notes: payload.notes
    });
    return NextResponse.json({ ok: true, data: result, message: result.message });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "人工上传处理失败。" },
      { status: 500 }
    );
  }
}
