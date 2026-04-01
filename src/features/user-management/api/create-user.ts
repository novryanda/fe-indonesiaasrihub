import { apiClient } from "@/shared/api/api-client";

import type { CreateUserPayload, CreateUserResult } from "../types/user-management.type";

export async function createUser(payload: CreateUserPayload, _accessToken?: string) {
  const response = await apiClient<{
    id: string;
    name: string;
    username?: string | null;
    email: string;
    phone_number: string | null;
    role: CreateUserResult["role"];
    wilayah_id: string | null;
    wilayah?: {
      id: string;
      nama: string;
    } | null;
    message: string;
  }>("/v1/users", {
    method: "POST",
    body: {
      name: payload.name,
      username: payload.username,
      email: payload.email,
      phone_number: payload.phone_number ?? null,
      role: payload.role,
      wilayah_id: payload.wilayah_id ?? null,
      password: payload.password,
    },
  });

  return {
    ...response,
    data: {
      id: response.data.id,
      name: response.data.name,
      username: response.data.username ?? payload.username,
      email: response.data.email,
      phone_number: response.data.phone_number,
      role: response.data.role,
      wilayah_id: response.data.wilayah_id,
      regional: response.data.wilayah?.nama ?? null,
      message: response.data.message,
    },
  };
}
