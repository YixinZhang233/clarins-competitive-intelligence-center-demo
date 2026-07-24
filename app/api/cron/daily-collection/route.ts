import { NextResponse } from "next/server";
import { runAutomaticCollection } from "@/lib/collection-service";

export async function GET(request: Request) {
  const secret = process.env.COLLECTION_CRON_SECRET;
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (secret && auth !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized cron request." }, { status: 401 });
  }

  const result = await runAutomaticCollection();
  return NextResponse.json({ ok: true, data: result, message: "Daily collection cron completed." });
}
