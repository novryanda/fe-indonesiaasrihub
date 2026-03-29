import type { ContentPlatform } from "@/features/content-shared/types/content.type";

export type ScraperPlatform = ContentPlatform;
export type ScraperFrequency = "harian" | "mingguan" | "custom";
export type ScraperRunStatus = "running" | "success" | "failed" | "partial";
export type ScraperTriggerType = "scheduled" | "on_register" | "manual";

export interface ScraperScheduleItem {
  id: string;
  platform: ScraperPlatform;
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
  frequency: ScraperFrequency;
  runAt: string;
  cronExpression?: string;
  isActive: boolean;
}

export interface UpdateScraperSchedulePayload {
  platform?: ScraperPlatform;
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
  schedule: {
    id: string;
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
    success: boolean;
    followers: number | null;
    postCount: number | null;
    totalReach: number | null;
    errorReason: string | null;
    scrapedAt: string;
    rawPayload: unknown;
  }>;
}

export interface ScraperLogsQuery {
  status?: ScraperRunStatus | "all";
  platform?: ScraperPlatform | "all";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ScraperLogsMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ScraperConnectionStatus {
  configured: boolean;
  connected: boolean;
  actorIds: Record<ScraperPlatform, string | null>;
  configuredPlatforms: ScraperPlatform[];
  missingPlatforms: ScraperPlatform[];
  appPublicUrl: string | null;
  accountUsername: string | null;
  message: string;
}
