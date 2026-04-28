import { apiClient } from "@/shared/api/api-client";

import type { BlastFeedFilters, BlastFeedItem, BlastMeta } from "../types/blast-activity.type";

export async function getBlastFeed(filters: BlastFeedFilters) {
  return apiClient<BlastFeedItem[], BlastMeta>("/v1/blast-activities/feed", {
    method: "GET",
    params: {
      platform: filters.platform === "all" ? undefined : filters.platform,
      social_account_id: filters.social_account_id === "all" ? undefined : filters.social_account_id,
      status: filters.status === "all" ? undefined : filters.status,
      scope: filters.scope,
      sort_direction: filters.sort_direction,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
      search: filters.search.trim() || undefined,
      page: filters.page,
      limit: filters.limit,
    },
  });
}
