import { apiClient } from "@/shared/api/api-client";

import type { BankContentFilters, BankContentMeta, ListBankContentData } from "../types/content-library.type";

function mapLegacyAccessStatus(
  scope: ListBankContentData["items"][number]["visibility_scope"],
): ListBankContentData["items"][number]["status_akses"] {
  return scope === "targeted_regions" ? "terbatas" : "publik";
}

export async function getBankContent(filters: BankContentFilters, _accessToken?: string) {
  const response = await apiClient<
    {
      stats: ListBankContentData["stats"];
      items: Array<{
        id: string;
        submission_code: string | null;
        judul: string;
        platform: ListBankContentData["items"][number]["platform"];
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
        visibility_scope: ListBankContentData["items"][number]["visibility_scope"];
        visibility_targets: ListBankContentData["items"][number]["visibility_targets"];
        assignment_scope: ListBankContentData["items"][number]["assignment_scope"];
        assignment_targets: ListBankContentData["items"][number]["assignment_targets"];
        task_summary: ListBankContentData["items"][number]["task_summary"];
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
      wilayah_id: filters.wilayah_id === "all" ? undefined : filters.wilayah_id,
      date_from: filters.date_from?.trim() || undefined,
      date_to: filters.date_to?.trim() || undefined,
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
        submission_code: item.submission_code,
        judul: item.judul,
        platform: item.platform,
        wilayah_id: item.source_wilayah_id,
        source_wilayah_id: item.source_wilayah_id,
        topik: item.topik,
        regional_asal: item.source_wilayah.nama,
        tahun_kampanye: item.tahun_kampanye,
        drive_link: item.drive_link,
        hashtags: item.hashtags,
        status_akses: mapLegacyAccessStatus(item.visibility_scope),
        visibility_scope: item.visibility_scope,
        visibility_targets: item.visibility_targets,
        assignment_scope: item.assignment_scope,
        assignment_targets: item.assignment_targets,
        task_summary: item.task_summary,
        uploaded_by: item.uploaded_by,
        created_at: item.created_at,
      })),
    },
  };
}
