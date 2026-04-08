"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "@/shared/api/api-client";

import { createBlastActivity } from "../api/create-blast-activity";
import { getBlastActivities } from "../api/get-blast-activities";
import { getBlastFeed } from "../api/get-blast-feed";
import type {
  BlastActivityFilters,
  BlastActivityItem,
  BlastActivityStats,
  BlastFeedFilters,
  BlastFeedItem,
  BlastMeta,
  BlastReferenceStatus,
  CreateBlastActivityPayload,
  CreateBlastActivityResult,
} from "../types/blast-activity.type";

function createInitialFeedFilters(status: BlastReferenceStatus): BlastFeedFilters {
  return {
    platform: "all",
    status,
    search: "",
    page: 1,
    limit: 6,
  };
}

const INITIAL_ACTIVITY_FILTERS: BlastActivityFilters = {
  platform: "all",
  date_from: "",
  date_to: "",
  search: "",
  page: 1,
  limit: 20,
};

export function useBlastActivity(mode: "blast" | "superadmin", initialFeedStatus: BlastReferenceStatus = "all") {
  const [feedFilters, setFeedFilters] = useState<BlastFeedFilters>(() => createInitialFeedFilters(initialFeedStatus));
  const [activityFilters, setActivityFilters] = useState<BlastActivityFilters>(INITIAL_ACTIVITY_FILTERS);
  const [feedItems, setFeedItems] = useState<BlastFeedItem[]>([]);
  const [activities, setActivities] = useState<BlastActivityItem[]>([]);
  const [stats, setStats] = useState<BlastActivityStats | null>(null);
  const [feedMeta, setFeedMeta] = useState<BlastMeta | null>(null);
  const [activityMeta, setActivityMeta] = useState<BlastMeta | null>(null);
  const [isFeedLoading, setFeedLoading] = useState(mode === "blast");
  const [isActivitiesLoading, setActivitiesLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    if (mode !== "blast") {
      return;
    }

    setFeedLoading(true);
    setFeedError(null);

    try {
      const response = await getBlastFeed(feedFilters);
      setFeedItems(response.data);
      setFeedMeta(response.meta ?? null);
    } catch (errorValue) {
      if (errorValue instanceof ApiError) {
        setFeedError(errorValue.message);
      } else {
        setFeedError("Gagal memuat referensi posting blast");
      }
    } finally {
      setFeedLoading(false);
    }
  }, [feedFilters, mode]);

  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    setActivitiesError(null);

    try {
      const response = await getBlastActivities(activityFilters);
      setActivities(response.data.items);
      setStats(response.data.stats);
      setActivityMeta(response.meta ?? null);
    } catch (errorValue) {
      if (errorValue instanceof ApiError) {
        setActivitiesError(errorValue.message);
      } else {
        setActivitiesError("Gagal memuat aktivitas blast");
      }
    } finally {
      setActivitiesLoading(false);
    }
  }, [activityFilters]);

  useEffect(() => {
    void fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    void fetchActivities();
  }, [fetchActivities]);

  const create = useCallback(
    async (payload: CreateBlastActivityPayload): Promise<CreateBlastActivityResult> => {
      setSubmitting(true);

      try {
        const response = await createBlastActivity(payload);
        await fetchActivities();
        await fetchFeed();
        return response.data;
      } catch (errorValue) {
        if (errorValue instanceof ApiError) {
          throw new Error(errorValue.message);
        }

        throw new Error("Gagal menyimpan aktivitas blast");
      } finally {
        setSubmitting(false);
      }
    },
    [fetchActivities, fetchFeed],
  );

  const activityTotalPages = useMemo(() => {
    if (!activityMeta) {
      return 1;
    }

    return Math.max(1, Math.ceil(activityMeta.total / activityMeta.limit));
  }, [activityMeta]);

  return {
    feedItems,
    activities,
    stats,
    feedMeta,
    activityMeta,
    activityTotalPages,
    feedFilters,
    setFeedFilters,
    activityFilters,
    setActivityFilters,
    isFeedLoading,
    isActivitiesLoading,
    isSubmitting,
    feedError,
    activitiesError,
    resetFeedFilters: () => setFeedFilters(createInitialFeedFilters(initialFeedStatus)),
    refetchFeed: fetchFeed,
    refetchActivities: fetchActivities,
    create,
  };
}
