import type { Activity } from "@/lib/types";

export function getActivityWindow(activity: Activity) {
  const notes = activity.notes || "";
  const start = notes.match(/活动开始时间：([^；]+)/)?.[1] || activity.publish_date;
  const end = notes.match(/活动结束时间：([^；]+)/)?.[1] || activity.publish_date;
  return { start, end };
}

export function isPromotion(category: string) {
  return category === "促销" || category === "促销活动";
}

export function sortByPublishDate(activities: Activity[]) {
  return [...activities].sort((a, b) => {
    const byPublishDate = b.publish_date.localeCompare(a.publish_date);
    if (byPublishDate !== 0) return byPublishDate;
    return (b.created_at || "").localeCompare(a.created_at || "");
  });
}

export function demoToday() {
  return new Date("2026-07-23T23:59:59+08:00");
}
