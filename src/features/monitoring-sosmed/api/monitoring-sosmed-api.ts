import { apiClient } from "@/shared/api/api-client";

import type { MonitoringSosmedData } from "../types/monitoring-sosmed.type";

export async function getMonitoringSosmedData(params?: {
  wilayahId?: string;
  month?: number;
  year?: number;
}) {
  return apiClient<MonitoringSosmedData>("/v1/monitoring-sosmed", {
    method: "GET",
    params: {
      wilayah_id: params?.wilayahId,
      month: params?.month,
      year: params?.year,
    },
  });
}
