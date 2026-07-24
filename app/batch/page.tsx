import { BatchImportForm } from "@/components/batch-import-form";
import { LinkButton, SectionTitle, Shell } from "@/components/ui";

export default function BatchImportPage() {
  return (
    <Shell className="pb-20 pt-16">
      <section className="mx-auto max-w-5xl text-center">
        <p className="mb-4 text-sm font-semibold text-neutral-500">批量导入</p>
        <h1 className="text-balance text-5xl font-semibold tracking-tight text-ink md:text-7xl">
          一次粘贴多条小红书链接。
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-xl leading-9 text-neutral-600">
          系统会逐条去重、校验、尝试公开解析，并用 AI 生成结构化竞品情报。无法访问的页面会保留链接，等待人工补充正文。
        </p>
        <div className="mt-8">
          <LinkButton href="/batch/history" variant="secondary">查看批次历史</LinkButton>
        </div>
      </section>

      <section className="mt-14">
        <SectionTitle
          title="开始批量分析"
          subtitle="适合 Marketing 团队每天集中导入小红书笔记链接。每条链接独立处理，不会因为单条失败中断整批。"
        />
        <BatchImportForm />
      </section>
    </Shell>
  );
}
