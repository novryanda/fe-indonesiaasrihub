import { apiClient } from "@/shared/api/api-client";
import { resolveWilayahId, resolveWilayahIds } from "@/shared/api/wilayah";

import type { UploadBankContentPayload, UploadBankContentResponse } from "../types/content-library.type";

async function buildResolvedFormData(payload: UploadBankContentPayload) {
  const formData = new FormData();
  const wilayahId = await resolveWilayahId(payload.regional_asal);
  const visibilityTargets = await resolveWilayahIds(payload.visibility_target_wilayah_ids);
  const assignmentTargets = await resolveWilayahIds(payload.assignment_target_wilayah_ids);

  formData.append("judul", payload.judul);

  if (payload.deskripsi?.trim()) {
    formData.append("deskripsi", payload.deskripsi.trim());
  }

  payload.platform.forEach((platform) => {
    formData.append("platform", platform);
  });
  formData.append("jenis_konten", payload.jenis_konten);
  formData.append("topik", payload.topik);
  formData.append("source_wilayah_id", wilayahId ?? "");
  formData.append("tahun_kampanye", String(payload.tahun_kampanye));
  formData.append("drive_link", payload.drive_link);
  formData.append("visibility_scope", payload.visibility_scope);
  formData.append("assignment_scope", payload.assignment_scope);
  visibilityTargets.forEach((wilayah) => {
    formData.append("visibility_target_wilayah_ids", wilayah);
  });
  assignmentTargets.forEach((wilayah) => {
    formData.append("assignment_target_wilayah_ids", wilayah);
  });
  payload.hashtags.forEach((hashtag) => {
    formData.append("hashtags", hashtag);
  });

  return formData;
}

export async function uploadBankContent(payload: UploadBankContentPayload, _accessToken?: string) {
  return apiClient<UploadBankContentResponse>("/v1/bank-konten", {
    method: "POST",
    body: await buildResolvedFormData(payload),
  });
}
