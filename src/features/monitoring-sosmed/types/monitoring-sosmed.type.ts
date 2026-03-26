export interface MonitoringSosmedScope {
  mode: "nasional" | "regional";
  wilayah_id: string | null;
  wilayah_nama: string;
  wilayah_kode: string;
}

export interface MonitoringSosmedStats {
  total_akun_terdaftar: number;
  terverifikasi: number;
  total_followers: number;
  total_postingan: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_reposts: number;
  total_share_posts: number;
  delegated_active: number;
}

export interface MonitoringPlatformDistributionItem {
  platform: "instagram" | "tiktok" | "youtube" | "facebook" | "x";
  akun_count: number;
  total_followers: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_reposts: number;
  total_share_posts: number;
  total_posting: number;
  growth_percent: number;
  trend: "up" | "down";
  kapasitas_terisi_percent: number;
}

export interface MonitoringWeeklyTrendItem {
  period_date: string;
  period_label: string;
  views: number;
  likes: number;
  comments: number;
  reposts: number;
  share_posts: number;
  post_count: number;
}

export interface MonitoringRadarPlatformItem {
  platform: "instagram" | "tiktok" | "youtube" | "facebook" | "x";
  audience_score: number;
  reach_score: number;
  posting_score: number;
  coverage_score: number;
}

export interface MonitoringRadialHealthItem {
  key: "views" | "engagement" | "validated";
  label: string;
  value: number;
  fill: string;
}

export interface MonitoringTopAccountItem {
  id: string;
  platform: "instagram" | "tiktok" | "youtube" | "facebook" | "x";
  username: string;
  profile_name: string;
  followers: number;
  verification_status: "verified" | "pending" | "rejected";
  delegated: boolean;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_reposts: number;
  total_share_posts: number;
  posting_count: number;
  growth_percent: number;
  last_stat_update: string | null;
  wilayah: {
    id: string;
    nama: string;
    kode: string;
  } | null;
}

export interface MonitoringSosmedData {
  scope: MonitoringSosmedScope;
  stats: MonitoringSosmedStats;
  selected_period: {
    month: number;
    year: number;
    label: string;
  };
  distribusi_platform: MonitoringPlatformDistributionItem[];
  tren_performa: MonitoringWeeklyTrendItem[];
  radar_platform_performance: MonitoringRadarPlatformItem[];
  radial_health: MonitoringRadialHealthItem[];
  top_accounts: MonitoringTopAccountItem[];
}
