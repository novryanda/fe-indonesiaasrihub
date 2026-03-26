import { apiClient } from "@/shared/api/api-client";
import { resolveWilayahNames } from "@/shared/api/wilayah";

import type { BankContentDetail } from "../types/content-library.type";

export async function getBankContentDetail(contentId: string, _accessToken?: string) {
  const response = await apiClient<
    {
      id: string;
      judul: string;
      deskripsi: string | null;
      platform: BankContentDetail["platform"];
      jenis_konten: string;
      topik: string;
      wilayah_id: string;
      wilayah_asal: {
        id: string;
        nama: string;
      };
      tahun_kampanye: number;
      drive_link: string;
      jumlah_file: BankContentDetail["jumlah_file"];
      thumbnail_url: string | null;
      hashtags: string[];
      status_akses: BankContentDetail["status_akses"];
      wilayah_terbatas: string[];
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
    }
  >(`/v1/bank-konten/${contentId}`, {
    method: "GET",
  });

  const wilayahTerbatas = await resolveWilayahNames(response.data.wilayah_terbatas);

  return {
    ...response,
    data: {
      id: response.data.id,
      judul: response.data.judul,
      deskripsi: response.data.deskripsi,
      platform: response.data.platform,
      jenis_konten: response.data.jenis_konten,
      topik: response.data.topik,
      wilayah_id: response.data.wilayah_id,
      regional_asal: response.data.wilayah_asal.nama,
      tahun_kampanye: response.data.tahun_kampanye,
      drive_link: response.data.drive_link,
      jumlah_file: response.data.jumlah_file,
      thumbnail_url: response.data.thumbnail_url,
      hashtags: response.data.hashtags,
      status_akses: response.data.status_akses,
      regional_terbatas: wilayahTerbatas,
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
