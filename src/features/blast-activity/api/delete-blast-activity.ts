import { apiClient } from "@/shared/api/api-client";

import type { DeleteBlastActivityResult } from "../types/blast-activity.type";

export async function deleteBlastActivity(activityId: string) {
  return apiClient<DeleteBlastActivityResult>(`/v1/blast-activities/${activityId}`, {
    method: "DELETE",
  });
}
