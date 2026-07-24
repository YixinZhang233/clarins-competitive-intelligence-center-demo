import type { Activity } from "@/lib/types";

export type CollectionRunRecord = {
  id: string;
  platform: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "completed" | "partial_failed" | "failed";
  collected_count: number;
  inserted_count: number;
  duplicate_count: number;
  failed_count: number;
  error_message: string | null;
  created_at: string;
};

export type CollectionItemRecord = {
  id: string;
  external_id: string;
  intelligence_id: string | null;
  platform: string;
  source_type: "automatic" | "manual";
  source_url: string;
  raw_data: Record<string, unknown>;
  collection_run_id: string | null;
  processing_status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
};

type CollectionMemory = {
  activities: Activity[];
  runs: CollectionRunRecord[];
  items: CollectionItemRecord[];
};

declare global {
  // eslint-disable-next-line no-var
  var __clarinsCollectionMemory: CollectionMemory | undefined;
}

export function collectionMemory() {
  if (!globalThis.__clarinsCollectionMemory) {
    globalThis.__clarinsCollectionMemory = { activities: [], runs: [], items: [] };
  }
  return globalThis.__clarinsCollectionMemory;
}

export function getStoredCollectionActivities() {
  return collectionMemory().activities;
}

export function addStoredCollectionActivity(activity: Activity) {
  const memory = collectionMemory();
  if (memory.activities.some((item) => item.source_url === activity.source_url || item.external_id === activity.external_id)) {
    return false;
  }
  memory.activities.unshift(activity);
  return true;
}

export function addCollectionRun(run: CollectionRunRecord) {
  collectionMemory().runs.unshift(run);
}

export function updateCollectionRun(id: string, patch: Partial<CollectionRunRecord>) {
  const run = collectionMemory().runs.find((item) => item.id === id);
  if (run) Object.assign(run, patch);
}

export function getCollectionRuns() {
  return collectionMemory().runs;
}

export function addCollectionItem(item: CollectionItemRecord) {
  collectionMemory().items.unshift(item);
}

export function getCollectionItems() {
  return collectionMemory().items;
}
