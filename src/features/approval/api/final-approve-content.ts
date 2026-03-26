import { apiClient } from "@/shared/api/api-client";

import type { ReviewDecisionPayload, ReviewDecisionResponse } from "../types/content-approval.type";

export async function finalApproveContent(contentId: string, payload: ReviewDecisionPayload, _accessToken?: string) {
  return apiClient<ReviewDecisionResponse>(`/v1/konten/${contentId}/final-approvals`, {
    method: "POST",
    body: payload,
  });
}
