import { AddIntelligenceForm } from "@/components/add-intelligence-form";
import { SectionTitle, Shell } from "@/components/ui";

export default function AddIntelligencePage() {
  return (
    <Shell className="pb-20 pt-16">
      <section className="mx-auto max-w-5xl text-center">
        <p className="mb-4 text-sm font-semibold text-neutral-500">竞品资料录入</p>
        <h1 className="text-balance text-5xl font-semibold tracking-tight text-ink md:text-7xl">
          添加真实竞品资料。
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-xl leading-9 text-neutral-600">
          粘贴公开来源链接与正文/OCR 文本；如果原文无法自动读取，可上传截图和人工备注。AI 只分析你提交的内容，不自动编造未提交信息。
        </p>
      </section>
      <section className="mt-14">
        <SectionTitle title="资料录入" subtitle="保存后会进入 Supabase 数据库，并在首页按品牌展示。" />
        <AddIntelligenceForm />
      </section>
    </Shell>
  );
}
