import { apiClient } from "@/shared/api/api-client";

import type { CreateManualBlastQueuePayload, CreateManualBlastQueueResult } from "../types/blast-activity.type";

export async function createManualBlastQueue(payload: CreateManualBlastQueuePayload) {
  return apiClient<CreateManualBlastQueueResult>("/v1/blast-activities/manual-queue", {
    method: "POST",
    body: payload,
  });
}
