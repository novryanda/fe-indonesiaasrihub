import { apiClient } from "@/shared/api/api-client";

import type { DecideBlastPayload } from "../types/blast-activity.type";

export async function decideBlast(payload: DecideBlastPayload) {
  return apiClient<{ id: string; status: string; message: string }>("/v1/blast-activities/decisions", {
    method: "POST",
    body: payload,
  });
}
