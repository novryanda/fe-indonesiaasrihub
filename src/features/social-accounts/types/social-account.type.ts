import type { ContentPlatform } from "@/features/content-shared/types/content.type";

export type SocialAccountVerificationStatus = "verified" | "pending" | "rejected";
export type SocialAccountDelegationStatus = "belum_didelegasikan" | "sudah_didelegasikan" | "delegasi_dicabut";
export type SocialAccountType = "personal" | "bisnis" | "government";
export type SocialPostPicStatus = "belum_disubmit" | "menunggu" | "valid" | "ditolak";

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

export interface SocialAccountRegionRef {
  id: string;
  nama: string;
  kode: string;
  level?: string;
}

export interface SocialPostPicMarker {
  status: SocialPostPicStatus;
  posting_proof_link_id: string | null;
  post_url: string | null;
  posted_at: string | null;
  pic: {
    id: string;
    name: string;
  } | null;
  bank_content: {
    id: string;
    title: string;
  } | null;
}

export interface SocialScrapedMedia {
  id: string;
  media_type: string;
  order_index: number;
  external_media_id?: string | null;
  external_short_code?: string | null;
  display_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  source_url?: string | null;
  alt: string | null;
  type: string | null;
  dimensions_height?: number | null;
  dimensions_width?: number | null;
  likes_count?: number | null;
  timestamp?: string | null;
}

export interface SocialScrapedCommentSummary {
  id: string;
  text: string | null;
  owner_username: string | null;
  owner_profile_pic_url: string | null;
  owner_is_verified: boolean;
  timestamp: string | null;
  replies_count: number;
  likes_count: number | null;
}

export interface SocialScrapedCommentDetail extends SocialScrapedCommentSummary {
  external_comment_id: string;
  owner_id: string | null;
  replies: Array<{
    id: string;
    external_reply_id: string;
    text: string | null;
    owner_username: string | null;
    owner_profile_pic_url: string | null;
    owner_id: string | null;
    owner_is_verified: boolean;
    timestamp: string | null;
    replies_count: number;
    likes_count: number | null;
  }>;
}

export interface SocialScrapedPostSummary {
  id: string;
  external_post_id: string;
  type: string;
  short_code: string | null;
  url: string;
  caption: string | null;
  hashtags: string[];
  mentions: string[];
  timestamp: string | null;
  likes_count: number | null;
  comments_count: number | null;
  video_view_count: number | null;
  video_play_count: number | null;
  reposts: number | null;
  share_posts: number | null;
  display_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  alt: string | null;
  owner_full_name: string | null;
  owner_username: string | null;
  product_type: string | null;
  media: SocialScrapedMedia[];
  latest_comments: SocialScrapedCommentSummary[];
  pic_marker: SocialPostPicMarker;
}

export interface SocialAccountDetail {
  selected_period: {
    month: number;
    year: number;
    label: string;
  };
  id: string;
  wilayah: SocialAccountRegionRef | null;
  officer: {
    id: string;
    name: string;
    wilayah: SocialAccountRegionRef | null;
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
  scrape_overview: {
    latest_snapshot_id: string;
    latest_scraped_at: string;
    source: "apify";
    apify_run_id: string | null;
    dataset_id: string | null;
    observed_posts_count: number;
    observed_comments_count: number;
    observed_replies_count: number;
    summary: unknown;
  } | null;
  weekly_stats: Array<{
    week_date: string;
    followers: number;
    posting_count: number;
    total_reach: number;
    recorded_at: string;
  }>;
  content_mix: Array<{
    type: string;
    count: number;
  }>;
  latest_comments_summary: Array<{
    id: string;
    external_comment_id: string;
    text: string | null;
    owner_username: string | null;
    owner_profile_pic_url: string | null;
    owner_is_verified: boolean;
    timestamp: string | null;
    likes_count: number | null;
    replies_count: number;
    post: {
      id: string;
      external_post_id: string;
      short_code: string | null;
      url: string;
      caption: string | null;
    };
  }>;
  pic_activity_summary: {
    submitted_count: number;
    valid_count: number;
    waiting_count: number;
    rejected_count: number;
  };
  scraped_posts: SocialScrapedPostSummary[];
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

export interface SocialAccountScrapedPostDetail {
  id: string;
  social_account_id: string;
  external_post_id: string;
  type: string;
  short_code: string | null;
  url: string;
  caption: string | null;
  hashtags: string[];
  mentions: string[];
  first_comment: string | null;
  timestamp: string | null;
  likes_count: number | null;
  comments_count: number | null;
  video_view_count: number | null;
  video_play_count: number | null;
  reposts: number | null;
  share_posts: number | null;
  display_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  alt: string | null;
  owner_full_name: string | null;
  owner_username: string | null;
  owner_id: string | null;
  product_type: string | null;
  is_comments_disabled: boolean;
  input_url: string | null;
  video_duration: number | null;
  latest_snapshot: {
    id: string;
    scrapedAt: string;
    apifyRunId: string | null;
    datasetId: string | null;
  } | null;
  pic_marker: SocialPostPicMarker;
  media: SocialScrapedMedia[];
  comments: SocialScrapedCommentDetail[];
}
