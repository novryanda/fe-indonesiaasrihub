import { apiClient } from "@/shared/api/api-client";

import type { ImportUsersResult } from "../types/user-management.type";

export async function importUsers(file: File, _accessToken?: string) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient<ImportUsersResult>("/v1/users/import", {
    method: "POST",
    body: formData,
  });

  return response.data;
}
