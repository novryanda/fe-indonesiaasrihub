import type { ContentPlatform } from "@/features/content-shared/types/content.type";

export type SocialAccountVerificationStatus = "verified" | "pending" | "rejected";
export type SocialAccountDelegationStatus = "belum_didelegasikan" | "sudah_didelegasikan" | "delegasi_dicabut";
export type SocialAccountType = "personal" | "bisnis" | "government";

export interface SocialAccountUserRef {
  id: string;
  name: string;
  wilayah_id?: string | null;
  regional?: string | null;
}

export interface SocialAccountItem {
  wilayah_id: string;
  wilayah_name: string;
  id: string;
  officer_id: string | null;
  officer_name: string | null;
  officer_regional: string | null;
  added_by: SocialAccountUserRef;
  delegated_by: Omit<SocialAccountUserRef, "regional"> | null;
  delegated_at: string | null;
  delegation_status: SocialAccountDelegationStatus;
  verified_by: Omit<SocialAccountUserRef, "regional"> | null;
  username: string;
  platform: ContentPlatform;
  profile_url: string;
  nama_profil: string;
  tipe_akun: SocialAccountType;
  followers: number;
  description?: string | null;
  is_verified: boolean;
  verification_status: SocialAccountVerificationStatus;
  verification_note: string | null;
  screenshot_url: string | null;
  last_stat_update: string | null;
  created_at: string;
}

export interface SocialAccountListMeta {
  page: number;
  limit: number;
  total: number;
}

export interface SocialAccountFilters {
  officer_id?: string;
  platform?: ContentPlatform | "all";
  verification_status?: SocialAccountVerificationStatus | "all";
  delegation_status?: SocialAccountDelegationStatus | "all";
  page?: number;
  limit?: number;
}

export interface CreateSocialAccountPayload {
  wilayah: string;
  platform: ContentPlatform;
  username: string;
  profile_url: string;
  nama_profil: string;
  tipe_akun: SocialAccountType;
  followers: number;
  deskripsi?: string;
  screenshot: File;
}

export interface UpdateSocialAccountPayload {
  wilayah: string;
  platform: ContentPlatform;
  username: string;
  profile_url: string;
  nama_profil: string;
  tipe_akun: SocialAccountType;
  followers: number;
  deskripsi?: string;
}

export interface VerifySocialAccountPayload {
  action: "verified" | "rejected";
  note?: string;
}

export interface DelegateSocialAccountPayload {
  action: "delegate" | "revoke";
  officer_id?: string;
}

export interface UpsertSocialAccountStatPayload {
  week_date: string;
  followers: number;
  posting_count: number;
  total_reach: number;
}

export interface SocialPicOption {
  id: string;
  name: string;
  wilayah_id?: string | null;
  regional: string | null;
}

export interface SocialAccountDetail {
  selected_period: {
    month: number;
    year: number;
    label: string;
  };
  id: string;
  wilayah: {
    id: string;
    nama: string;
    kode: string;
    level: string;
  } | null;
  officer: {
    id: string;
    name: string;
    wilayah: {
      id: string;
      nama: string;
      kode: string;
      level: string;
    } | null;
  } | null;
  added_by: {
    id: string;
    name: string;
  };
  delegated_by: {
    id: string;
    name: string;
  } | null;
  verified_by: {
    id: string;
    name: string;
  } | null;
  delegated_at: string | null;
  verification_status: SocialAccountVerificationStatus;
  delegation_status: SocialAccountDelegationStatus;
  username: string;
  platform: ContentPlatform;
  profile_url: string;
  nama_profil: string;
  tipe_akun: SocialAccountType;
  followers: number;
  description: string | null;
  screenshot_url: string | null;
  is_verified: boolean;
  verification_note: string | null;
  last_stat_update: string | null;
  created_at: string;
  metrics: {
    latest_followers: number;
    total_posting: number;
    total_views: number;
    total_likes: number;
    total_comments: number;
    total_reposts: number;
    total_share_posts: number;
    engagement_rate: number;
  };
  posting_links: Array<{
    id: string;
    platform: ContentPlatform;
    post_url: string;
    posted_at: string;
    views: number | null;
    likes: number | null;
    comments: number | null;
    reposts: number | null;
    share_posts: number | null;
    validation_status: "menunggu" | "valid" | "ditolak";
    pic: {
      id: string;
      name: string;
    };
    bank_content: {
      id: string;
      title: string;
    };
  }>;
}
