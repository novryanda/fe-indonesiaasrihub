import { apiClient } from "@/shared/api/api-client";

import type { UpdateBlastActivityMetricsPayload, UpdateBlastActivityMetricsResult } from "../types/blast-activity.type";

export async function updateBlastActivityMetrics(activityId: string, payload: UpdateBlastActivityMetricsPayload) {
  return apiClient<UpdateBlastActivityMetricsResult>(`/v1/blast-activities/${activityId}/metrics`, {
    method: "PATCH",
    body: payload,
  });
}
