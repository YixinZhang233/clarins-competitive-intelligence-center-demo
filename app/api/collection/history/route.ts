import { NextResponse } from "next/server";
import { getCollectionRuns } from "@/lib/collection-store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, data: getCollectionRuns() });
}
