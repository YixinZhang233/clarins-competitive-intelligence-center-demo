import { NextResponse } from "next/server";
import { getCollectionStatus } from "@/lib/collection-service";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, data: getCollectionStatus() });
}
