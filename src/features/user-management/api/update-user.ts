import { apiClient } from "@/shared/api/api-client";

import type { UpdateUserPayload, UpdateUserResult } from "../types/user-management.type";

export async function updateUser(userId: string, payload: UpdateUserPayload, _accessToken?: string) {
  const response = await apiClient<
    {
      id: string;
      name: string;
      phone_number: string | null;
      role: UpdateUserResult["role"];
      wilayah_id: string | null;
      wilayah?: {
        id: string;
        nama: string;
      } | null;
      status: UpdateUserResult["status"];
      updated_at: string;
    }
  >(`/v1/users/${userId}`, {
    method: "PATCH",
      body: {
        name: payload.name,
        phone_number: payload.phone_number,
        role: payload.role,
        wilayah_id: payload.wilayah_id,
        status: payload.status,
      },
  });

  return {
    ...response,
    data: {
      id: response.data.id,
      name: response.data.name,
      phone_number: response.data.phone_number,
      role: response.data.role,
      wilayah_id: response.data.wilayah_id,
      regional: response.data.wilayah?.nama ?? null,
      status: response.data.status,
      updated_at: response.data.updated_at,
    },
  };
}
