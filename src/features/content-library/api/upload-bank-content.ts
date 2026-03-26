import { apiClient } from "@/shared/api/api-client";
import { resolveWilayahId, resolveWilayahIds } from "@/shared/api/wilayah";

import type { UploadBankContentPayload, UploadBankContentResponse } from "../types/content-library.type";

async function buildResolvedFormData(payload: UploadBankContentPayload) {
  const formData = new FormData();
  const wilayahId = await resolveWilayahId(payload.regional_asal);
  const wilayahTerbatas = await resolveWilayahIds(payload.regional_terbatas);

  formData.append("judul", payload.judul);

  if (payload.deskripsi?.trim()) {
    formData.append("deskripsi", payload.deskripsi.trim());
  }

  payload.platform.forEach((platform) => {
    formData.append("platform", platform);
  });
  formData.append("jenis_konten", payload.jenis_konten);
  formData.append("topik", payload.topik);
  formData.append("wilayah_id", wilayahId ?? "");
  formData.append("tahun_kampanye", String(payload.tahun_kampanye));
  formData.append("drive_link", payload.drive_link);
  formData.append("jumlah_file", payload.jumlah_file);
  formData.append("status_akses", payload.status_akses);
  wilayahTerbatas.forEach((wilayah) => {
    formData.append("wilayah_terbatas", wilayah);
  });
  payload.hashtags.forEach((hashtag) => {
    formData.append("hashtags", hashtag);
  });

  if (payload.thumbnail) {
    formData.append("thumbnail", payload.thumbnail);
  }

  return formData;
}

export async function uploadBankContent(payload: UploadBankContentPayload, _accessToken?: string) {
  return apiClient<UploadBankContentResponse>("/v1/bank-konten", {
    method: "POST",
    body: await buildResolvedFormData(payload),
  });
}
