export type MonitoringPlatform = "instagram" | "tiktok" | "youtube" | "facebook" | "x";

export interface MonitoringTugasScope {
  mode: "nasional" | "regional";
  wilayah_id: string | null;
  wilayah_nama: string;
  wilayah_kode: string;
}

export interface MonitoringTugasFilters {
  wilayah_id: string | null;
  platform: MonitoringPlatform | null;
  eselon_2: string | null;
  start_date: string;
  end_date: string;
}

export interface MonitoringTugasStats {
  total_akun_aktif: number;
  total_posting_bulan_ini: number;
  posting_mom_delta_percent: number;
  posting_bulan_lalu: number;
  total_views: number;
  avg_views_per_posting: number;
  total_comments: number;
  avg_comments_per_posting: number;
  avg_engagement_rate: number;
  akun_posting_aktif: number;
  target_posting_terpenuhi: number;
}

export interface MonitoringTopAccountItem {
  id: string;
  platform: MonitoringPlatform;
  username: string;
  profile_name: string;
  followers: number;
  verification_status: "verified" | "pending" | "rejected";
  total_views: number;
  total_comments: number;
  total_reposts: number;
  posting_count: number;
  engagement_rate: number;
  last_stat_update: string | null;
  wilayah: {
    id: string;
    nama: string;
    kode: string;
  } | null;
}

export interface MonitoringTopPostItem {
  id: string;
  detail_post_id?: string | null;
  social_account_id: string | null;
  platform: MonitoringPlatform;
  username: string;
  profile_name: string;
  wilayah: {
    id: string;
    nama: string;
    kode: string;
  } | null;
  type: string;
  short_code: string | null;
  url: string;
  caption: string | null;
  timestamp: string | null;
  total_views: number;
  total_likes: number;
  total_comments: number;
  pic_status: "belum_disubmit" | "menunggu" | "valid" | "ditolak";
}

export interface MonitoringTopCommentItem {
  id: string;
  text: string;
  owner_username: string | null;
  owner_is_verified: boolean;
  timestamp: string | null;
  likes_count: number;
  replies_count: number;
  post: {
    id: string;
    social_account_id: string;
    url: string;
    short_code: string | null;
    caption: string | null;
    platform: MonitoringPlatform;
    account_username: string;
    account_profile_name: string;
  };
}

export interface MonitoringDailyPlatformMetric {
  platform: MonitoringPlatform;
  views: number;
  likes: number;
  comments: number;
  reposts: number;
  engagement_rate: number;
}

export interface MonitoringDailyPlatformAreaItem {
  period_date: string;
  period_label: string;
  platform_metrics: MonitoringDailyPlatformMetric[];
}

export interface MonitoringPlatformAverageBarItem {
  platform: MonitoringPlatform;
  avg_likes_per_post: number;
  avg_comments_per_post: number;
  total_posting: number;
}

export interface MonitoringPlatformContentRadarItem {
  platform: MonitoringPlatform;
  views: number;
  likes: number;
  comments: number;
}

export interface MonitoringEngagementOverview {
  avg_engagement_score: number;
}

export interface MonitoringEngagementScoreTrendItem {
  period_date: string;
  period_label: string;
  engagement_score: number;
}

export interface MonitoringEngagementDetailItem {
  period_date: string;
  period_label: string;
  likes: number;
  views: number;
  comments: number;
}

export interface MonitoringTugasData {
  scope: MonitoringTugasScope;
  filters: MonitoringTugasFilters;
  stats: MonitoringTugasStats;
  selected_period: {
    month: number;
    year: number;
    start_date: string;
    end_date: string;
    label: string;
  };
  latest_scraped_at: string | null;
  engagement_overview: MonitoringEngagementOverview;
  engagement_score_trends: MonitoringEngagementScoreTrendItem[];
  engagement_details: MonitoringEngagementDetailItem[];
  daily_platform_area: MonitoringDailyPlatformAreaItem[];
  platform_average_bar: MonitoringPlatformAverageBarItem[];
  platform_content_radar: MonitoringPlatformContentRadarItem[];
  top_posts: MonitoringTopPostItem[];
  top_accounts: MonitoringTopAccountItem[];
  top_comments: MonitoringTopCommentItem[];
}
