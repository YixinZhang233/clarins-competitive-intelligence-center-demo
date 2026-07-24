import { NextResponse } from "next/server";
import { DEMO_USERS } from "@/lib/constants";
import { CURRENT_USER_COOKIE, isDemoUser } from "@/lib/users";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const user = String(payload.user || "");

    if (!isDemoUser(user)) {
      return NextResponse.json(
        { error: `请选择有效演示用户：${DEMO_USERS.join("、")}` },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ user });
    response.cookies.set(CURRENT_USER_COOKIE, user, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
    return response;
  } catch {
    return NextResponse.json({ error: "切换用户失败，请重试。" }, { status: 400 });
  }
}
