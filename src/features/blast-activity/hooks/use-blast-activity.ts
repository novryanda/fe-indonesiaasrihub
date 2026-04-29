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
import { releaseBlastAssignmentKeep } from "../api/release-blast-assignment-keep";
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
  ReleaseBlastAssignmentKeepResult,
  UpdateBlastActivityMetricsPayload,
  UpdateBlastActivityMetricsResult,
} from "../types/blast-activity.type";

function createInitialFeedFilters(
  status: BlastReferenceStatus,
  scope: BlastFeedScope = "available",
  timeliness: BlastFeedFilters["timeliness"] = "all",
): BlastFeedFilters {
  return {
    platform: "all",
    social_account_id: "all",
    status,
    scope,
    timeliness,
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
  const [feedFilters, setFeedFilters] = useState<BlastFeedFilters>(() =>
    createInitialFeedFilters(initialFeedStatus, "available", initialFeedStatus === "unblasted" ? "on_time" : "all"),
  );
  const [overdueFeedFilters, setOverdueFeedFilters] = useState<BlastFeedFilters>(() =>
    createInitialFeedFilters("unblasted", "available", "overdue"),
  );
  const [keptFeedFilters, setKeptFeedFilters] = useState<BlastFeedFilters>(() =>
    createInitialFeedFilters("unblasted", "kept"),
  );
  const [activityFilters, setActivityFilters] = useState<BlastActivityFilters>(INITIAL_ACTIVITY_FILTERS);
  const [candidateFilters, setCandidateFilters] = useState<BlastCandidateFilters>(INITIAL_CANDIDATE_FILTERS);
  const [feedItems, setFeedItems] = useState<BlastFeedItem[]>([]);
  const [overdueFeedItems, setOverdueFeedItems] = useState<BlastFeedItem[]>([]);
  const [keptFeedItems, setKeptFeedItems] = useState<BlastFeedItem[]>([]);
  const [candidateItems, setCandidateItems] = useState<BlastCandidateItem[]>([]);
  const [activities, setActivities] = useState<BlastActivityItem[]>([]);
  const [stats, setStats] = useState<BlastActivityStats | null>(null);
  const [feedMeta, setFeedMeta] = useState<BlastMeta | null>(null);
  const [overdueFeedMeta, setOverdueFeedMeta] = useState<BlastMeta | null>(null);
  const [keptFeedMeta, setKeptFeedMeta] = useState<BlastMeta | null>(null);
  const [candidateMeta, setCandidateMeta] = useState<BlastMeta | null>(null);
  const [activityMeta, setActivityMeta] = useState<BlastMeta | null>(null);
  const [isFeedLoading, setFeedLoading] = useState(mode === "blast");
  const [isOverdueFeedLoading, setOverdueFeedLoading] = useState(mode === "blast" && initialFeedStatus === "unblasted");
  const [isKeptFeedLoading, setKeptFeedLoading] = useState(mode === "blast" && initialFeedStatus === "unblasted");
  const [isCandidatesLoading, setCandidatesLoading] = useState(mode === "superadmin");
  const [isActivitiesLoading, setActivitiesLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [overdueFeedError, setOverdueFeedError] = useState<string | null>(null);
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

  const fetchOverdueFeed = useCallback(async () => {
    if (mode !== "blast" || initialFeedStatus !== "unblasted") {
      return;
    }

    setOverdueFeedLoading(true);
    setOverdueFeedError(null);

    try {
      const response = await getBlastFeed(overdueFeedFilters);
      setOverdueFeedItems(response.data);
      setOverdueFeedMeta(response.meta ?? null);
    } catch (errorValue) {
      if (errorValue instanceof ApiError) {
        setOverdueFeedError(errorValue.message);
      } else {
        setOverdueFeedError("Gagal memuat antrian yang sudah terlewat");
      }
    } finally {
      setOverdueFeedLoading(false);
    }
  }, [initialFeedStatus, mode, overdueFeedFilters]);

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
    void fetchOverdueFeed();
  }, [fetchOverdueFeed]);

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
        await fetchOverdueFeed();
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
    [fetchActivities, fetchFeed, fetchKeptFeed, fetchOverdueFeed],
  );

  const keep = useCallback(
    async (assignmentId: string): Promise<KeepBlastAssignmentResult> => {
      setSubmitting(true);

      try {
        const response = await keepBlastAssignment(assignmentId);
        await fetchFeed();
        await fetchOverdueFeed();
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
    [fetchFeed, fetchKeptFeed, fetchOverdueFeed],
  );

  const releaseKeep = useCallback(
    async (assignmentId: string): Promise<ReleaseBlastAssignmentKeepResult> => {
      setSubmitting(true);

      try {
        const response = await releaseBlastAssignmentKeep(assignmentId);
        await fetchFeed();
        await fetchOverdueFeed();
        await fetchKeptFeed();
        return response.data;
      } catch (errorValue) {
        if (errorValue instanceof ApiError) {
          throw new Error(errorValue.message);
        }

        throw new Error("Gagal menghapus keep antrian blast");
      } finally {
        setSubmitting(false);
      }
    },
    [fetchFeed, fetchKeptFeed, fetchOverdueFeed],
  );

  const remove = useCallback(
    async (activityId: string): Promise<DeleteBlastActivityResult> => {
      setSubmitting(true);

      try {
        const response = await deleteBlastActivity(activityId);
        await fetchActivities();
        await fetchFeed();
        await fetchOverdueFeed();
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
    [fetchActivities, fetchFeed, fetchKeptFeed, fetchOverdueFeed],
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
        await fetchOverdueFeed();
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
    [fetchCandidates, fetchFeed, fetchOverdueFeed],
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
    overdueFeedItems,
    keptFeedItems,
    candidateItems,
    activities,
    stats,
    feedMeta,
    overdueFeedMeta,
    keptFeedMeta,
    candidateMeta,
    activityMeta,
    activityTotalPages,
    feedFilters,
    setFeedFilters,
    overdueFeedFilters,
    setOverdueFeedFilters,
    keptFeedFilters,
    setKeptFeedFilters,
    candidateFilters,
    setCandidateFilters,
    activityFilters,
    setActivityFilters,
    isFeedLoading,
    isOverdueFeedLoading,
    isKeptFeedLoading,
    isCandidatesLoading,
    isActivitiesLoading,
    isSubmitting,
    feedError,
    overdueFeedError,
    keptFeedError,
    candidateError,
    activitiesError,
    resetFeedFilters: () =>
      setFeedFilters(
        createInitialFeedFilters(initialFeedStatus, "available", initialFeedStatus === "unblasted" ? "on_time" : "all"),
      ),
    resetOverdueFeedFilters: () => setOverdueFeedFilters(createInitialFeedFilters("unblasted", "available", "overdue")),
    resetKeptFeedFilters: () => setKeptFeedFilters(createInitialFeedFilters("unblasted", "kept")),
    refetchFeed: fetchFeed,
    refetchOverdueFeed: fetchOverdueFeed,
    refetchKeptFeed: fetchKeptFeed,
    refetchCandidates: fetchCandidates,
    refetchActivities: fetchActivities,
    create,
    keep,
    releaseKeep,
    remove,
    updateMetrics,
    decide,
    createManualQueue,
  };
}
