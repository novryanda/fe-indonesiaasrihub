export type PicActivityStatus = "aktif" | "tidak_aktif" | "baru";

export interface MonitoredPicSocialAccount {
  id: string;
  platform: "instagram" | "tiktok" | "youtube" | "facebook" | "x";
  username: string;
  nama_profil: string;
  verification_status: "verified" | "pending" | "rejected";
  is_verified: boolean;
}

export interface MonitorPicReminderTarget {
  id: string;
  judul: string;
  platform: Array<"instagram" | "tiktok" | "youtube" | "facebook" | "x">;
}

export interface MonitorPicListItem {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  wilayah_id: string | null;
  wilayah: {
    id: string;
    nama: string;
    kode: string;
    level: "nasional" | "provinsi";
  } | null;
  status_user: "aktif" | "nonaktif";
  avatar_initials: string;
  akun_sosmed: MonitoredPicSocialAccount[];
  delegated_account_count: number;
  total_posting_proofs: number;
  total_posting_links_with_stats: number;
  overdue_bank_content_count: number;
  overdue_bank_contents: MonitorPicReminderTarget[];
  posting_bulan_ini: number;
  last_posting_activity: string | null;
  last_stats_update: string | null;
  activity_status: PicActivityStatus;
}

export interface MonitorPicListData {
  stats: {
    total_pic: number;
    aktif: number;
    baru: number;
    tidak_aktif: number;
    total_overdue: number;
  };
  items: MonitorPicListItem[];
}

export interface MonitorPicDetailData {
  pic: {
    id: string;
    name: string;
    email: string;
    phone_number: string | null;
    wilayah_id: string | null;
    wilayah: {
      id: string;
      nama: string;
      kode: string;
      level: "nasional" | "provinsi";
    } | null;
    status_user: "aktif" | "nonaktif";
    joined_at: string;
    avatar_initials: string;
    activity_status: PicActivityStatus;
  };
  summary: {
    delegated_account_count: number;
    posting_bulan_ini: number;
    total_posting_proofs: number;
    total_posting_links_with_stats: number;
    overdue_bank_content_count: number;
    last_posting_activity: string | null;
    last_stats_update: string | null;
  };
  delegated_accounts: Array<{
    id: string;
    platform: "instagram" | "tiktok" | "youtube" | "facebook" | "x";
    username: string;
    nama_profil: string;
    followers: number;
    verification_status: "verified" | "pending" | "rejected";
    is_verified: boolean;
    last_stat_update: string | null;
  }>;
  overdue_bank_contents: Array<{
    id: string;
    judul: string;
    platform: Array<"instagram" | "tiktok" | "youtube" | "facebook" | "x">;
    created_at: string;
  }>;
  activity_timeline: Array<{
    id: string;
    type: "posting_proof_submitted" | "posting_stats_updated" | "reminder_sent";
    timestamp: string;
    label: string;
    payload: Record<string, unknown>;
  }>;
  reminder_history: Array<{
    id: string;
    sent_at: string;
    sender: {
      id: string;
      name: string;
      role: "superadmin" | "qcc_wcc" | "wcc" | "pic_sosmed";
    } | null;
    bank_content_id: string | null;
    bank_content_title: string | null;
    message: string;
  }>;
}

export interface MonitorPicReminderResult {
  sent_count: number;
  reminder_targets: MonitorPicReminderTarget[];
}
