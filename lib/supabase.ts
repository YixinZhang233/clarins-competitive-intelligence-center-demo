import { createClient } from "@supabase/supabase-js";
import { buildDemoActivities } from "@/lib/demo-data";
import { sortByPublishDate } from "@/lib/activity-metadata";
import { getStoredCollectionActivities } from "@/lib/collection-store";
import type { Activity, BatchImport, BatchItem } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getBrowserSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured.");
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getServerSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
    auth: { persistSession: false }
  });
}

export async function getActivities(filters?: { createdBy?: string }): Promise<Activity[]> {
  const supabase = getServerSupabase();
  const fallback = getDemoFallback(filters);
  const collected = getStoredCollectionActivities();
  if (!supabase) return applyActivityFilters(mergeActivities([...collected, ...fallback]), filters);

  let query = supabase
    .from("activities")
    .select("*")
    .order("publish_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.createdBy) {
    query = query.eq("created_by", filters.createdBy);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return applyActivityFilters(mergeActivities([...collected, ...fallback]), filters);
  }
  const rows = (data || []) as Activity[];
  if (!rows.length) return applyActivityFilters(mergeActivities([...collected, ...fallback]), filters);
  if (rows.every((activity) => activity.is_demo) && rows.length < fallback.length) {
    return applyActivityFilters(mergeActivities([...collected, ...fallback]), filters);
  }
  return applyActivityFilters(mergeActivities([...collected, ...rows]), filters);
}

export async function getActivity(id: string): Promise<Activity | null> {
  const supabase = getServerSupabase();
  const fallback = [...getStoredCollectionActivities(), ...buildDemoActivities()].find((activity) => activity.id === id) as Activity | undefined;
  if (!supabase) return fallback || null;

  const { data, error } = await supabase.from("activities").select("*").eq("id", id).single();
  if (error) return fallback || null;
  return data as Activity;
}

export async function getBatchImports(): Promise<BatchImport[]> {
  const supabase = getServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("batch_imports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return (data || []) as BatchImport[];
}

export async function getBatchItems(batchId: string): Promise<BatchItem[]> {
  const supabase = getServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("batch_items")
    .select("*")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }
  return (data || []) as BatchItem[];
}

function getDemoFallback(filters?: { createdBy?: string }) {
  const activities = sortByPublishDate(buildDemoActivities() as Activity[]);
  const enriched = activities.map((activity) => ({
    ...activity,
    source_type: "demo" as const,
    collection_method: "Demo Mode" as const,
    collected_at: activity.created_at,
    ai_analyzed_at: activity.updated_at,
    sentiment: "neutral",
    confidence_score: 0.88
  }));
  if (!filters?.createdBy) return enriched;
  return enriched.filter((activity) => activity.created_by === filters.createdBy);
}

function mergeActivities(activities: Activity[]) {
  const seen = new Set<string>();
  const merged: Activity[] = [];
  for (const activity of sortByPublishDate(activities)) {
    const key = activity.id || activity.source_url;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(activity);
  }
  return merged;
}

function applyActivityFilters(activities: Activity[], filters?: { createdBy?: string }) {
  if (!filters?.createdBy) return activities;
  return activities.filter((activity) => activity.created_by === filters.createdBy);
}
