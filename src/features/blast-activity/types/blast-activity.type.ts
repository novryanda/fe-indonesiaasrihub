import type { ContentPlatform, PaginatedMeta } from "@/features/content-shared/types/content.type";

export type BlastReferenceStatus = "all" | "unblasted" | "blasted";

export interface BlastFeedItem {
  id: string;
  external_post_id: string;
  platform: ContentPlatform;
  post_url: string;
  caption: string | null;
  posted_at: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  blast_count: number;
  blast_status: Exclude<BlastReferenceStatus, "all">;
  account: {
    id: string;
    username: string;
    profile_name: string;
    wilayah: {
      id: string;
      nama: string;
      kode: string;
      level: string;
    } | null;
    officer: {
      id: string;
      name: string;
    } | null;
  };
}

export interface BlastActivityItem {
  id: string;
  platform: ContentPlatform;
  post_url: string;
  caption: string | null;
  posted_at: string | null;
  views: number;
  likes: number;
  comments: number;
  notes: string | null;
  created_at: string;
  blast_user: {
    id: string;
    name: string;
    wilayah: {
      id: string;
      nama: string;
      kode: string;
      level: string;
    } | null;
  };
  social_account: {
    id: string;
    username: string;
    profile_name: string;
  } | null;
  scraped_post: {
    id: string;
    external_post_id: string;
  } | null;
}

export interface BlastActivityStats {
  total_aktivitas: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
}

export interface ListBlastActivitiesData {
  stats: BlastActivityStats;
  items: BlastActivityItem[];
}

export interface BlastFeedFilters {
  platform: "all" | ContentPlatform;
  status: BlastReferenceStatus;
  search: string;
  page: number;
  limit: number;
}

export interface BlastActivityFilters {
  platform: "all" | ContentPlatform;
  date_from?: string;
  date_to?: string;
  search: string;
  page: number;
  limit: number;
}

export interface CreateBlastActivityPayload {
  scraped_post_id?: string;
  social_account_id?: string;
  platform?: ContentPlatform;
  post_url?: string;
  caption?: string;
  posted_at?: string;
  views: number;
  likes: number;
  comments: number;
  notes?: string;
}

export interface CreateBlastActivityResult {
  id: string;
  platform: ContentPlatform;
  post_url: string;
  views: number;
  likes: number;
  comments: number;
  message: string;
}

export type BlastMeta = PaginatedMeta;
