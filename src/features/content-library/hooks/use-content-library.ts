"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "@/shared/api/api-client";

import { getBankContent } from "../api/get-bank-content";
import { uploadBankContent } from "../api/upload-bank-content";
import type {
  BankContentFilters,
  BankContentItem,
  BankContentMeta,
  BankContentStats,
  UploadBankContentPayload,
  UploadBankContentResponse,
} from "../types/content-library.type";

const INITIAL_FILTERS: BankContentFilters = {
  platform: "all",
  topik: "all",
  wilayah_id: "all",
  date_from: "",
  date_to: "",
  search: "",
  page: 1,
  limit: 20,
};

export function useContentLibrary(accessToken?: string) {
  const [filters, setFilters] = useState<BankContentFilters>(INITIAL_FILTERS);
  const [items, setItems] = useState<BankContentItem[]>([]);
  const [stats, setStats] = useState<BankContentStats | null>(null);
  const [meta, setMeta] = useState<BankContentMeta | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getBankContent(filters, accessToken);
      setItems(response.data.items);
      setStats(response.data.stats);
      setMeta(response.meta ?? null);
    } catch (errorValue) {
      if (errorValue instanceof ApiError) {
        setError(errorValue.message);
      } else {
        setError("Gagal memuat bank konten");
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters]);

  useEffect(() => {
    void fetchLibrary();
  }, [fetchLibrary]);

  const availableTopics = useMemo(() => Array.from(new Set(items.map((item) => item.topik))), [items]);

  const createItem = useCallback(
    async (payload: UploadBankContentPayload): Promise<UploadBankContentResponse> => {
      setUploading(true);

      try {
        const response = await uploadBankContent(payload, accessToken);
        await fetchLibrary();
        return response.data;
      } catch (errorValue) {
        if (errorValue instanceof ApiError) {
          throw new Error(errorValue.message);
        }

        throw new Error("Gagal mengunggah konten ke bank");
      } finally {
        setUploading(false);
      }
    },
    [accessToken, fetchLibrary],
  );

  return {
    items,
    stats,
    meta,
    filters,
    setFilters,
    isLoading,
    isUploading,
    error,
    availableTopics,
    refetch: fetchLibrary,
    createItem,
  };
}
