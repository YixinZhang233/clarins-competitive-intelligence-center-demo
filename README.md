# AI-Powered Competitive Intelligence Center

An AI-powered competitive intelligence demo designed for brand and marketing teams.

The platform supports automated content collection from WeChat Official Accounts and Weibo, manual uploads from Xiaohongshu and WeChat Mini Programs, LLM-powered structured analysis, interactive intelligence dashboards, and automated Excel, daily, and weekly report generation.

## Demo Workflow

1. Select a demo user in `/settings`.
2. Initialize 48 demo intelligence records with one click.
3. View summary metrics, brand cards, recent activities, and trending keywords on the dashboard.
4. Use `/collection` to simulate automated data collection in Demo Mode or manually upload Xiaohongshu / WeChat Mini Program content.
5. Use `/add` to submit public-source URLs, raw text, or OCR-extracted content for LLM-powered structured analysis.
6. View uploader information, timestamps, collection methods, brand-level insights, and individual activity details.
7. Export intelligence data in Excel, CSV, or Markdown format through `/export`.
8. Preview and download automatically generated daily and weekly reports through `/reports/daily` and `/reports/weekly`.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Next.js Route Handlers
- Configurable LLM Adapter
- Hybrid Data Collection Providers
- Excel / CSV / Markdown Export
- Vercel Deployment

## Key Pages

- `/` — Dashboard: summary metrics, demo status, brand cards, recent activities, trending keywords, search, and filtering
- `/collection` — Data Collection: platform status, automated collection jobs, manual uploads, and execution history
- `/add` — Add Intelligence: public-source URLs, raw text / OCR content, screenshots, LLM analysis, and persistence
- `/batch` — Batch Import: batch processing for Xiaohongshu links with manual fallback for failed items
- `/brands/[brand]` — Brand Intelligence: brand-level summaries, activity timelines, and key insights
- `/activities/[id]` — Intelligence Detail: structured fields, uploader information, timestamps, and source links
- `/export` — Data Export: Excel, CSV, Markdown, and reporting entry points
- `/reports/daily` — Daily intelligence report preview and Markdown download
- `/reports/weekly` — Weekly intelligence report preview and Markdown download
- `/settings` — User settings and demo data management

## Environment Variables

Copy `.env.example`:

```bash
cp .env.example .env.local
```

Configure:

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

Notes:

- `LLM_API_KEY` is the API key used by the application rather than `OPENAI_API_KEY`.
- `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_MODEL`, and `LLM_API_KEY` should correspond to the same provider.
- API keys should never be hard-coded or committed to Git.
- `SUPABASE_SERVICE_ROLE_KEY` is used only in server-side API routes for database writes.
- Collection provider credentials are loaded only through the `WECHAT_COLLECTOR_*` and `WEIBO_COLLECTOR_*` environment variables.

## Database

For a new database, execute:

```text
sql/schema.sql
```

For an existing deployment, apply:

```text
sql/demo-upgrade.sql
sql/collection-migration.sql
```

The migrations include:

- `discount`
- `ai_status`
- `is_demo`
- `created_by`
- `updated_by`
- Extended `platform` and `category` check constraints
- New `collection_sources`, `collection_runs`, and `collection_items` tables
- Additional collection metadata for `activities`, including `source_type`, `external_id`, `collected_at`, and `ai_analyzed_at`

## Hybrid Data Collection

### Demo Mode

Demo Mode is enabled by default and does not require access to real platform APIs.

1. Open `/collection`.
2. Click **Run Now**.
3. Mock collectors generate demo collection results for WeChat Official Accounts and Weibo.
4. Collected content passes through a unified deduplication, AI fallback, and structured persistence workflow.
5. Newly generated intelligence becomes available immediately across the dashboard, brand pages, daily and weekly reports, and data exports.

### Live Mode

Live providers can be enabled through:

```bash
WECHAT_COLLECTOR_PROVIDER=live
WECHAT_COLLECTOR_API_KEY=
WECHAT_COLLECTOR_BASE_URL=

WEIBO_COLLECTOR_PROVIDER=live
WEIBO_COLLECTOR_API_KEY=
WEIBO_COLLECTOR_BASE_URL=
```

If the required configuration is missing, the application explicitly indicates that a live data interface has not been configured rather than silently generating simulated production data.

### Vercel Cron

`vercel.json` configures a scheduled collection job:

```json
{
  "path": "/api/cron/daily-collection",
  "schedule": "0 1 * * *"
}
```

The job runs at 01:00 UTC (09:00 China Standard Time).

For production deployments, `COLLECTION_CRON_SECRET` should be configured and scheduled requests should include:

```text
Authorization: Bearer <secret>
```

## LLM Structured Output

The LLM is expected to return strictly structured JSON:

```json
{
  "brand": "Lancôme",
  "productName": "Highlight Repair Serum",
  "category": "Product Launch",
  "publishDate": "2026-07-20",
  "platform": "Xiaohongshu",
  "campaign": "New Product Seeding Campaign",
  "discount": "Not specified",
  "keywords": ["repair", "serum", "new product"],
  "summary": "A factual summary generated from user-provided content.",
  "marketingInsight": "An actionable insight for brand marketing and CRM teams."
}
```

The backend validates the JSON response and normalizes compatible legacy field names into the structured format used by the application.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Run validation checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Demo Data

Navigate to:

```text
/settings
```

Available actions include:

- Initialize demo data
- Clear demo data

All demo records are explicitly marked with `is_demo: true`. They are provided solely to demonstrate product functionality and do not represent real market intelligence or live platform collection results.

## Disclaimer

This repository is a demonstration implementation.

Demo Mode uses simulated data and mock collectors. The repository does not contain real customer data, internal documents, proprietary prompts, production platform credentials, or confidential market intelligence.
