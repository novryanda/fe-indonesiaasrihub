import { apiClient } from "@/shared/api/api-client";

import type { BlastMeta, BlastRankingData, BlastRankingFilters } from "../types/blast-activity.type";

export async function getBlastRanking(filters: BlastRankingFilters) {
  return apiClient<BlastRankingData, BlastMeta>("/v1/blast-activities/ranking", {
    method: "GET",
    params: {
      platform: filters.platform === "all" ? undefined : filters.platform,
      social_account_id: filters.social_account_id === "all" ? undefined : filters.social_account_id,
      source: filters.source === "all" ? undefined : filters.source,
      sort_direction: filters.sort_direction,
      date_from: filters.date_from?.trim() || undefined,
      date_to: filters.date_to?.trim() || undefined,
      search: filters.search.trim() || undefined,
      blast_user_id: filters.blast_user_id === "all" ? undefined : filters.blast_user_id,
      page: filters.page,
      limit: filters.limit,
    },
  });
}
