import { apiClient } from "@/shared/api/api-client";

import type { ReleaseBlastAssignmentKeepResult } from "../types/blast-activity.type";

export async function releaseBlastAssignmentKeep(assignmentId: string) {
  return apiClient<ReleaseBlastAssignmentKeepResult>(`/v1/blast-activities/assignments/${assignmentId}/keep`, {
    method: "DELETE",
  });
}
