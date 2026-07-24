import { NextResponse } from "next/server";
import { z } from "zod";
import { parseXhsUrl } from "@/lib/xhs";

const parseSchema = z.object({
  url: z.string().min(1, "请提供小红书链接")
});

export async function POST(request: Request) {
  try {
    const payload = parseSchema.parse(await request.json());
    const result = await parseXhsUrl(payload.url);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: "parse_failed",
        title: "",
        description: "",
        cover_image: "",
        images: [],
        canonical_url: "",
        raw_text: "",
        error_message: error instanceof Error ? error.message : "小红书链接读取失败"
      },
      { status: 400 }
    );
  }
}
