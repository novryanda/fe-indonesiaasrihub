import { apiClient } from "@/shared/api/api-client";

import type { KeepBlastAssignmentResult } from "../types/blast-activity.type";

export async function keepBlastAssignment(assignmentId: string) {
  return apiClient<KeepBlastAssignmentResult>(`/v1/blast-activities/assignments/${assignmentId}/keep`, {
    method: "POST",
  });
}
