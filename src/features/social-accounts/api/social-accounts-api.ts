import { apiClient } from "@/shared/api/api-client";
import { resolveWilayahId } from "@/shared/api/wilayah";

import type {
  CreateSocialAccountPayload,
  DelegateSocialAccountPayload,
  SocialAccountDetail,
  SocialAccountFilters,
  SocialAccountItem,
  SocialAccountListMeta,
  SocialAccountScrapedPostDetail,
  SocialPicOption,
  UpdateSocialAccountPayload,
  UpsertSocialAccountStatPayload,
  VerifySocialAccountPayload,
} from "../types/social-account.type";

function toSocialAccountQuery(filters: SocialAccountFilters) {
  return {
    officer_id: filters.officer_id,
    platform: filters.platform && filters.platform !== "all" ? filters.platform : undefined,
    verification_status:
      filters.verification_status && filters.verification_status !== "all" ? filters.verification_status : undefined,
    delegation_status:
      filters.delegation_status && filters.delegation_status !== "all" ? filters.delegation_status : undefined,
    search: filters.search?.trim() || undefined,
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
  };
}

export async function listSocialAccounts(filters: SocialAccountFilters, signal?: AbortSignal) {
  const response = await apiClient<
    Array<{
      id: string;
      wilayah_id: string;
      wilayah: {
        id: string;
        nama: string;
      };
      officer_id: string | null;
      officer_name: string | null;
      officer_wilayah_id: string | null;
      officer_wilayah: {
        id: string;
        nama: string;
      } | null;
      added_by: {
        id: string;
        name: string;
        wilayah_id: string | null;
        wilayah?: {
          id: string;
          nama: string;
        } | null;
      };
      delegated_by: {
        id: string;
        name: string;
      } | null;
      delegated_at: string | null;
      delegation_status: SocialAccountItem["delegation_status"];
      verified_by: {
        id: string;
        name: string;
      } | null;
      username: string;
      platform: SocialAccountItem["platform"];
      profile_url: string;
      nama_profil: string;
      tipe_akun: SocialAccountItem["tipe_akun"];
      eselon_1: SocialAccountItem["eselon_1"];
      eselon_2: SocialAccountItem["eselon_2"];
      followers: number;
      post_count: number | null;
      following_count: number | null;
      description: string | null;
      is_verified: boolean;
      verification_status: SocialAccountItem["verification_status"];
      verification_note: string | null;
      screenshot_url: string | null;
      last_stat_update: string | null;
      created_at: string;
    }>,
    SocialAccountListMeta
  >("/v1/akun-sosmed", {
    signal,
    params: toSocialAccountQuery(filters),
  });

  return {
    ...response,
    data: response.data.map((item) => ({
      id: item.id,
      wilayah_id: item.wilayah_id,
      wilayah_name: item.wilayah.nama,
      officer_id: item.officer_id,
      officer_name: item.officer_name,
      officer_regional: item.officer_wilayah?.nama ?? null,
      added_by: {
        id: item.added_by.id,
        name: item.added_by.name,
        wilayah_id: item.added_by.wilayah_id,
        regional: item.added_by.wilayah?.nama ?? null,
      },
      delegated_by: item.delegated_by,
      delegated_at: item.delegated_at,
      delegation_status: item.delegation_status,
      verified_by: item.verified_by,
      username: item.username,
      platform: item.platform,
      profile_url: item.profile_url,
      nama_profil: item.nama_profil,
      tipe_akun: item.tipe_akun,
      eselon_1: item.eselon_1,
      eselon_2: item.eselon_2,
      followers: item.followers,
      post_count: item.post_count,
      following_count: item.following_count,
      description: item.description,
      is_verified: item.is_verified,
      verification_status: item.verification_status,
      verification_note: item.verification_note,
      screenshot_url: item.screenshot_url,
      last_stat_update: item.last_stat_update,
      created_at: item.created_at,
    })),
  };
}

export async function getSocialAccountDetail(id: string, params?: { month?: number; year?: number }) {
  const response = await apiClient<SocialAccountDetail>(`/v1/akun-sosmed/${id}`, {
    params: {
      month: params?.month,
      year: params?.year,
    },
  });
  return response;
}

export async function getSocialAccountScrapedPostDetail(id: string, postId: string) {
  return apiClient<SocialAccountScrapedPostDetail>(`/v1/akun-sosmed/${id}/postingan/${postId}`);
}

export async function createSocialAccount(payload: CreateSocialAccountPayload) {
  const wilayahId = await resolveWilayahId(payload.wilayah);

  return apiClient<{ id: string; message: string; verification_status: string; delegation_status: string }>(
    "/v1/akun-sosmed",
    {
      method: "POST",
      body: {
        wilayah_id: wilayahId ?? "",
        platform: payload.platform,
        username: payload.username.trim(),
        profile_url: payload.profile_url.trim(),
        nama_profil: payload.nama_profil.trim(),
        tipe_akun: payload.tipe_akun,
        eselon_1: payload.eselon_1,
        eselon_2: payload.eselon_2,
        followers: payload.followers,
        deskripsi: payload.deskripsi?.trim() || undefined,
      },
    },
  );
}

export async function updateSocialAccount(id: string, payload: UpdateSocialAccountPayload) {
  const wilayahId = await resolveWilayahId(payload.wilayah);

  return apiClient<{ id: string; username: string; nama_profil: string; updated_at: string }>(`/v1/akun-sosmed/${id}`, {
    method: "PATCH",
    body: {
      wilayah_id: wilayahId ?? "",
      platform: payload.platform,
      username: payload.username.trim(),
      profile_url: payload.profile_url.trim(),
      nama_profil: payload.nama_profil.trim(),
      tipe_akun: payload.tipe_akun,
      eselon_1: payload.eselon_1,
      eselon_2: payload.eselon_2,
      followers: payload.followers,
      deskripsi: payload.deskripsi?.trim() || undefined,
    },
  });
}

export async function deleteSocialAccount(id: string) {
  return apiClient<{ id: string; deleted_at: string; message: string }>(`/v1/akun-sosmed/${id}`, {
    method: "DELETE",
  });
}

export async function verifySocialAccount(id: string, payload: VerifySocialAccountPayload) {
  return apiClient<{ id: string; verification_status: string }>(`/v1/akun-sosmed/${id}/verification`, {
    method: "PATCH",
    body: payload,
  });
}

export async function delegateSocialAccount(id: string, payload: DelegateSocialAccountPayload) {
  return apiClient<{ id: string; message: string; delegation_status: string }>(`/v1/akun-sosmed/${id}/delegation`, {
    method: "PATCH",
    body: payload,
  });
}

export async function upsertSocialAccountWeeklyStat(id: string, payload: UpsertSocialAccountStatPayload) {
  return apiClient<{ id: string; akun_id: string }>(`/v1/akun-sosmed/${id}/statistics`, {
    method: "POST",
    body: payload,
  });
}

export async function listSocialPicOptions() {
  const response = await apiClient<
    {
      users: Array<{
        id: string;
        name: string;
        wilayah_id: string | null;
        wilayah: {
          id: string;
          nama: string;
        } | null;
      }>;
    },
    { page: number; limit: number; total: number }
  >("/v1/users", {
    params: {
      role: "pic_sosmed",
      status: "aktif",
      page: 1,
      limit: 100,
    },
  });

  return response.data.users.map(
    (user): SocialPicOption => ({
      id: user.id,
      name: user.name,
      wilayah_id: user.wilayah_id,
      regional: user.wilayah?.nama ?? null,
    }),
  );
}
