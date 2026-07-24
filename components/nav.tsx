import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/constants";
import { getCurrentUser } from "@/lib/users";

const links = [
  { href: "/", label: "首页" },
  { href: "/collection", label: "数据采集" },
  { href: "/batch", label: "批量导入" },
  { href: "/add", label: "添加竞品资料" },
  { href: "/reports/daily", label: "日报" },
  { href: "/export", label: "导出" },
  { href: "/settings", label: "用户设置" }
];

export function Nav() {
  const currentUser = getCurrentUser();
  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/75 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="text-sm font-semibold tracking-tight text-ink">
          {PRODUCT_NAME}
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-neutral-600 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/settings"
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
        >
          {currentUser}
        </Link>
      </div>
    </header>
  );
}
