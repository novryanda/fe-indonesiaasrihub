import { apiClient } from "@/shared/api/api-client";

import type {
  AccountProfileData,
  ChangeMyEmailPayload,
  ChangeMyPasswordPayload,
  UpdateMyAccountProfilePayload,
} from "../types/account-profile.type";

function resolveAuthErrorMessage(payload: unknown, fallback = "Gagal mengubah password") {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const payloadRecord = payload as Record<string, unknown>;
  const directMessage = typeof payloadRecord.message === "string" ? payloadRecord.message : null;
  const directCode = typeof payloadRecord.code === "string" ? payloadRecord.code : null;

  if (payloadRecord.error && typeof payloadRecord.error === "object") {
    const errorRecord = payloadRecord.error as Record<string, unknown>;
    const nestedMessage = typeof errorRecord.message === "string" ? errorRecord.message : null;
    const nestedCode = typeof errorRecord.code === "string" ? errorRecord.code : null;

    const resolved = mapAuthErrorMessage(nestedMessage, nestedCode);
    if (resolved) {
      return resolved;
    }
  }

  const resolved = mapAuthErrorMessage(directMessage, directCode);
  if (resolved) {
    return resolved;
  }

  return fallback;
}

function mapAuthErrorMessage(message: string | null, code: string | null) {
  const normalizedMessage = message?.toLowerCase() ?? "";
  const normalizedCode = code?.toLowerCase() ?? "";

  if (
    normalizedCode.includes("username_is_already_taken") ||
    normalizedMessage.includes("username is already taken") ||
    normalizedMessage.includes("username already exists")
  ) {
    return "Username sudah digunakan, gunakan yang lain.";
  }

  if (
    normalizedCode.includes("user_already_exists") ||
    normalizedMessage.includes("user already exists. use another email") ||
    normalizedMessage.includes("email already exists")
  ) {
    return "Email sudah digunakan, gunakan email yang lain.";
  }

  return message;
}

export async function getMyAccountProfile() {
  return apiClient<AccountProfileData>("/v1/users/me", {
    method: "GET",
  });
}

async function postAuthJson<TResponse>(path: string, payload: unknown, fallbackMessage: string) {
  const response = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | (TResponse & {
        message?: string;
        error?: {
          message?: string;
        };
      })
    | null;

  if (!response.ok) {
    throw new Error(resolveAuthErrorMessage(data, fallbackMessage));
  }

  return data;
}

export async function updateMyAccountProfile(payload: UpdateMyAccountProfilePayload) {
  return postAuthJson<{ status?: boolean; user?: Record<string, unknown> }>(
    "/api/auth/update-user",
    {
      name: payload.name,
      username: payload.username,
      phoneNumber: payload.phone_number,
    },
    "Gagal memperbarui profil",
  );
}

export async function changeMyEmail(payload: ChangeMyEmailPayload) {
  return postAuthJson<{ status?: boolean; user?: Record<string, unknown> }>(
    "/api/auth/change-email",
    payload,
    "Gagal memperbarui email",
  );
}

export async function changeMyPassword(payload: ChangeMyPasswordPayload) {
  return postAuthJson<{
    token?: string | null;
    user?: {
      id: string;
      email: string;
      name: string;
    };
  }>("/api/auth/change-password", payload, "Gagal mengubah password");
}
