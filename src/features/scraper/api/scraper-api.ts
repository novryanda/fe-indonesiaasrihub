import { apiClient } from "@/shared/api/api-client";

import type {
  CreateScraperSchedulePayload,
  ScraperConnectionStatus,
  ScraperLogDetail,
  ScraperLogItem,
  ScraperLogsMeta,
  ScraperLogsQuery,
  ScraperScheduleItem,
  UpdateScraperSchedulePayload,
} from "../types/scraper.type";

function mapSchedule(item: {
  id: string;
  platform: ScraperScheduleItem["platform"];
  frequency: ScraperScheduleItem["frequency"];
  run_at: string;
  cron_expression: string;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: ScraperScheduleItem["createdBy"];
}): ScraperScheduleItem {
  return {
    id: item.id,
    platform: item.platform,
    frequency: item.frequency,
    runAt: item.run_at,
    cronExpression: item.cron_expression,
    isActive: item.is_active,
    lastRunAt: item.last_run_at,
    nextRunAt: item.next_run_at,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    createdBy: item.created_by,
  };
}

function mapLog(item: {
  id: string;
  schedule_id: string | null;
  trigger_type: ScraperLogItem["triggerType"];
  platform: ScraperLogItem["platform"];
  status: ScraperLogItem["status"];
  total_accounts: number;
  success_count: number;
  fail_count: number;
  apify_run_id: string | null;
  apify_dataset_id: string | null;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  created_at: string;
  schedule: ScraperLogItem["schedule"] extends infer T
    ? T extends object
      ? {
          id: string;
          run_at: string;
          frequency: ScraperLogItem["schedule"] extends { frequency: infer F } ? F : never;
        } | null
      : never
    : never;
}): ScraperLogItem {
  return {
    id: item.id,
    scheduleId: item.schedule_id,
    triggerType: item.trigger_type,
    platform: item.platform,
    status: item.status,
    totalAccounts: item.total_accounts,
    successCount: item.success_count,
    failCount: item.fail_count,
    apifyRunId: item.apify_run_id,
    apifyDatasetId: item.apify_dataset_id,
    errorMessage: item.error_message,
    startedAt: item.started_at,
    finishedAt: item.finished_at,
    durationMs: item.duration_ms,
    createdAt: item.created_at,
    schedule: item.schedule
      ? {
          id: item.schedule.id,
          runAt: item.schedule.run_at,
          frequency: item.schedule.frequency,
        }
      : null,
  };
}

export async function listScraperSchedules() {
  const response = await apiClient<
    Array<{
      id: string;
      platform: ScraperScheduleItem["platform"];
      frequency: ScraperScheduleItem["frequency"];
      run_at: string;
      cron_expression: string;
      is_active: boolean;
      last_run_at: string | null;
      next_run_at: string | null;
      created_at: string;
      updated_at: string;
      created_by: ScraperScheduleItem["createdBy"];
    }>
  >("/v1/scraper/schedules");

  return {
    ...response,
    data: response.data.map(mapSchedule),
  };
}

export async function createScraperSchedule(payload: CreateScraperSchedulePayload) {
  const response = await apiClient<{
    id: string;
    platform: ScraperScheduleItem["platform"];
    frequency: ScraperScheduleItem["frequency"];
    run_at: string;
    cron_expression: string;
    is_active: boolean;
    last_run_at: string | null;
    next_run_at: string | null;
    created_at: string;
    updated_at: string;
    created_by: ScraperScheduleItem["createdBy"];
  }>("/v1/scraper/schedules", {
    method: "POST",
    body: {
      platform: payload.platform,
      frequency: payload.frequency,
      runAt: payload.runAt,
      cronExpression: payload.cronExpression,
      isActive: payload.isActive,
    },
  });

  return {
    ...response,
    data: mapSchedule(response.data),
  };
}

export async function updateScraperSchedule(id: string, payload: UpdateScraperSchedulePayload) {
  const response = await apiClient<{
    id: string;
    platform: ScraperScheduleItem["platform"];
    frequency: ScraperScheduleItem["frequency"];
    run_at: string;
    cron_expression: string;
    is_active: boolean;
    last_run_at: string | null;
    next_run_at: string | null;
    created_at: string;
    updated_at: string;
    created_by: ScraperScheduleItem["createdBy"];
  }>(`/v1/scraper/schedules/${id}`, {
    method: "PATCH",
    body: {
      platform: payload.platform,
      frequency: payload.frequency,
      runAt: payload.runAt,
      cronExpression: payload.cronExpression,
      isActive: payload.isActive,
    },
  });

  return {
    ...response,
    data: mapSchedule(response.data),
  };
}

export async function toggleScraperSchedule(id: string, isActive: boolean) {
  const response = await apiClient<{
    id: string;
    platform: ScraperScheduleItem["platform"];
    frequency: ScraperScheduleItem["frequency"];
    run_at: string;
    cron_expression: string;
    is_active: boolean;
    last_run_at: string | null;
    next_run_at: string | null;
    created_at: string;
    updated_at: string;
    created_by: ScraperScheduleItem["createdBy"];
  }>(`/v1/scraper/schedules/${id}/toggle`, {
    method: "PATCH",
    body: {
      is_active: isActive,
    },
  });

  return {
    ...response,
    data: mapSchedule(response.data),
  };
}

export async function deleteScraperSchedule(id: string) {
  return apiClient<{ id: string; message: string }>(`/v1/scraper/schedules/${id}`, {
    method: "DELETE",
  });
}

export async function runScraperScheduleNow(id: string) {
  const response = await apiClient<{
    id: string;
    schedule_id: string | null;
    trigger_type: ScraperLogItem["triggerType"];
    platform: ScraperLogItem["platform"];
    status: ScraperLogItem["status"];
    total_accounts: number;
    success_count: number;
    fail_count: number;
    apify_run_id: string | null;
    apify_dataset_id: string | null;
    error_message: string | null;
    started_at: string;
    finished_at: string | null;
    duration_ms: number | null;
    created_at: string;
    schedule: {
      id: string;
      run_at: string;
      frequency: ScraperLogItem["schedule"] extends { frequency: infer F } ? F : never;
    } | null;
  }>(`/v1/scraper/schedules/${id}/run`, {
    method: "POST",
  });

  return {
    ...response,
    data: mapLog(response.data),
  };
}

export async function listScraperLogs(query: ScraperLogsQuery) {
  const response = await apiClient<
    Array<{
      id: string;
      schedule_id: string | null;
      trigger_type: ScraperLogItem["triggerType"];
      platform: ScraperLogItem["platform"];
      status: ScraperLogItem["status"];
      total_accounts: number;
      success_count: number;
      fail_count: number;
      apify_run_id: string | null;
      apify_dataset_id: string | null;
      error_message: string | null;
      started_at: string;
      finished_at: string | null;
      duration_ms: number | null;
      created_at: string;
      schedule: {
        id: string;
        run_at: string;
        frequency: ScraperLogItem["schedule"] extends { frequency: infer F } ? F : never;
      } | null;
    }>,
    ScraperLogsMeta
  >("/v1/scraper/logs", {
    params: {
      status: query.status && query.status !== "all" ? query.status : undefined,
      platform: query.platform && query.platform !== "all" ? query.platform : undefined,
      date_from: query.dateFrom,
      date_to: query.dateTo,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    },
  });

  return {
    ...response,
    data: response.data.map(mapLog),
  };
}

export async function getScraperLogDetail(id: string) {
  const response = await apiClient<{
    id: string;
    schedule_id: string | null;
    trigger_type: ScraperLogItem["triggerType"];
    platform: ScraperLogItem["platform"];
    status: ScraperLogItem["status"];
    total_accounts: number;
    success_count: number;
    fail_count: number;
    apify_run_id: string | null;
    apify_dataset_id: string | null;
    error_message: string | null;
    started_at: string;
    finished_at: string | null;
    duration_ms: number | null;
    created_at: string;
    schedule: {
      id: string;
      run_at: string;
      frequency: ScraperLogItem["schedule"] extends { frequency: infer F } ? F : never;
    } | null;
    results: Array<{
      id: string;
      social_account: {
        id: string;
        username: string;
        profile_name: string;
        platform: ScraperLogItem["platform"];
      };
      success: boolean;
      followers: number | null;
      post_count: number | null;
      total_reach: number | null;
      error_reason: string | null;
      scraped_at: string;
      raw_payload: unknown;
    }>;
  }>(`/v1/scraper/logs/${id}`);

  return {
    ...response,
    data: {
      ...mapLog(response.data),
      results: response.data.results.map((result) => ({
        id: result.id,
        socialAccount: {
          id: result.social_account.id,
          username: result.social_account.username,
          profileName: result.social_account.profile_name,
          platform: result.social_account.platform,
        },
        success: result.success,
        followers: result.followers,
        postCount: result.post_count,
        totalReach: result.total_reach,
        errorReason: result.error_reason,
        scrapedAt: result.scraped_at,
        rawPayload: result.raw_payload,
      })),
    } satisfies ScraperLogDetail,
  };
}

export async function testScraperConnection() {
  const response = await apiClient<{
    configured: boolean;
    connected: boolean;
    actor_ids: Record<ScraperScheduleItem["platform"], string | null>;
    configured_platforms: Array<ScraperScheduleItem["platform"]>;
    missing_platforms: Array<ScraperScheduleItem["platform"]>;
    app_public_url: string | null;
    account_username: string | null;
    message: string;
  }>("/v1/scraper/test-connection");

  return {
    ...response,
    data: {
      configured: response.data.configured,
      connected: response.data.connected,
      actorIds: response.data.actor_ids,
      configuredPlatforms: response.data.configured_platforms,
      missingPlatforms: response.data.missing_platforms,
      appPublicUrl: response.data.app_public_url,
      accountUsername: response.data.account_username,
      message: response.data.message,
    } satisfies ScraperConnectionStatus,
  };
}
