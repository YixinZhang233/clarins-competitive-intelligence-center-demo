import { cookies } from "next/headers";
import { DEMO_USERS } from "@/lib/constants";

export const CURRENT_USER_COOKIE = "demo_current_user";

export type DemoUser = (typeof DEMO_USERS)[number];

export function isDemoUser(value: string | undefined | null): value is DemoUser {
  return Boolean(value && (DEMO_USERS as readonly string[]).includes(value));
}

export function getCurrentUser() {
  const selected = cookies().get(CURRENT_USER_COOKIE)?.value;
  return isDemoUser(selected) ? selected : DEMO_USERS[0];
}
