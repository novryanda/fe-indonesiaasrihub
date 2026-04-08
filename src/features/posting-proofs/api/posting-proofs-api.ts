import { apiClient } from "@/shared/api/api-client";

import type {
  PostingProofDetail,
  PostingProofFilters,
  PostingProofItem,
  PostingProofListMeta,
  SubmitPostingLinksPayload,
  UpdatePostingStatsPayloadItem,
  ValidatePostingLinkPayloadItem,
} from "../types/posting-proof.type";

export async function submitPostingLinksFromBankContent(bankContentId: string, payload: SubmitPostingLinksPayload) {
  return apiClient<{ id: string; message: string }>(`/v1/bukti-posting/bank-konten/${bankContentId}/links`, {
    method: "POST",
    body: payload,
  });
}

export async function listPostingProofs(filters: PostingProofFilters) {
  const response = await apiClient<
    Array<{
      id: string;
      bank_content_id: string;
      bank_content_judul: string;
      bank_content_drive_link: string;
      evidence_drive_link: string | null;
      submitted_at: string | null;
      pic: {
        id: string;
        name: string;
        wilayah_id: string | null;
        wilayah: {
          id: string;
          nama: string;
        } | null;
      };
      platform_targets: PostingProofItem["platform_targets"];
      status: PostingProofItem["status"];
      links: PostingProofItem["links"];
      peringatan_count: number;
      created_at: string;
      updated_at: string;
    }>,
    PostingProofListMeta
  >("/v1/bukti-posting", {
    params: {
      status: filters.status && filters.status !== "all" ? filters.status : undefined,
      platform: filters.platform && filters.platform !== "all" ? filters.platform : undefined,
      wilayah_id: filters.wilayah_id,
      search: filters.search,
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
    },
  });

  return {
    ...response,
    data: response.data.map((item) => ({
      id: item.id,
      bank_content_id: item.bank_content_id,
      bank_content_judul: item.bank_content_judul,
      bank_content_drive_link: item.bank_content_drive_link,
      evidence_drive_link: item.evidence_drive_link,
      submitted_at: item.submitted_at,
      pic: {
        id: item.pic.id,
        name: item.pic.name,
        wilayah_id: item.pic.wilayah_id,
        regional: item.pic.wilayah?.nama ?? null,
      },
      platform_targets: item.platform_targets,
      status: item.status,
      links: item.links,
      peringatan_count: item.peringatan_count,
      created_at: item.created_at,
      updated_at: item.updated_at,
    })),
  };
}

export async function validatePostingLinks(proofId: string, validasi: ValidatePostingLinkPayloadItem[]) {
  return apiClient<{ id: string; message: string }>(`/v1/bukti-posting/${proofId}/validations`, {
    method: "POST",
    body: { validasi },
  });
}

export async function getPostingProofDetail(proofId: string) {
  const response = await apiClient<
    Omit<PostingProofDetail, "pic"> & {
      pic: {
        id: string;
        name: string;
        wilayah_id: string | null;
        wilayah: {
          id: string;
          nama: string;
        } | null;
      };
    }
  >(`/v1/bukti-posting/${proofId}`, {
    method: "GET",
  });

  return {
    ...response,
    data: {
      ...response.data,
      pic: {
        id: response.data.pic.id,
        name: response.data.pic.name,
        wilayah_id: response.data.pic.wilayah_id,
        regional: response.data.pic.wilayah?.nama ?? null,
      },
    },
  };
}

export async function updatePostingStats(proofId: string, links: UpdatePostingStatsPayloadItem[]) {
  return apiClient<{ id: string; message: string }>(`/v1/bukti-posting/${proofId}/stats`, {
    method: "PATCH",
    body: { links },
  });
}
