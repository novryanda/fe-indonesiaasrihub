import { apiClient } from "@/shared/api/api-client";

import type { ContentSubmissionPayload, CreateContentSubmissionResponse } from "../types/content-submission.type";

export function buildContentSubmissionRequestBody(payload: ContentSubmissionPayload) {
  return {
    judul: payload.judul,
    platform: payload.platform,
    jenis_konten: payload.jenis_konten,
    topik: payload.topik,
    tanggal_posting: payload.tanggal_posting,
    drive_link: payload.drive_link,
    caption: payload.caption,
    hashtags: payload.hashtags,
    durasi_konten: payload.durasi_konten ?? undefined,
    urgensi: payload.urgensi,
    visibility_scope: payload.visibility_scope,
    assignment_scope: payload.assignment_scope,
    visibility_target_wilayah_ids: payload.visibility_target_wilayah_ids,
    assignment_target_wilayah_ids: payload.assignment_target_wilayah_ids,
    catatan_reviewer: payload.catatan_reviewer?.trim() ? payload.catatan_reviewer.trim() : undefined,
  };
}

export async function createContentSubmission(payload: ContentSubmissionPayload, _accessToken?: string) {
  return apiClient<CreateContentSubmissionResponse>("/v1/konten", {
    method: "POST",
    body: buildContentSubmissionRequestBody(payload),
  });
}
