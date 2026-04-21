import { apiClient } from "@/shared/api/api-client";

import type { NationalDashboardData, OfficerDashboardData, RegionalDashboardData } from "../types/dashboard.type";

export async function getNationalDashboard(params?: {
  month?: number;
  year?: number;
  dailyDateFrom?: string;
  dailyDateTo?: string;
}) {
  return apiClient<NationalDashboardData>("/v1/dashboard/superadmin", {
    method: "GET",
    params: {
      month: params?.month,
      year: params?.year,
      daily_date_from: params?.dailyDateFrom,
      daily_date_to: params?.dailyDateTo,
    },
  });
}

export async function getRegionalDashboard(params?: { month?: number; year?: number }) {
  return apiClient<RegionalDashboardData>("/v1/dashboard/admin-regional", {
    method: "GET",
    params: {
      month: params?.month,
      year: params?.year,
    },
  });
}

export async function getOfficerDashboard(params?: { month?: number; year?: number }) {
  return apiClient<OfficerDashboardData>("/v1/dashboard/officer", {
    method: "GET",
    params: {
      month: params?.month,
      year: params?.year,
    },
  });
}
