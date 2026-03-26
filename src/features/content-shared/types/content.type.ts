export type ContentPlatform = "instagram" | "tiktok" | "youtube" | "facebook" | "x";

export type ContentJenis = "foto_poster" | "video_reels" | "infografis" | "carousel" | "thread_teks" | "live";

export type ContentJumlahFile = "1" | "2-3" | "4-5" | "folder";

export type ContentDurasi = "kurang_30_detik" | "30_60_detik" | "1_3_menit" | "3_10_menit" | "lebih_10_menit";

export type ContentTargetAudiens = "masyarakat_umum" | "pelajar" | "ibu_rumah_tangga" | "pelaku_usaha" | "komunitas";

export type ContentUrgensi = "normal" | "prioritas" | "urgent";

export type ContentTipe = "baru" | "revisi_repost";

export type ContentStatus =
  | "draft"
  | "menunggu_final"
  | "disetujui"
  | "ditolak"
  | "revisi";

export type ReviewStep = "wcc" | "superadmin";

export interface ContentOfficer {
  id: string;
  name: string;
  wilayah_id?: string | null;
  regional: string | null;
}

export interface ContentItem {
  id: string;
  submission_code: string;
  judul: string;
  platform: ContentPlatform[];
  jenis_konten: ContentJenis;
  topik: string;
  tanggal_posting: string;
  drive_link: string;
  jumlah_file: ContentJumlahFile;
  thumbnail_url: string | null;
  status: ContentStatus;
  urgensi: ContentUrgensi;
  caption: string;
  hashtags: string[];
  durasi_konten: ContentDurasi | null;
  target_audiens: ContentTargetAudiens[];
  tipe: ContentTipe;
  catatan_reviewer: string | null;
  officer: ContentOfficer;
  created_at: string;
  updated_at: string;
}

export interface ReviewHistoryItem {
  step: ReviewStep;
  actor_id?: string;
  actor_name: string;
  action: "submitted" | "resubmitted" | "approved" | "rejected";
  note: string;
  timestamp: string;
}

export interface PostingProofLinkItem {
  id: string;
  platform: ContentPlatform;
  post_url: string;
  posted_at: string;
  validation_status: string;
  rejection_type: string | null;
  rejection_note: string | null;
  validated_by: string | null;
  validated_at: string | null;
  attempt_count: number;
}

export interface PostingProofItem {
  id: string;
  status: string;
  links: PostingProofLinkItem[];
}

export interface ContentDetail extends ContentItem {
  approval_history: ReviewHistoryItem[];
  bukti_posting: PostingProofItem | null;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
}
