import { apiClient } from "@/shared/api/api-client";

import type { BlastFeedFilters, BlastFeedItem, BlastMeta } from "../types/blast-activity.type";

export async function getBlastFeed(filters: BlastFeedFilters) {
  return apiClient<BlastFeedItem[], BlastMeta>("/v1/blast-activities/feed", {
    method: "GET",
    params: {
      platform: filters.platform === "all" ? undefined : filters.platform,
      status: filters.status === "all" ? undefined : filters.status,
      search: filters.search.trim() || undefined,
      page: filters.page,
      limit: filters.limit,
    },
  });
}
