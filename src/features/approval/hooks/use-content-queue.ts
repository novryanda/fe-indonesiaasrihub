"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { ContentItem, PaginatedMeta, ReviewHistoryItem } from "@/features/content-shared/types/content.type";
import { ApiError } from "@/shared/api/api-client";

import { finalApproveContent } from "../api/final-approve-content";
import { getContentQueue } from "../api/get-content-queue";
import { getReviewHistory } from "../api/get-review-history";
import { reviewContent } from "../api/review-content";
import type {
  ApprovalBoardMode,
  ApprovalQueueFilters,
  ReviewDecisionPayload,
  ReviewDecisionResponse,
} from "../types/content-approval.type";

const INITIAL_FILTERS: ApprovalQueueFilters = {
  search: "",
  platform: "all",
  regional: "all",
  dateFrom: "",
  dateTo: "",
  page: 1,
  limit: 12,
};

export function useContentQueue(mode: ApprovalBoardMode, accessToken?: string) {
  const [filters, setFilters] = useState<ApprovalQueueFilters>(INITIAL_FILTERS);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutatingItemId, setMutatingItemId] = useState<string | undefined>();

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getContentQueue(mode, filters, accessToken);
      setItems(response.data);
      setMeta(response.meta ?? null);
    } catch (errorValue) {
      if (errorValue instanceof ApiError) {
        setError(errorValue.message);
      } else {
        setError("Gagal memuat antrian konten");
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters, mode]);

  useEffect(() => {
    void fetchQueue();
  }, [fetchQueue]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filters.dateFrom && item.created_at < filters.dateFrom) {
        return false;
      }

      if (filters.dateTo && item.created_at > `${filters.dateTo}T23:59:59`) {
        return false;
      }

      return true;
    });
  }, [filters.dateFrom, filters.dateTo, items]);

  const availableRegionals = useMemo(() => {
    return Array.from(
      new Set(items.map((item) => item.officer.regional).filter((item): item is string => Boolean(item))),
    );
  }, [items]);

  const decide = useCallback(
    async (contentId: string, payload: ReviewDecisionPayload): Promise<ReviewDecisionResponse> => {
      setMutatingItemId(contentId);

      try {
        const response =
          mode === "regional-review"
            ? await reviewContent(contentId, payload, accessToken)
            : await finalApproveContent(contentId, payload, accessToken);

        await fetchQueue();
        return response.data;
      } catch (errorValue) {
        if (errorValue instanceof ApiError) {
          throw new Error(errorValue.message);
        }

        throw new Error("Gagal memproses keputusan review");
      } finally {
        setMutatingItemId(undefined);
      }
    },
    [accessToken, fetchQueue, mode],
  );

  const loadHistory = useCallback(
    async (contentId: string): Promise<ReviewHistoryItem[]> => {
      try {
        const response = await getReviewHistory(contentId, accessToken);
        return response.data;
      } catch (errorValue) {
        if (errorValue instanceof ApiError) {
          throw new Error(errorValue.message);
        }

        throw new Error("Gagal memuat riwayat review");
      }
    },
    [accessToken],
  );

  return {
    items: filteredItems,
    meta,
    filters,
    setFilters,
    isLoading,
    error,
    isMutatingItemId,
    availableRegionals,
    refetch: fetchQueue,
    decide,
    loadHistory,
  };
}
