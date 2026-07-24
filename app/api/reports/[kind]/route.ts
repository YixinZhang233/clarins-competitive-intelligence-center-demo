import { NextResponse } from "next/server";
import { getActivities } from "@/lib/supabase";
import { buildReportMarkdown, filterReportActivities, type ReportKind } from "@/lib/reports";

export async function GET(_: Request, { params }: { params: { kind: string } }) {
  if (params.kind !== "daily" && params.kind !== "weekly") {
    return NextResponse.json({ error: "报告类型不支持。" }, { status: 400 });
  }

  const activities = filterReportActivities(await getActivities(), params.kind as ReportKind);
  const markdown = buildReportMarkdown(activities, params.kind as ReportKind);
  const filename =
    params.kind === "daily"
      ? "Clarins-Competitive-Intelligence-Daily-2026-07-23.md"
      : "Clarins-Competitive-Intelligence-Weekly-2026-W30.md";

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
