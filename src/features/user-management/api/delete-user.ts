import { apiClient } from "@/shared/api/api-client";

import type { DeleteUserResult } from "../types/user-management.type";

export async function deleteUser(userId: string, _accessToken?: string) {
  return apiClient<DeleteUserResult>(`/v1/users/${userId}`, {
    method: "DELETE",
  });
}
