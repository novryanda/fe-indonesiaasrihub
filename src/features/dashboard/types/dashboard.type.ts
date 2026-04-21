export type DashboardPlatform = "instagram" | "tiktok" | "youtube" | "facebook" | "x";

export interface DashboardScope {
  mode?: "nasional" | "regional";
  wilayah_id: string | null;
  wilayah_nama: string;
  wilayah_kode: string;
}

export interface DashboardSelectedPeriod {
  month: number;
  year: number;
  label: string;
}

export interface DashboardTrendItem {
  period_date: string;
  period_label: string;
  valid_post_count: number;
  total_views: number;
  total_interactions: number;
}

export interface DashboardPlatformDistributionItem {
  platform: DashboardPlatform;
  post_count: number;
  total_views: number;
  total_interactions: number;
  account_count: number;
}

export interface DashboardTopAccountItem {
  id: string;
  platform: DashboardPlatform;
  username: string;
  profile_name: string;
  followers: number;
  verification_status: string;
  delegated: boolean;
  total_views: number;
  total_interactions: number;
  valid_post_count: number;
  last_stat_update: string | null;
  wilayah: {
    id: string;
    nama: string;
    kode: string;
  } | null;
}

export interface DashboardDailyPostingActivityItem {
  id: string;
  posted_at: string;
  platform: DashboardPlatform;
  post_url: string;
  validation_status: "menunggu" | "valid" | "ditolak";
  total_views: number;
  total_interactions: number;
  bank_content: {
    id: string;
    title: string;
  };
  pic: {
    id: string;
    name: string;
    email: string;
    wilayah: {
      id: string;
      nama: string;
      kode: string;
    } | null;
  };
  social_account: {
    id: string;
    platform: DashboardPlatform;
    username: string;
    profile_name: string;
    wilayah: {
      id: string;
      nama: string;
      kode: string;
    } | null;
  } | null;
}

export interface DashboardMonthlySocialAccountPostingSummaryItem {
  account_id: string;
  platform: DashboardPlatform;
  username: string;
  profile_name: string;
  account_wilayah: {
    id: string;
    nama: string;
    kode: string;
  } | null;
  total_posting: number;
  valid_posting: number;
  total_views: number;
  total_interactions: number;
  last_activity: string | null;
}

export interface DashboardMapRegionItem {
  region_id: string;
  wilayah_id: string | null;
  wilayah_kode: string;
  wilayah_nama: string;
  account_count: number;
  pic_count: number;
  valid_post_count: number;
  total_views: number;
  choropleth_bucket: number;
}

export interface NationalDashboardData {
  scope: DashboardScope;
  selected_period: DashboardSelectedPeriod;
  daily_posting_filter: {
    date_from: string;
    date_to: string;
    label: string;
  };
  stats: {
    total_user_aktif: number;
    total_pic_terdaftar: number;
    total_akun_sosmed: number;
    total_posting_valid: number;
    total_bank_konten_bulan_ini: number;
    bukti_menunggu_validasi: number;
    bank_konten_menunggu_validasi: number;
    total_tayangan: number;
    total_interaksi: number;
    avg_engagement_rate: number;
  };
  map_regions: DashboardMapRegionItem[];
  trend: DashboardTrendItem[];
  platform_distribution: DashboardPlatformDistributionItem[];
  top_regions: DashboardMapRegionItem[];
  top_accounts: DashboardTopAccountItem[];
  daily_posting_activities: DashboardDailyPostingActivityItem[];
  monthly_social_account_posting_summary: DashboardMonthlySocialAccountPostingSummaryItem[];
}

export interface RegionalDashboardData {
  scope: DashboardScope;
  selected_period: DashboardSelectedPeriod;
  stats: {
    total_wcc_wilayah: number;
    total_pic_wilayah: number;
    total_akun_sosmed: number;
    total_posting_valid: number;
    total_bank_konten_bulan_ini: number;
    bukti_menunggu_validasi: number;
    bank_konten_menunggu_validasi: number;
    overdue_bank_content_pic: number;
  };
  trend: DashboardTrendItem[];
  platform_distribution: DashboardPlatformDistributionItem[];
  top_pics: Array<{
    id: string;
    name: string;
    email: string;
    wilayah: {
      id: string;
      nama: string;
      kode: string;
    } | null;
    valid_post_count: number;
    total_views: number;
    total_interactions: number;
    overdue_bank_content_count: number;
    last_activity: string | null;
  }>;
  top_accounts: DashboardTopAccountItem[];
  alerts: {
    overdue_pic_count: number;
    bukti_menunggu_validasi: number;
    bank_konten_menunggu_validasi: number;
    reminder_sent_bulan_ini: number;
  };
}

export interface OfficerDashboardData {
  selected_period: DashboardSelectedPeriod;
  stats: {
    konten_disetujui: number;
    menunggu_review: number;
    perlu_revisi: number;
    akun_terverifikasi: number;
    total_akun: number;
    perlu_lampirkan_bukti: number;
    bukti_ditolak: number;
  };
  ranking: {
    wilayah_id: string | null;
    wilayah_nama: string;
    wilayah_kode: string;
    period_label: string;
    current_rank: number | null;
    total_pic_wilayah: number;
    valid_post_count: number;
    total_views: number;
    total_interactions: number;
    last_activity: string | null;
  } | null;
  alur_approval_terkini: {
    konten_id: string | null;
    judul: string | null;
    steps: unknown[];
  };
  konten_ditolak_terbaru: unknown;
  performa_akun: unknown[];
}
