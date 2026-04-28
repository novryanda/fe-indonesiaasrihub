"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "@/shared/api/api-client";

import { createBlastActivity } from "../api/create-blast-activity";
import { createManualBlastQueue } from "../api/create-manual-blast-queue";
import { decideBlast } from "../api/decide-blast";
import { deleteBlastActivity } from "../api/delete-blast-activity";
import { getBlastActivities } from "../api/get-blast-activities";
import { getBlastCandidates } from "../api/get-blast-candidates";
import { getBlastFeed } from "../api/get-blast-feed";
import { keepBlastAssignment } from "../api/keep-blast-assignment";
import { updateBlastActivityMetrics } from "../api/update-blast-activity-metrics";
import type {
  BlastActivityFilters,
  BlastActivityItem,
  BlastActivityStats,
  BlastCandidateFilters,
  BlastCandidateItem,
  BlastFeedFilters,
  BlastFeedItem,
  BlastFeedScope,
  BlastMeta,
  BlastReferenceStatus,
  CreateBlastActivityPayload,
  CreateBlastActivityResult,
  CreateManualBlastQueuePayload,
  CreateManualBlastQueueResult,
  DecideBlastPayload,
  DeleteBlastActivityResult,
  KeepBlastAssignmentResult,
  UpdateBlastActivityMetricsPayload,
  UpdateBlastActivityMetricsResult,
} from "../types/blast-activity.type";

function createInitialFeedFilters(status: BlastReferenceStatus, scope: BlastFeedScope = "available"): BlastFeedFilters {
  return {
    platform: "all",
    social_account_id: "all",
    status,
    scope,
    sort_direction: "asc",
    date_from: "",
    date_to: "",
    search: "",
    page: 1,
    limit: 6,
  };
}

const INITIAL_ACTIVITY_FILTERS: BlastActivityFilters = {
  platform: "all",
  social_account_id: "all",
  date_from: "",
  date_to: "",
  search: "",
  page: 1,
  limit: 20,
};

const INITIAL_CANDIDATE_FILTERS: BlastCandidateFilters = {
  platform: "all",
  social_account_id: "all",
  sort_direction: "desc",
  search: "",
  page: 1,
  limit: 10,
};

export function useBlastActivity(mode: "blast" | "superadmin", initialFeedStatus: BlastReferenceStatus = "all") {
  const [feedFilters, setFeedFilters] = useState<BlastFeedFilters>(() => createInitialFeedFilters(initialFeedStatus));
  const [keptFeedFilters, setKeptFeedFilters] = useState<BlastFeedFilters>(() =>
    createInitialFeedFilters("unblasted", "kept"),
  );
  const [activityFilters, setActivityFilters] = useState<BlastActivityFilters>(INITIAL_ACTIVITY_FILTERS);
  const [candidateFilters, setCandidateFilters] = useState<BlastCandidateFilters>(INITIAL_CANDIDATE_FILTERS);
  const [feedItems, setFeedItems] = useState<BlastFeedItem[]>([]);
  const [keptFeedItems, setKeptFeedItems] = useState<BlastFeedItem[]>([]);
  const [candidateItems, setCandidateItems] = useState<BlastCandidateItem[]>([]);
  const [activities, setActivities] = useState<BlastActivityItem[]>([]);
  const [stats, setStats] = useState<BlastActivityStats | null>(null);
  const [feedMeta, setFeedMeta] = useState<BlastMeta | null>(null);
  const [keptFeedMeta, setKeptFeedMeta] = useState<BlastMeta | null>(null);
  const [candidateMeta, setCandidateMeta] = useState<BlastMeta | null>(null);
  const [activityMeta, setActivityMeta] = useState<BlastMeta | null>(null);
  const [isFeedLoading, setFeedLoading] = useState(mode === "blast");
  const [isKeptFeedLoading, setKeptFeedLoading] = useState(mode === "blast" && initialFeedStatus === "unblasted");
  const [isCandidatesLoading, setCandidatesLoading] = useState(mode === "superadmin");
  const [isActivitiesLoading, setActivitiesLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [keptFeedError, setKeptFeedError] = useState<string | null>(null);
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

  const fetchKeptFeed = useCallback(async () => {
    if (mode !== "blast" || initialFeedStatus !== "unblasted") {
      return;
    }

    setKeptFeedLoading(true);
    setKeptFeedError(null);

    try {
      const response = await getBlastFeed(keptFeedFilters);
      setKeptFeedItems(response.data);
      setKeptFeedMeta(response.meta ?? null);
    } catch (errorValue) {
      if (errorValue instanceof ApiError) {
        setKeptFeedError(errorValue.message);
      } else {
        setKeptFeedError("Gagal memuat daftar keep blast");
      }
    } finally {
      setKeptFeedLoading(false);
    }
  }, [initialFeedStatus, keptFeedFilters, mode]);

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
    void fetchKeptFeed();
  }, [fetchKeptFeed]);

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
        await fetchKeptFeed();
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
    [fetchActivities, fetchFeed, fetchKeptFeed],
  );

  const keep = useCallback(
    async (assignmentId: string): Promise<KeepBlastAssignmentResult> => {
      setSubmitting(true);

      try {
        const response = await keepBlastAssignment(assignmentId);
        await fetchFeed();
        await fetchKeptFeed();
        return response.data;
      } catch (errorValue) {
        if (errorValue instanceof ApiError) {
          throw new Error(errorValue.message);
        }

        throw new Error("Gagal keep antrian blast");
      } finally {
        setSubmitting(false);
      }
    },
    [fetchFeed, fetchKeptFeed],
  );

  const remove = useCallback(
    async (activityId: string): Promise<DeleteBlastActivityResult> => {
      setSubmitting(true);

      try {
        const response = await deleteBlastActivity(activityId);
        await fetchActivities();
        await fetchFeed();
        await fetchKeptFeed();
        return response.data;
      } catch (errorValue) {
        if (errorValue instanceof ApiError) {
          throw new Error(errorValue.message);
        }

        throw new Error("Gagal menghapus aktivitas blast");
      } finally {
        setSubmitting(false);
      }
    },
    [fetchActivities, fetchFeed, fetchKeptFeed],
  );

  const updateMetrics = useCallback(
    async (
      activityId: string,
      payload: UpdateBlastActivityMetricsPayload,
    ): Promise<UpdateBlastActivityMetricsResult> => {
      setSubmitting(true);

      try {
        const response = await updateBlastActivityMetrics(activityId, payload);
        await fetchActivities();
        return response.data;
      } catch (errorValue) {
        if (errorValue instanceof ApiError) {
          throw new Error(errorValue.message);
        }

        throw new Error("Gagal memperbarui metrik aktivitas blast");
      } finally {
        setSubmitting(false);
      }
    },
    [fetchActivities],
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
    keptFeedItems,
    candidateItems,
    activities,
    stats,
    feedMeta,
    keptFeedMeta,
    candidateMeta,
    activityMeta,
    activityTotalPages,
    feedFilters,
    setFeedFilters,
    keptFeedFilters,
    setKeptFeedFilters,
    candidateFilters,
    setCandidateFilters,
    activityFilters,
    setActivityFilters,
    isFeedLoading,
    isKeptFeedLoading,
    isCandidatesLoading,
    isActivitiesLoading,
    isSubmitting,
    feedError,
    keptFeedError,
    candidateError,
    activitiesError,
    resetFeedFilters: () => setFeedFilters(createInitialFeedFilters(initialFeedStatus)),
    resetKeptFeedFilters: () => setKeptFeedFilters(createInitialFeedFilters("unblasted", "kept")),
    refetchFeed: fetchFeed,
    refetchKeptFeed: fetchKeptFeed,
    refetchCandidates: fetchCandidates,
    refetchActivities: fetchActivities,
    create,
    keep,
    remove,
    updateMetrics,
    decide,
    createManualQueue,
  };
}
