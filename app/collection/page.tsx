import { CollectionPanel } from "@/components/collection/collection-panel";
import { SectionTitle, Shell } from "@/components/ui";
import { getCollectionStatus } from "@/lib/collection-service";

export const dynamic = "force-dynamic";

export default function CollectionPage() {
  const status = getCollectionStatus();

  return (
    <Shell className="pb-20 pt-16">
      <section className="mx-auto max-w-5xl text-center">
        <p className="mb-4 text-sm font-semibold text-neutral-500">混合式数据采集</p>
        <h1 className="text-balance text-5xl font-semibold tracking-tight text-ink md:text-7xl">
          自动采集 + 人工上传，一套 AI 分析流程。
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-xl leading-9 text-neutral-600">
          微信公众号和微博支持自动采集；小红书和微信小程序通过人工上传录入。所有内容都会进入统一清洗、去重、AI 分析、结构化展示和报告导出流程。
        </p>
      </section>

      <section className="mt-14">
        <SectionTitle
          title="数据采集工作台"
          subtitle="Demo Mode 会使用本地模拟采集流程，不访问真实平台；Live Mode 需要配置真实 Provider 环境变量。"
        />
        <CollectionPanel initialStatus={status} />
      </section>
    </Shell>
  );
}
