import { apiClient } from "@/shared/api/api-client";

import type { ContentSubmissionPayload, CreateContentSubmissionResponse } from "../types/content-submission.type";

export function buildContentSubmissionFormData(payload: ContentSubmissionPayload) {
  const formData = new FormData();

  formData.append("judul", payload.judul);
  payload.platform.forEach((platform) => {
    formData.append("platform", platform);
  });
  formData.append("jenis_konten", payload.jenis_konten);
  formData.append("topik", payload.topik);
  formData.append("tanggal_posting", payload.tanggal_posting);
  formData.append("drive_link", payload.drive_link);
  formData.append("jumlah_file", payload.jumlah_file);
  formData.append("caption", payload.caption);
  payload.hashtags.forEach((hashtag) => {
    formData.append("hashtags", hashtag);
  });

  if (payload.durasi_konten) {
    formData.append("durasi_konten", payload.durasi_konten);
  }

  payload.target_audiens?.forEach((targetAudiens) => {
    formData.append("target_audiens", targetAudiens);
  });

  formData.append("urgensi", payload.urgensi);
  formData.append("tipe", payload.tipe);

  if (payload.catatan_reviewer?.trim()) {
    formData.append("catatan_reviewer", payload.catatan_reviewer.trim());
  }

  if (payload.thumbnail) {
    formData.append("thumbnail", payload.thumbnail);
  }

  return formData;
}

export async function createContentSubmission(payload: ContentSubmissionPayload, _accessToken?: string) {
  return apiClient<CreateContentSubmissionResponse>("/v1/konten", {
    method: "POST",
    body: buildContentSubmissionFormData(payload),
  });
}
