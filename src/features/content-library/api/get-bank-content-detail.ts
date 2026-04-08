import { apiClient } from "@/shared/api/api-client";

import type { BankContentDetail } from "../types/content-library.type";

function mapLegacyAccessStatus(scope: BankContentDetail["visibility_scope"]): BankContentDetail["status_akses"] {
  return scope === "targeted_regions" ? "terbatas" : "publik";
}

export async function getBankContentDetail(contentId: string, _accessToken?: string) {
  const response = await apiClient<{
    id: string;
    submission_code: string | null;
    judul: string;
    deskripsi: string | null;
    platform: BankContentDetail["platform"];
    jenis_konten: string;
    topik: string;
    source_wilayah_id: string;
    source_wilayah: {
      id: string;
      nama: string;
      kode: string;
      level: string;
    };
    tahun_kampanye: number;
    drive_link: string;
    hashtags: string[];
    visibility_scope: BankContentDetail["visibility_scope"];
    visibility_targets: BankContentDetail["visibility_targets"];
    assignment_scope: BankContentDetail["assignment_scope"];
    assignment_targets: BankContentDetail["assignment_targets"];
    task_summary: BankContentDetail["task_summary"];
    uploaded_by: string;
    source_content?: BankContentDetail["source_content"];
    jumlah_posting_digunakan: number;
    jumlah_konten_turunan: number;
    penggunaan_posting: Array<{
      id: string;
      posted_at: string;
      social_account: BankContentDetail["penggunaan_posting"][number]["social_account"];
      pic_sosmed: {
        id: string;
        name: string;
        wilayah_id: string | null;
        wilayah: {
          id: string;
          nama: string;
        } | null;
      } | null;
      bukti_posting_id: string | null;
      pic_bukti_posting: {
        id: string;
        name: string;
        wilayah_id: string | null;
      } | null;
      post_url: string | null;
      validation_status: string | null;
    }>;
    created_at: string;
    updated_at: string;
  }>(`/v1/bank-konten/${contentId}`, {
    method: "GET",
  });

  return {
    ...response,
    data: {
      id: response.data.id,
      submission_code: response.data.submission_code,
      judul: response.data.judul,
      deskripsi: response.data.deskripsi,
      platform: response.data.platform,
      jenis_konten: response.data.jenis_konten,
      topik: response.data.topik,
      wilayah_id: response.data.source_wilayah_id,
      source_wilayah_id: response.data.source_wilayah_id,
      regional_asal: response.data.source_wilayah.nama,
      tahun_kampanye: response.data.tahun_kampanye,
      drive_link: response.data.drive_link,
      hashtags: response.data.hashtags,
      status_akses: mapLegacyAccessStatus(response.data.visibility_scope),
      visibility_scope: response.data.visibility_scope,
      visibility_targets: response.data.visibility_targets,
      assignment_scope: response.data.assignment_scope,
      assignment_targets: response.data.assignment_targets,
      task_summary: response.data.task_summary,
      regional_terbatas: response.data.visibility_targets.map((item) => item.nama),
      uploaded_by: response.data.uploaded_by,
      source_content: response.data.source_content ?? null,
      jumlah_posting_digunakan: response.data.jumlah_posting_digunakan,
      jumlah_konten_turunan: response.data.jumlah_konten_turunan,
      penggunaan_posting: response.data.penggunaan_posting.map((usage) => ({
        id: usage.id,
        posted_at: usage.posted_at,
        social_account: usage.social_account,
        pic_sosmed: usage.pic_sosmed
          ? {
              id: usage.pic_sosmed.id,
              name: usage.pic_sosmed.name,
              regional: usage.pic_sosmed.wilayah?.nama ?? null,
            }
          : null,
        bukti_posting_id: usage.bukti_posting_id,
        pic_bukti_posting: usage.pic_bukti_posting
          ? {
              id: usage.pic_bukti_posting.id,
              name: usage.pic_bukti_posting.name,
              regional: null,
            }
          : null,
        post_url: usage.post_url,
        validation_status: usage.validation_status,
      })),
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
    },
  };
}
