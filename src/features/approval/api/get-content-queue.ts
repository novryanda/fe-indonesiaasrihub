import { mapContentListResponse } from "@/features/content-shared/api/content-response-mapper";
import type { ContentItem, PaginatedMeta } from "@/features/content-shared/types/content.type";
import { apiClient } from "@/shared/api/api-client";

import type { ApprovalBoardMode, ApprovalQueueFilters } from "../types/content-approval.type";

function buildStatus(mode: ApprovalBoardMode) {
  return mode === "regional-review" ? undefined : "menunggu_final";
}

export async function getContentQueue(mode: ApprovalBoardMode, filters: ApprovalQueueFilters, _accessToken?: string) {
  const response = await apiClient<ContentItem[], PaginatedMeta>("/v1/konten", {
    method: "GET",
    params: {
      status: buildStatus(mode),
      platform: filters.platform === "all" ? undefined : filters.platform,
      topik: filters.topik === "all" ? undefined : filters.topik,
      wilayah_id: filters.regional === "all" ? undefined : filters.regional,
      search: filters.search.trim() || undefined,
      page: filters.page,
      limit: filters.limit,
    },
  });

  return mapContentListResponse(response);
}
