import { apiClient } from "@/shared/api/api-client";

import type { ResubmitContentPayload, ResubmitContentResponse } from "../types/content-submission.type";
import { buildContentSubmissionRequestBody } from "./create-content-submission";

export async function resubmitContent(contentId: string, payload: ResubmitContentPayload, _accessToken?: string) {
  return apiClient<ResubmitContentResponse>(`/v1/konten/${contentId}/submission`, {
    method: "PATCH",
    body: buildContentSubmissionRequestBody(payload),
  });
}
