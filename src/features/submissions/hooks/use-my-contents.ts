"use client";

import { useCallback, useEffect, useState } from "react";

import { getReviewHistory } from "@/features/approval/api/get-review-history";
import type { ContentItem, PaginatedMeta, ReviewHistoryItem } from "@/features/content-shared/types/content.type";
import { ApiError } from "@/shared/api/api-client";

import { getMyContents } from "../api/get-my-contents";
import type { MyContentsFilters } from "../types/my-contents.type";

const INITIAL_FILTERS: MyContentsFilters = {
  search: "",
  status: "all",
  platform: "all",
  dateFrom: "",
  dateTo: "",
  page: 1,
  limit: 20,
};

export function useMyContents(accessToken?: string) {
  const [filters, setFilters] = useState<MyContentsFilters>(INITIAL_FILTERS);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getMyContents(filters, accessToken);
      setItems(response.data);
      setMeta(response.meta ?? null);
    } catch (errorValue) {
      if (errorValue instanceof ApiError) {
        setError(errorValue.message);
      } else {
        setError("Gagal memuat daftar konten Anda");
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters]);

  useEffect(() => {
    void fetchContents();
  }, [fetchContents]);

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
    items,
    meta,
    filters,
    setFilters,
    isLoading,
    error,
    refetch: fetchContents,
    loadHistory,
  };
}
