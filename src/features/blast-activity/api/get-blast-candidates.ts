import { apiClient } from "@/shared/api/api-client";

import type { BlastCandidateFilters, BlastCandidateItem, BlastMeta } from "../types/blast-activity.type";

export async function getBlastCandidates(filters: BlastCandidateFilters) {
  return apiClient<BlastCandidateItem[], BlastMeta>("/v1/blast-activities/candidates", {
    method: "GET",
    params: {
      platform: filters.platform === "all" ? undefined : filters.platform,
      social_account_id: filters.social_account_id === "all" ? undefined : filters.social_account_id,
      sort_direction: filters.sort_direction,
      search: filters.search.trim() || undefined,
      page: filters.page,
      limit: filters.limit,
    },
  });
}
