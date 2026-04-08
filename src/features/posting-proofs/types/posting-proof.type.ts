import type { ContentPlatform } from "@/features/content-shared/types/content.type";

export type PostingProofStatus = "menunggu_bukti_posting" | "bukti_dikirim" | "bukti_valid" | "bukti_ditolak";
export type PostingProofValidationAction = "valid" | "tidak_valid" | "tidak_sesuai";

export interface PostingProofSocialAccountRef {
  id: string;
  username: string;
  nama_profil: string;
}

export interface PostingProofLinkItem {
  id: string;
  platform: ContentPlatform;
  social_account: PostingProofSocialAccountRef | null;
  post_url: string;
  posted_at: string;
  validation_status: "menunggu" | "valid" | "ditolak";
  validated_by: string | null;
  validated_at: string | null;
  rejection_note?: string | null;
  rejection_type?: string | null;
  catatan_officer?: string | null;
  attempt_count?: number;
  stats?: {
    views: number | null;
    likes: number | null;
    comments: number | null;
    reposts: number | null;
    share_posts: number | null;
    auto_updated_at?: string | null;
  };
}

export interface PostingProofItem {
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
    regional: string | null;
  };
  platform_targets: ContentPlatform[];
  status: PostingProofStatus;
  links: PostingProofLinkItem[];
  peringatan_count: number;
  created_at: string;
  updated_at: string;
}

export interface PostingProofDetail extends PostingProofItem {
  riwayat_validasi: Array<{
    action: string;
    actor_name: string;
    platform: ContentPlatform | null;
    post_url: string | null;
    note: string;
    timestamp: string;
  }>;
}

export interface PostingProofListMeta {
  page: number;
  limit: number;
  total: number;
}

export interface PostingProofFilters {
  status?: PostingProofStatus | "all";
  platform?: ContentPlatform | "all";
  wilayah_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SubmitPostingLinkPayloadItem {
  platform: ContentPlatform;
  social_account_id: string;
  post_url: string;
  posted_at: string;
  catatan_officer?: string;
}

export interface SubmitPostingLinksPayload {
  evidence_drive_link?: string;
  links: SubmitPostingLinkPayloadItem[];
}

export interface ValidatePostingLinkPayloadItem {
  link_id: string;
  action: PostingProofValidationAction;
  rejection_type?: string;
  note?: string;
}

export interface UpdatePostingStatsPayloadItem {
  link_id: string;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  reposts?: number | null;
  share_posts?: number | null;
}
