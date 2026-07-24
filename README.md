# 娇韵诗竞品情报中心

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)
![LLM](https://img.shields.io/badge/LLM-configurable-111827)
![Vercel](https://img.shields.io/badge/Vercel-ready-black)

面向品牌市场团队的 AI 竞品情报 Demo：支持微信公众号/微博自动采集、小红书/微信小程序人工上传，统一进入 AI 分析、结构化展示、Excel、日报和周报。

## Demo 链路

1. 在 `/settings` 选择演示用户。
2. 一键初始化 48 条 Demo 示例数据。
3. 在首页查看统计卡片、品牌卡片、近期动态和热门关键词。
4. 在 `/collection` 体验 Demo Mode 自动采集，或上传小红书/微信小程序内容。
5. 在 `/add` 录入公开来源链接和正文/OCR 文本，调用 LLM 生成结构化分析。
6. 保存后查看上传人、上传时间、采集方式、品牌详情页和活动详情页。
7. 在 `/export` 导出 Excel / CSV / Markdown。
8. 在 `/reports/daily` 和 `/reports/weekly` 预览并下载日报/周报。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Next.js Route Handlers
- Configurable LLM adapter
- Hybrid collector providers
- Excel / CSV / Markdown export
- Vercel deployment

## 关键页面

- `/` 首页 Dashboard：统计卡片、Demo 提示、品牌卡片、近期动态、关键词、搜索筛选
- `/collection` 数据采集：平台状态、自动采集任务、人工上传、执行历史
- `/add` 单条添加：公开来源链接、正文/OCR 文本、截图材料、LLM 分析、保存
- `/batch` 批量导入：小红书链接批量处理，失败项支持人工补全文本
- `/brands/[brand]` 品牌详情：品牌级摘要、动态时间线、重点洞察
- `/activities/[id]` 情报详情：结构化字段、上传人、上传时间、原文链接
- `/export` 导出：Excel / CSV / Markdown / 报告入口
- `/reports/daily` 日报预览与 Markdown 下载
- `/reports/weekly` 周报预览与 Markdown 下载
- `/settings` 用户设置和 Demo 数据管理

## 环境变量

复制 `.env.example`：

```bash
cp .env.example .env.local
```

填写：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

LLM_PROVIDER=deepseek
LLM_API_KEY=
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat

WECHAT_COLLECTOR_PROVIDER=
WECHAT_COLLECTOR_API_KEY=
WECHAT_COLLECTOR_BASE_URL=

WEIBO_COLLECTOR_PROVIDER=
WEIBO_COLLECTOR_API_KEY=
WEIBO_COLLECTOR_BASE_URL=

COLLECTION_CRON_SECRET=
```

注意：

- `LLM_API_KEY` 是代码实际读取的 key，不是 `OPENAI_API_KEY`。
- `LLM_PROVIDER`、`LLM_BASE_URL`、`LLM_MODEL` 和 `LLM_API_KEY` 必须属于同一服务商。
- API Key 不要写入代码，不要提交到 Git。
- `SUPABASE_SERVICE_ROLE_KEY` 仅在服务端 API route 中使用，用于写入数据。
- 采集 Provider 的 Key 只通过 `WECHAT_COLLECTOR_*` 和 `WEIBO_COLLECTOR_*` 读取，不要硬编码。

## 数据库

新建数据库时执行：

```sql
sql/schema.sql
```

已有线上表升级时执行：

```sql
sql/demo-upgrade.sql
sql/collection-migration.sql
```

升级字段包括：

- `discount`
- `ai_status`
- `is_demo`
- `created_by`
- `updated_by`
- 扩展 `platform` 和 `category` check constraint
- 新增 `collection_sources`、`collection_runs`、`collection_items`
- 为 `activities` 增加 `source_type`、`external_id`、`collected_at`、`ai_analyzed_at` 等采集元数据

## 混合式数据采集

### Demo Mode

默认模式。无需真实平台接口：

1. 打开 `/collection`
2. 点击「立即执行」
3. Mock Collector 会生成微信公众号和微博 Demo 采集结果
4. 内容进入统一去重、AI fallback、结构化保存流程
5. 首页、品牌页、日报、周报和 Excel 导出会立即看到新增内容

### Live Mode

配置以下环境变量后启用真实 Provider：

```bash
WECHAT_COLLECTOR_PROVIDER=live
WECHAT_COLLECTOR_API_KEY=
WECHAT_COLLECTOR_BASE_URL=

WEIBO_COLLECTOR_PROVIDER=live
WEIBO_COLLECTOR_API_KEY=
WEIBO_COLLECTOR_BASE_URL=
```

如果配置缺失，页面会显示“尚未配置真实数据接口”，不会静默伪造真实采集结果。

### Vercel Cron

`vercel.json` 已配置：

```json
{
  "path": "/api/cron/daily-collection",
  "schedule": "0 1 * * *"
}
```

`0 1 * * *` 是 UTC 01:00，对应北京时间 09:00。生产环境建议设置 `COLLECTION_CRON_SECRET`，并由 Cron 请求带上 `Authorization: Bearer <secret>`。

## LLM 输出字段

LLM 必须返回严格 JSON：

```json
{
  "brand": "兰蔻",
  "productName": "高光修护精华",
  "category": "新品",
  "publishDate": "2026-07-20",
  "platform": "小红书",
  "campaign": "新品种草内容矩阵",
  "discount": "未提及",
  "keywords": ["修护", "精华", "新品"],
  "summary": "基于用户提交内容生成事实摘要。",
  "marketingInsight": "对品牌市场和 CRM 团队有用的洞察。"
}
```

后端会校验 JSON，并兼容旧字段名转换为页面使用的结构化字段。

## 本地运行

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

检查：

```bash
npm run lint
npm run typecheck
npm run build
```

## Demo 数据

进入：

```text
/settings
```

点击：

- 一键初始化 Demo 数据
- 一键清除 Demo 数据

Demo 数据全部标记为 `is_demo: true`，仅用于产品功能演示，不代表真实市场情报或真实抓取结果。

## Disclaimer

本项目为演示版实现，Demo Mode 使用模拟数据和 Mock Collector。仓库不包含真实客户数据、内部文档、专有 Prompt、真实平台密钥或真实未公开市场情报。
