import { apiClient } from "@/shared/api/api-client";

import type { BlastActivityFilters, BlastMeta, ListBlastActivitiesData } from "../types/blast-activity.type";

export async function getBlastActivities(filters: BlastActivityFilters) {
  return apiClient<ListBlastActivitiesData, BlastMeta>("/v1/blast-activities", {
    method: "GET",
    params: {
      platform: filters.platform === "all" ? undefined : filters.platform,
      social_account_id: filters.social_account_id === "all" ? undefined : filters.social_account_id,
      date_from: filters.date_from?.trim() || undefined,
      date_to: filters.date_to?.trim() || undefined,
      search: filters.search.trim() || undefined,
      page: filters.page,
      limit: filters.limit,
    },
  });
}
