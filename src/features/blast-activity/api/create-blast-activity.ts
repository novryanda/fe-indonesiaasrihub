import { apiClient } from "@/shared/api/api-client";

import type { CreateBlastActivityPayload, CreateBlastActivityResult } from "../types/blast-activity.type";

export async function createBlastActivity(payload: CreateBlastActivityPayload) {
  return apiClient<CreateBlastActivityResult>("/v1/blast-activities", {
    method: "POST",
    body: payload,
  });
}
