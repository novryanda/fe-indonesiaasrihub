import { apiClient } from "@/shared/api/api-client";

import type { MonitoringTugasData } from "../types/monitoring-tugas.type";

export async function getMonitoringTugasData(params?: {
  wilayahId?: string;
  platform?: string;
  eselon2?: string;
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
}) {
  return apiClient<MonitoringTugasData>("/v1/monitoring-tugas", {
    method: "GET",
    params: {
      wilayah_id: params?.wilayahId,
      platform: params?.platform,
      eselon_2: params?.eselon2,
      start_date: params?.startDate,
      end_date: params?.endDate,
      month: params?.month,
      year: params?.year,
    },
  });
}
