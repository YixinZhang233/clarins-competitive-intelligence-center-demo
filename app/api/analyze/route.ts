import { NextResponse } from "next/server";
import { analyzeIntelligence, deterministicAnalysis } from "@/lib/ai";
import { intelligenceInputSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const input = intelligenceInputSchema.parse(payload);
    try {
      const analysis = await analyzeIntelligence(input);
      return NextResponse.json({ analysis, mode: "llm" });
    } catch (error) {
      const analysis = deterministicAnalysis(input);
      return NextResponse.json({
        analysis,
        mode: "fallback",
        warning: error instanceof Error ? error.message : "LLM 未配置，已使用本地规则分析。"
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI 分析失败" },
      { status: 400 }
    );
  }
}
