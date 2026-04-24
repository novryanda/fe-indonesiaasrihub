import { apiClient } from "@/shared/api/api-client";

import type {
  UpdateBankContentContentDetailsPayload,
  UpdateBankContentContentDetailsResponse,
} from "../types/content-library.type";

export async function updateBankContentContentDetails(
  contentId: string,
  payload: UpdateBankContentContentDetailsPayload,
  _accessToken?: string,
) {
  return apiClient<UpdateBankContentContentDetailsResponse>(`/v1/bank-konten/${contentId}/content-details`, {
    method: "PATCH",
    body: {
      caption: payload.caption,
      hashtags: payload.hashtags,
    },
  });
}
