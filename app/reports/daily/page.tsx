import { ReportPreview } from "@/components/report-preview";
import { Shell } from "@/components/ui";
import { getActivities } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function DailyReportPage() {
  const activities = await getActivities();
  return (
    <Shell className="pb-20 pt-16">
      <ReportPreview activities={activities} kind="daily" />
    </Shell>
  );
}
