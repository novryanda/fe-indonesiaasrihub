import type { ContentItem, PaginatedMeta } from "@/features/content-shared/types/content.type";
import { mapContentListResponse } from "@/features/content-shared/api/content-response-mapper";
import { apiClient } from "@/shared/api/api-client";

import type { MyContentsFilters } from "../types/my-contents.type";

export async function getMyContents(filters: MyContentsFilters, _accessToken?: string) {
  const response = await apiClient<ContentItem[], PaginatedMeta>("/v1/konten", {
    method: "GET",
    params: {
      status: filters.status === "all" ? undefined : filters.status,
      platform: filters.platform === "all" ? undefined : filters.platform,
      search: filters.search.trim() || undefined,
      page: filters.page,
      limit: filters.limit,
    },
  });

  return mapContentListResponse(response);
}
