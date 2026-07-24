import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "娇韵诗竞品情报中心",
  description: "AI 自动整理小红书竞品内容，帮助市场团队快速了解新品、Campaign、大促及品牌动态。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
