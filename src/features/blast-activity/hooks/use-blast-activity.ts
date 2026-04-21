"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "@/shared/api/api-client";

import { createBlastActivity } from "../api/create-blast-activity";
import { createManualBlastQueue } from "../api/create-manual-blast-queue";
import { decideBlast } from "../api/decide-blast";
import { getBlastActivities } from "../api/get-blast-activities";
import { getBlastCandidates } from "../api/get-blast-candidates";
import { getBlastFeed } from "../api/get-blast-feed";
import type {
  BlastActivityFilters,
  BlastActivityItem,
  BlastActivityStats,
  BlastCandidateFilters,
  BlastCandidateItem,
  BlastFeedFilters,
  BlastFeedItem,
  BlastMeta,
  BlastReferenceStatus,
  CreateBlastActivityPayload,
  CreateBlastActivityResult,
  CreateManualBlastQueuePayload,
  CreateManualBlastQueueResult,
  DecideBlastPayload,
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

const INITIAL_CANDIDATE_FILTERS: BlastCandidateFilters = {
  platform: "all",
  search: "",
  page: 1,
  limit: 10,
};

export function useBlastActivity(mode: "blast" | "superadmin", initialFeedStatus: BlastReferenceStatus = "all") {
  const [feedFilters, setFeedFilters] = useState<BlastFeedFilters>(() => createInitialFeedFilters(initialFeedStatus));
  const [activityFilters, setActivityFilters] = useState<BlastActivityFilters>(INITIAL_ACTIVITY_FILTERS);
  const [candidateFilters, setCandidateFilters] = useState<BlastCandidateFilters>(INITIAL_CANDIDATE_FILTERS);
  const [feedItems, setFeedItems] = useState<BlastFeedItem[]>([]);
  const [candidateItems, setCandidateItems] = useState<BlastCandidateItem[]>([]);
  const [activities, setActivities] = useState<BlastActivityItem[]>([]);
  const [stats, setStats] = useState<BlastActivityStats | null>(null);
  const [feedMeta, setFeedMeta] = useState<BlastMeta | null>(null);
  const [candidateMeta, setCandidateMeta] = useState<BlastMeta | null>(null);
  const [activityMeta, setActivityMeta] = useState<BlastMeta | null>(null);
  const [isFeedLoading, setFeedLoading] = useState(mode === "blast");
  const [isCandidatesLoading, setCandidatesLoading] = useState(mode === "superadmin");
  const [isActivitiesLoading, setActivitiesLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [candidateError, setCandidateError] = useState<string | null>(null);
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

  const fetchCandidates = useCallback(async () => {
    if (mode !== "superadmin") {
      return;
    }

    setCandidatesLoading(true);
    setCandidateError(null);

    try {
      const response = await getBlastCandidates(candidateFilters);
      setCandidateItems(response.data);
      setCandidateMeta(response.meta ?? null);
    } catch (errorValue) {
      if (errorValue instanceof ApiError) {
        setCandidateError(errorValue.message);
      } else {
        setCandidateError("Gagal memuat postingan valid untuk keputusan blast");
      }
    } finally {
      setCandidatesLoading(false);
    }
  }, [candidateFilters, mode]);

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

  useEffect(() => {
    void fetchCandidates();
  }, [fetchCandidates]);

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

  const decide = useCallback(
    async (payload: DecideBlastPayload) => {
      setSubmitting(true);

      try {
        const response = await decideBlast(payload);
        await fetchCandidates();
        await fetchFeed();
        return response.data;
      } catch (errorValue) {
        if (errorValue instanceof ApiError) {
          throw new Error(errorValue.message);
        }

        throw new Error("Gagal menyimpan keputusan blast");
      } finally {
        setSubmitting(false);
      }
    },
    [fetchCandidates, fetchFeed],
  );

  const createManualQueue = useCallback(
    async (payload: CreateManualBlastQueuePayload): Promise<CreateManualBlastQueueResult> => {
      setSubmitting(true);

      try {
        const response = await createManualBlastQueue(payload);
        return response.data;
      } catch (errorValue) {
        if (errorValue instanceof ApiError) {
          throw new Error(errorValue.message);
        }

        throw new Error("Gagal membuat antrian blast manual");
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  const activityTotalPages = useMemo(() => {
    if (!activityMeta) {
      return 1;
    }

    return Math.max(1, Math.ceil(activityMeta.total / activityMeta.limit));
  }, [activityMeta]);

  return {
    feedItems,
    candidateItems,
    activities,
    stats,
    feedMeta,
    candidateMeta,
    activityMeta,
    activityTotalPages,
    feedFilters,
    setFeedFilters,
    candidateFilters,
    setCandidateFilters,
    activityFilters,
    setActivityFilters,
    isFeedLoading,
    isCandidatesLoading,
    isActivitiesLoading,
    isSubmitting,
    feedError,
    candidateError,
    activitiesError,
    resetFeedFilters: () => setFeedFilters(createInitialFeedFilters(initialFeedStatus)),
    refetchFeed: fetchFeed,
    refetchCandidates: fetchCandidates,
    refetchActivities: fetchActivities,
    create,
    decide,
    createManualQueue,
  };
}
