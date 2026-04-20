import type { ContentPlatform } from "@/features/content-shared/types/content.type";

export type ScraperPlatform = ContentPlatform;
export type ScraperFrequency = "harian" | "mingguan" | "custom";
export type ScraperScheduleMode = "profile_monitoring" | "posting_metrics";
export type ScraperRunStatus = "running" | "success" | "failed" | "partial";
export type ScraperTriggerType = "scheduled" | "on_register" | "manual";

export interface ScraperCostSummary {
  usageTotalUsd: number | null;
  computeUnits: number | null;
  usageUsd: Record<string, number>;
}

export interface ScraperResultCost extends ScraperCostSummary {
  pricingModel: string | null;
}

export interface ScraperScheduleItem {
  id: string;
  platform: ScraperPlatform;
  mode: ScraperScheduleMode;
  frequency: ScraperFrequency;
  runAt: string;
  cronExpression: string;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface CreateScraperSchedulePayload {
  platform: ScraperPlatform;
  mode: ScraperScheduleMode;
  frequency: ScraperFrequency;
  runAt: string;
  cronExpression?: string;
  isActive: boolean;
}

export interface UpdateScraperSchedulePayload {
  platform?: ScraperPlatform;
  mode?: ScraperScheduleMode;
  frequency?: ScraperFrequency;
  runAt?: string;
  cronExpression?: string;
  isActive?: boolean;
}

export interface ScraperLogItem {
  id: string;
  scheduleId: string | null;
  triggerType: ScraperTriggerType;
  platform: ScraperPlatform;
  mode: "bootstrap_history" | ScraperScheduleMode;
  status: ScraperRunStatus;
  totalAccounts: number;
  successCount: number;
  failCount: number;
  apifyRunId: string | null;
  apifyDatasetId: string | null;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  createdAt: string;
  costSummary: ScraperCostSummary | null;
  schedule: {
    id: string;
    mode: ScraperScheduleMode;
    runAt: string;
    frequency: ScraperFrequency;
  } | null;
}

export interface ScraperLogDetail extends ScraperLogItem {
  results: Array<{
    id: string;
    socialAccount: {
      id: string;
      username: string;
      profileName: string;
      platform: ScraperPlatform;
    };
    apifyRunId: string | null;
    success: boolean;
    followers: number | null;
    postCount: number | null;
    totalReach: number | null;
    cost: ScraperResultCost;
    errorReason: string | null;
    scrapedAt: string;
    rawPayload: unknown;
  }>;
}

export interface ScraperLogsQuery {
  status?: ScraperRunStatus | "all";
  platform?: ScraperPlatform | "all";
  mode?: "bootstrap_history" | ScraperScheduleMode | "all";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ScraperLogsMeta {
  page: number;
  limit: number;
  total: number;
  summary?: {
    totalAccounts: number;
    successCount: number;
    failCount: number;
    costSummary: ScraperCostSummary | null;
  };
}

export interface ScraperConnectionStatus {
  configured: boolean;
  connected: boolean;
  actorIds: Record<"bootstrap" | "profile" | "post", Record<ScraperPlatform, string | null>>;
  configuredPlatforms: Record<"bootstrap" | "profile" | "post", ScraperPlatform[]>;
  missingPlatforms: Record<"bootstrap" | "profile" | "post", ScraperPlatform[]>;
  fullyConfiguredPlatforms: ScraperPlatform[];
  bootstrapOnlyPlatforms: ScraperPlatform[];
  appPublicUrl: string | null;
  accountUsername: string | null;
  message: string;
}
