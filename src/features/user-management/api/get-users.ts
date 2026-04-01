import { apiClient } from "@/shared/api/api-client";

import type { ListUsersData, ListUsersMeta, ListUsersQuery } from "../types/user-management.type";

export async function getUsers(query: ListUsersQuery, _accessToken?: string) {
  const response = await apiClient<
    {
      stats: ListUsersData["stats"];
      users: Array<{
        id: string;
        name: string;
        username?: string | null;
        email: string;
        phone_number: string | null;
        role: ListUsersData["users"][number]["role"];
        wilayah_id: string | null;
        wilayah: {
          id: string;
          nama: string;
          kode: string;
          level: string;
        } | null;
        status: ListUsersData["users"][number]["status"];
        avatar_initials: string;
        email_verified: boolean;
        last_active: string | null;
        created_at: string;
      }>;
    },
    ListUsersMeta
  >("/v1/users", {
    method: "GET",
    params: {
      role: query.role,
      status: query.status,
      search: query.search,
      page: query.page,
      limit: query.limit,
    },
  });

  return {
    ...response,
    data: {
      stats: response.data.stats,
      users: response.data.users.map((user) => ({
        id: user.id,
        name: user.name,
        username: user.username ?? null,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        wilayah_id: user.wilayah_id,
        regional: user.wilayah?.nama ?? null,
        status: user.status,
        avatar_initials: user.avatar_initials,
        email_verified: user.email_verified,
        last_active: user.last_active,
        created_at: user.created_at,
      })),
    },
  };
}
