"use client";

import type {
  AnalyticsFilterParams,
  ApiEnvelope,
  KpiSummaryResponse,
  RegionalDetailResponse,
  RegionalLeaderboardRow,
  RegionalTrendPoint,
  SocialAccountLeaderboardRow,
  WccLeaderboardRow,
} from "../types/analytics-report.type";

type ApiEnvelopeMeta = ApiEnvelope<unknown>["meta"];

type NestedApiPayload<T> = {
  data: T;
  meta?: ApiEnvelopeMeta;
};

function buildQuery(params: AnalyticsFilterParams) {
  const query = new URLSearchParams();
  query.set("month", String(params.month));
  query.set("year", String(params.year));

  if (params.platform) {
    query.set("platform", params.platform);
  }

  if (params.wilayahId) {
    query.set("wilayah_id", params.wilayahId);
  }

  return query.toString();
}

async function requestJson<T>(path: string) {
  const response = await fetch(path, {
    credentials: "include",
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? "Gagal memuat data analitik.");
  }

  return payload;
}

function normalizeEnvelope<T>(payload: ApiEnvelope<T | NestedApiPayload<T>>): ApiEnvelope<T> {
  const nested = payload.data;

  if (nested && typeof nested === "object" && "data" in nested) {
    const normalizedNested = nested as NestedApiPayload<T>;

    return {
      ...payload,
      data: normalizedNested.data,
      meta: normalizedNested.meta ?? payload.meta,
    };
  }

  return payload as ApiEnvelope<T>;
}

export async function getKpiSummary(params: AnalyticsFilterParams) {
  const payload = await requestJson<KpiSummaryResponse | NestedApiPayload<KpiSummaryResponse>>(
    `/api/backend/v1/laporan/analytics/kpi-summary?${buildQuery(params)}`,
  );

  return normalizeEnvelope(payload);
}

export async function getRegionalLeaderboard(params: AnalyticsFilterParams) {
  const payload = await requestJson<RegionalLeaderboardRow[] | NestedApiPayload<RegionalLeaderboardRow[]>>(
    `/api/backend/v1/laporan/analytics/regional-leaderboard?${buildQuery(params)}`,
  );

  return normalizeEnvelope(payload);
}

export async function getSocialAccountLeaderboard(params: AnalyticsFilterParams) {
  const payload = await requestJson<SocialAccountLeaderboardRow[] | NestedApiPayload<SocialAccountLeaderboardRow[]>>(
    `/api/backend/v1/laporan/analytics/social-account-leaderboard?${buildQuery(params)}`,
  );

  return normalizeEnvelope(payload);
}

export async function getRegionalTrend(params: AnalyticsFilterParams) {
  const payload = await requestJson<RegionalTrendPoint[] | NestedApiPayload<RegionalTrendPoint[]>>(
    `/api/backend/v1/laporan/analytics/regional-trend?${buildQuery(params)}`,
  );

  return normalizeEnvelope(payload);
}

export async function getWccLeaderboard(params: AnalyticsFilterParams) {
  const payload = await requestJson<WccLeaderboardRow[] | NestedApiPayload<WccLeaderboardRow[]>>(
    `/api/backend/v1/laporan/analytics/wcc-leaderboard?${buildQuery(params)}`,
  );

  return normalizeEnvelope(payload);
}

export async function getRegionalDetail(params: AnalyticsFilterParams) {
  const payload = await requestJson<RegionalDetailResponse | NestedApiPayload<RegionalDetailResponse>>(
    `/api/backend/v1/laporan/analytics/regional-detail?${buildQuery(params)}`,
  );

  return normalizeEnvelope(payload);
}

export async function generateSnapshot(period: string) {
  const response = await fetch("/api/backend/v1/laporan/analytics/generate-snapshot", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ period }),
  });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<{
    period: string;
    officer_snapshots: number;
    regional_snapshots: number;
    wcc_snapshots: number;
    generated_at: string;
  }> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? "Gagal generate snapshot.");
  }

  return payload;
}
