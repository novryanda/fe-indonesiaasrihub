import { apiClient } from "@/shared/api/api-client";

import type { BankContentFilters, BankContentMeta, ListBankContentData } from "../types/content-library.type";

export async function getBankContent(filters: BankContentFilters, _accessToken?: string) {
  const response = await apiClient<
    {
      stats: ListBankContentData["stats"];
      items: Array<{
        id: string;
        judul: string;
        platform: ListBankContentData["items"][number]["platform"];
        topik: string;
        wilayah_id: string;
        wilayah_asal: {
          id: string;
          nama: string;
        };
        tahun_kampanye: number;
        drive_link: string;
        thumbnail_url: string | null;
        hashtags: string[];
        status_akses: ListBankContentData["items"][number]["status_akses"];
        uploaded_by: string;
        created_at: string;
      }>;
    },
    BankContentMeta
  >("/v1/bank-konten", {
    method: "GET",
    params: {
      platform: filters.platform === "all" ? undefined : filters.platform,
      topik: filters.topik === "all" ? undefined : filters.topik,
      search: filters.search.trim() || undefined,
      page: filters.page,
      limit: filters.limit,
    },
  });

  return {
    ...response,
    data: {
      stats: response.data.stats,
      items: response.data.items.map((item) => ({
        id: item.id,
        judul: item.judul,
        platform: item.platform,
        wilayah_id: item.wilayah_id,
        topik: item.topik,
        regional_asal: item.wilayah_asal.nama,
        tahun_kampanye: item.tahun_kampanye,
        drive_link: item.drive_link,
        thumbnail_url: item.thumbnail_url,
        hashtags: item.hashtags,
        status_akses: item.status_akses,
        uploaded_by: item.uploaded_by,
        created_at: item.created_at,
      })),
    },
  };
}
