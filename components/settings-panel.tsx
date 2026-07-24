"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { DEMO_USERS } from "@/lib/constants";

export function SettingsPanel({ currentUser }: { currentUser: string }) {
  const [selectedUser, setSelectedUser] = useState(currentUser);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function run(action: () => Promise<string>) {
    setMessage("");
    startTransition(async () => {
      try {
        const result = await action();
        setMessage(result);
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "操作失败，请重试。");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-[32px] bg-white p-7 shadow-apple ring-1 ring-black/[0.06]">
        <p className="text-sm font-semibold text-neutral-500">当前演示用户</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{currentUser}</h2>
        <div className="mt-6 grid gap-3">
          <select
            value={selectedUser}
            onChange={(event) => setSelectedUser(event.target.value)}
            className="h-12 rounded-2xl bg-neutral-50 px-4 text-sm text-ink outline-none ring-1 ring-black/[0.06] focus:bg-white focus:ring-black/20"
          >
            {DEMO_USERS.map((user) => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
          <Button
            disabled={isPending}
            onClick={() => run(async () => {
              const response = await fetch("/api/user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user: selectedUser })
              });
              const payload = await response.json();
              if (!response.ok) throw new Error(payload.error || "切换用户失败");
              return `已切换到 ${payload.user}`;
            })}
          >
            切换演示用户
          </Button>
        </div>
      </section>

      <section className="rounded-[32px] bg-white p-7 shadow-apple ring-1 ring-black/[0.06]">
        <p className="text-sm font-semibold text-neutral-500">演示内容</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">初始化演示内容</h2>
        <p className="mt-4 text-sm leading-6 text-neutral-600">
          演示内容仅用于产品功能演示，不代表真实市场情报或真实抓取结果。
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            disabled={isPending}
            onClick={() => run(async () => {
              const response = await fetch("/api/demo", { method: "POST" });
              const payload = await response.json();
              if (!response.ok) throw new Error(payload.error || "初始化失败");
              return payload.message;
            })}
          >
            一键初始化演示内容
          </Button>
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => run(async () => {
              const response = await fetch("/api/demo", { method: "DELETE" });
              const payload = await response.json();
              if (!response.ok) throw new Error(payload.error || "清除失败");
              return payload.message;
            })}
          >
            一键清除演示内容
          </Button>
        </div>
      </section>

      {message ? (
        <div className="lg:col-span-2 rounded-3xl bg-neutral-900 px-5 py-4 text-sm font-semibold text-white">
          {message}
        </div>
      ) : null}
    </div>
  );
}
