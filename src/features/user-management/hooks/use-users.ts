"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "@/shared/api/api-client";

import { getUsers } from "../api/get-users";
import type { ListUsersData, ListUsersMeta, ListUsersQuery, UserRole, UserStatus } from "../types/user-management.type";

export interface UsersFilterState {
  role: "all" | UserRole;
  status: "all" | UserStatus;
  search: string;
  page: number;
  limit: number;
}

const INITIAL_FILTERS: UsersFilterState = {
  role: "all",
  status: "all",
  search: "",
  page: 1,
  limit: 20,
};

function toQuery(filters: UsersFilterState): ListUsersQuery {
  return {
    role: filters.role === "all" ? undefined : filters.role,
    status: filters.status === "all" ? undefined : filters.status,
    search: filters.search.trim() || undefined,
    page: filters.page,
    limit: filters.limit,
  };
}

export function useUsers(accessToken?: string) {
  const [filters, setFilters] = useState<UsersFilterState>(INITIAL_FILTERS);
  const [data, setData] = useState<ListUsersData | null>(null);
  const [meta, setMeta] = useState<ListUsersMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => toQuery(filters), [filters]);

  const fetchUsers = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getUsers(query, accessToken, signal);

        if (signal?.aborted) {
          return;
        }

        setData(response.data);
        setMeta(response.meta ?? null);
      } catch (errorValue) {
        if (signal?.aborted) {
          return;
        }

        if (errorValue instanceof ApiError) {
          setError(errorValue.message);
        } else {
          setError("Gagal memuat data user");
        }
      } finally {
        if (!signal?.aborted) {
          setHasFetchedOnce(true);
          setIsLoading(false);
        }
      }
    },
    [accessToken, query],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchUsers(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchUsers]);

  const updateFilters = useCallback((updater: (previous: UsersFilterState) => UsersFilterState) => {
    setFilters((previous) => updater(previous));
  }, []);

  return {
    users: data?.users ?? [],
    stats: data?.stats,
    meta,
    isLoading,
    isInitialLoading: isLoading && !hasFetchedOnce,
    isSearching: isLoading && hasFetchedOnce && Boolean(filters.search.trim()),
    error,
    filters,
    setFilters: updateFilters,
    refetch: () => fetchUsers(),
  };
}
