import { apiClient } from "@/shared/api/api-client";

import type { AccountProfileData, ChangeMyPasswordPayload } from "../types/account-profile.type";

function resolveAuthErrorMessage(payload: unknown, fallback = "Gagal mengubah password") {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const payloadRecord = payload as Record<string, unknown>;
  if (typeof payloadRecord.message === "string") {
    return payloadRecord.message;
  }

  if (payloadRecord.error && typeof payloadRecord.error === "object") {
    const errorRecord = payloadRecord.error as Record<string, unknown>;
    if (typeof errorRecord.message === "string") {
      return errorRecord.message;
    }
  }

  return fallback;
}

export async function getMyAccountProfile() {
  return apiClient<AccountProfileData>("/v1/users/me", {
    method: "GET",
  });
}

export async function changeMyPassword(payload: ChangeMyPasswordPayload) {
  const response = await fetch("/api/auth/change-password", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as {
    token?: string | null;
    user?: {
      id: string;
      email: string;
      name: string;
    };
    message?: string;
    error?: {
      message?: string;
    };
  } | null;

  if (!response.ok) {
    throw new Error(resolveAuthErrorMessage(data));
  }

  return data;
}
