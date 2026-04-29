import { apiClient } from "@/shared/api/api-client";

import type { CreateUserPayload, CreateUserResult } from "../types/user-management.type";

export async function createUser(payload: CreateUserPayload, _accessToken?: string) {
  const response = await apiClient<{
    id: string;
    name: string;
    username?: string | null;
    email: string;
    phone_number: string | null;
    additional_phone_numbers?: string[];
    phone_numbers?: string[];
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
      additional_phone_numbers: payload.additional_phone_numbers ?? [],
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
      additional_phone_numbers: response.data.additional_phone_numbers ?? [],
      phone_numbers: response.data.phone_numbers ?? [
        response.data.phone_number,
        ...(response.data.additional_phone_numbers ?? []),
      ].filter((phoneNumber): phoneNumber is string => Boolean(phoneNumber)),
      role: response.data.role,
      wilayah_id: response.data.wilayah_id,
      regional: response.data.wilayah?.nama ?? null,
      message: response.data.message,
    },
  };
}
