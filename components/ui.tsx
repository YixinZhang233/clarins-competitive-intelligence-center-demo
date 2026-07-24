import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }) {
  return (
    <button
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary"
          ? "bg-ink text-white shadow-[0_18px_40px_rgba(17,24,39,.18)] hover:-translate-y-0.5 hover:bg-black"
          : "bg-white/80 text-ink ring-1 ring-black/10 hover:-translate-y-0.5 hover:bg-white",
        className
      )}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition duration-300",
        variant === "primary"
          ? "bg-ink text-white shadow-[0_18px_40px_rgba(17,24,39,.18)] hover:-translate-y-0.5 hover:bg-black"
          : "bg-white/80 text-ink ring-1 ring-black/10 hover:-translate-y-0.5 hover:bg-white",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function Shell({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("mx-auto w-full max-w-7xl px-5 sm:px-8", className)}>{children}</main>;
}

export function SectionTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      {eyebrow ? <p className="mb-3 text-sm font-semibold text-neutral-500">{eyebrow}</p> : null}
      <h2 className="text-3xl font-semibold tracking-tight text-ink md:text-5xl">{title}</h2>
      {subtitle ? <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-600">{subtitle}</p> : null}
    </div>
  );
}

export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[32px] bg-white/75 p-6 shadow-apple ring-1 ring-black/[0.06] backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title = "暂无竞品数据，请添加真实小红书链接。",
  subtitle = "系统只展示用户提交的公开来源与 AI 分析结果，不会自动编造未提交信息。",
  action
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[36px] bg-gradient-to-br from-white via-white to-neutral-100 p-10 text-center shadow-apple ring-1 ring-black/[0.06] md:p-16">
      <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-neutral-900 text-xl font-semibold text-white">
        CI
      </div>
      <h2 className="text-3xl font-semibold tracking-tight text-ink md:text-5xl">{title}</h2>
      <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-neutral-600">{subtitle}</p>
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}
