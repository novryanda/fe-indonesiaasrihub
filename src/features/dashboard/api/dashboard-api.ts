import { apiClient } from "@/shared/api/api-client";

import type { NationalDashboardData, RegionalDashboardData } from "../types/dashboard.type";

export async function getNationalDashboard(params?: { month?: number; year?: number }) {
  return apiClient<NationalDashboardData>("/v1/dashboard/superadmin", {
    method: "GET",
    params: {
      month: params?.month,
      year: params?.year,
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
