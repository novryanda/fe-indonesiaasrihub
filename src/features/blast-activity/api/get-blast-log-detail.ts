import { apiClient } from "@/shared/api/api-client";

import type { BlastLogDetailData } from "../types/blast-activity.type";

export async function getBlastLogDetail(id: string) {
  return apiClient<BlastLogDetailData>(`/v1/blast-activities/assignments/${id}/log`, {
    method: "GET",
  });
}
