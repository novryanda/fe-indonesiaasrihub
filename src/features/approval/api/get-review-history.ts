import type { ReviewHistoryItem } from "@/features/content-shared/types/content.type";
import { apiClient } from "@/shared/api/api-client";

export async function getReviewHistory(contentId: string, _accessToken?: string) {
  return apiClient<ReviewHistoryItem[]>(`/v1/konten/${contentId}/reviews`, {
    method: "GET",
  });
}
