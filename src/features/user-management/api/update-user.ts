import { apiClient } from "@/shared/api/api-client";

import type { UpdateUserPayload, UpdateUserResult } from "../types/user-management.type";

export async function updateUser(userId: string, payload: UpdateUserPayload, _accessToken?: string) {
  const response = await apiClient<{
    id: string;
    name: string;
    username?: string | null;
    phone_number: string | null;
    additional_phone_numbers?: string[];
    phone_numbers?: string[];
    role: UpdateUserResult["role"];
    wilayah_id: string | null;
    wilayah?: {
      id: string;
      nama: string;
    } | null;
    status: UpdateUserResult["status"];
    updated_at: string;
  }>(`/v1/users/${userId}`, {
    method: "PATCH",
    body: {
      name: payload.name,
      username: payload.username,
      phone_number: payload.phone_number,
      additional_phone_numbers: payload.additional_phone_numbers ?? [],
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
      username: response.data.username ?? payload.username ?? null,
      phone_number: response.data.phone_number,
      additional_phone_numbers: response.data.additional_phone_numbers ?? [],
      phone_numbers: response.data.phone_numbers ?? [
        response.data.phone_number,
        ...(response.data.additional_phone_numbers ?? []),
      ].filter((phoneNumber): phoneNumber is string => Boolean(phoneNumber)),
      role: response.data.role,
      wilayah_id: response.data.wilayah_id,
      regional: response.data.wilayah?.nama ?? null,
      status: response.data.status,
      updated_at: response.data.updated_at,
    },
  };
}
