import { mapContentDetail } from "@/features/content-shared/api/content-response-mapper";
import type { ContentDetail } from "@/features/content-shared/types/content.type";
import { apiClient } from "@/shared/api/api-client";

export async function getContentSubmissionDetail(contentId: string, _accessToken?: string) {
  const response = await apiClient<ContentDetail>(`/v1/konten/${contentId}`, {
    method: "GET",
  });

  return {
    ...response,
    data: mapContentDetail(response.data),
  };
}
