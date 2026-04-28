import type { ContentPlatform, PaginatedMeta } from "@/features/content-shared/types/content.type";

export type BlastReferenceStatus = "all" | "unblasted" | "blasted";
export type BlastAssignmentStatus = "pending" | "completed" | "cancelled";
export type BlastSortDirection = "asc" | "desc";
export type BlastFeedScope = "available" | "kept" | "all";

export interface BlastAssignmentUser {
  id: string;
  name: string;
  wilayah: {
    id: string;
    nama: string;
    kode: string;
    level: string;
  } | null;
}

export interface BlastFeedItem {
  id: string;
  platform: ContentPlatform;
  title: string;
  topic: string;
  submission_code: string | null;
  drive_link: string;
  post_url: string;
  caption: string | null;
  submitted_at: string | null;
  deadline_at: string | null;
  submission_delay_days: number | null;
  approval_at: string | null;
  posted_at: string | null;
  blast_count: number;
  blast_status: Exclude<BlastReferenceStatus, "all">;
  kept_at: string | null;
  kept_by: BlastAssignmentUser | null;
  completed_by: BlastAssignmentUser | null;
  first_blasted_at: string | null;
  last_blasted_at: string | null;
  requested_note: string | null;
  social_account: {
    id: string;
    username: string;
    profile_name: string;
  } | null;
  target_wilayah: {
    id: string;
    nama: string;
    kode: string;
    level: string;
  };
  source_wilayah: {
    id: string;
    nama: string;
    kode: string;
    level: string;
  };
}

export interface BlastCandidateItem {
  id: string;
  platform: ContentPlatform;
  post_url: string;
  posted_at: string | null;
  caption: string | null;
  validated_at: string | null;
  social_account: {
    id: string;
    username: string;
    profile_name: string;
  } | null;
  posting_proof: {
    id: string;
    submitted_at: string | null;
    bank_content: {
      id: string;
      title: string;
      drive_link: string;
    };
    pic: {
      id: string;
      name: string;
      wilayah: {
        id: string;
        nama: string;
        kode: string;
        level: string;
      } | null;
    };
  };
}

export interface BlastActivityItem {
  id: string;
  platform: ContentPlatform;
  post_url: string;
  proof_drive_link: string | null;
  caption: string | null;
  posted_at: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
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
  blast_assignment: {
    id: string;
    status: BlastAssignmentStatus;
    blast_count: number;
    kept_at: string | null;
    kept_by: BlastAssignmentUser | null;
    last_blasted_at: string | null;
    target_wilayah: {
      id: string;
      nama: string;
      kode: string;
      level: string;
    };
    content: {
      id: string;
      submission_code: string | null;
      title: string;
      topic: string;
      drive_link: string;
    };
  } | null;
}

export interface BlastActivityStats {
  total_aktivitas: number;
  total_postingan: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_reposts: number;
}

export interface ListBlastActivitiesData {
  stats: BlastActivityStats;
  items: BlastActivityItem[];
}

export interface BlastFeedFilters {
  platform: "all" | ContentPlatform;
  social_account_id: "all" | string;
  status: BlastReferenceStatus;
  scope: BlastFeedScope;
  sort_direction: BlastSortDirection;
  date_from?: string;
  date_to?: string;
  search: string;
  page: number;
  limit: number;
}

export interface BlastCandidateFilters {
  platform: "all" | ContentPlatform;
  social_account_id: "all" | string;
  sort_direction: BlastSortDirection;
  search: string;
  page: number;
  limit: number;
}

export interface BlastActivityFilters {
  platform: "all" | ContentPlatform;
  social_account_id: "all" | string;
  date_from?: string;
  date_to?: string;
  search: string;
  page: number;
  limit: number;
}

export interface CreateBlastActivityPayload {
  blast_assignment_id?: string;
  scraped_post_id?: string;
  social_account_id?: string;
  platform?: ContentPlatform;
  post_url?: string;
  proof_drive_link?: string;
  caption?: string;
  posted_at?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  notes?: string;
}

export interface CreateBlastActivityResult {
  id: string;
  platform: ContentPlatform;
  post_url: string;
  proof_drive_link: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  message: string;
}

export interface KeepBlastAssignmentResult {
  id: string;
  kept_at: string | null;
  kept_by: BlastAssignmentUser | null;
  message: string;
}

export interface DeleteBlastActivityResult {
  id: string;
  blast_assignment_id: string | null;
  returned_to_keep: boolean;
  message: string;
}

export interface DecideBlastPayload {
  posting_proof_link_id: string;
  should_blast: boolean;
  note?: string;
}

export interface CreateManualBlastQueuePayload {
  social_account_id: string;
  post_url: string;
  reference_title?: string;
  caption?: string;
  posted_at?: string;
  note?: string;
}

export interface CreateManualBlastQueueResult {
  id: string;
  status: BlastAssignmentStatus;
  platform: ContentPlatform;
  post_url: string;
  submission_code: string | null;
  reference_title: string;
  social_account: {
    id: string;
    username: string;
    profile_name: string;
    profile_url: string;
  };
  target_wilayah: {
    id: string;
    nama: string;
    kode: string;
    level: string;
  };
  message: string;
}

export interface UpdateBlastActivityMetricsPayload {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
}

export interface UpdateBlastActivityMetricsResult {
  id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  message: string;
}

export type BlastMeta = PaginatedMeta;
