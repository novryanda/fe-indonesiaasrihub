import { apiClient } from "@/shared/api/api-client";

import type { ValidateDriveLinkResponse } from "../types/content-submission.type";

export async function validateDriveLink(driveLink: string, _accessToken?: string) {
  return apiClient<ValidateDriveLinkResponse>("/v1/konten/drive-validations", {
    method: "POST",
    body: {
      drive_link: driveLink,
    },
  });
}
