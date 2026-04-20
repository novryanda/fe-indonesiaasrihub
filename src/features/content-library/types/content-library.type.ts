import type { BankContentAccessStatus } from "@/features/content-shared/constants/content-options";
import type {
  BankContentAssignmentScope,
  BankContentVisibilityScope,
  ContentJenis,
  ContentPlatform,
  PaginatedMeta,
} from "@/features/content-shared/types/content.type";

export interface BankContentStats {
  total_konten: number;
  bulan_ini: number;
  platform_count: number;
  topik_aktif: number;
}

export interface BankContentItem {
  id: string;
  submission_code: string | null;
  judul: string;
  platform: ContentPlatform[];
  wilayah_id?: string;
  source_wilayah_id?: string;
  topik: string;
  regional_asal: string;
  tahun_kampanye: number;
  drive_link: string;
  hashtags: string[];
  status_akses: BankContentAccessStatus;
  visibility_scope: BankContentVisibilityScope;
  assignment_scope: BankContentAssignmentScope;
  visibility_targets: Array<{ id: string; nama: string; kode: string; level: string }>;
  assignment_targets: Array<{ id: string; nama: string; kode: string; level: string }>;
  task_summary: {
    assigned_pic_count: number;
    assignment_generated_at: string | null;
    approval_at: string | null;
  };
  uploaded_by: string;
  created_at: string;
}

export interface BankContentUsageItem {
  id: string;
  posted_at: string;
  social_account: {
    id: string;
    platform: ContentPlatform;
    username: string;
    nama_profil: string;
  };
  pic_sosmed: {
    id: string;
    name: string;
    regional: string | null;
  } | null;
  bukti_posting_id: string | null;
  pic_bukti_posting: {
    id: string;
    name: string;
    regional: string | null;
  } | null;
  post_url: string | null;
  validation_status: string | null;
}

export interface BankContentAssignmentItem {
  id: string;
  status: string;
  submitted_at: string | null;
  evidence_drive_link: string | null;
  platform_targets: ContentPlatform[];
  pic: {
    id: string;
    name: string;
    wilayah_id: string | null;
    regional: string | null;
  };
}

export interface BankContentAssignmentLinkItem {
  id: string;
  platform: ContentPlatform;
  post_url: string;
  posted_at: string;
  catatan_officer: string | null;
  validation_status: string;
  social_account: {
    id: string;
    username: string;
    nama_profil: string;
  } | null;
}

export interface BankContentCurrentPostingTask extends BankContentAssignmentItem {
  links: BankContentAssignmentLinkItem[];
}

export interface BankContentDetail extends BankContentItem {
  deskripsi: string | null;
  jenis_konten: string;
  regional_terbatas: string[];
  updated_at: string;
  jumlah_posting_digunakan: number;
  jumlah_konten_turunan: number;
  source_content?: {
    id: string;
    status: string;
    submission_code: string;
  } | null;
  penugasan_posting: BankContentAssignmentItem[];
  current_posting_task: BankContentCurrentPostingTask | null;
  penggunaan_posting: BankContentUsageItem[];
}

export interface ListBankContentData {
  stats: BankContentStats;
  items: BankContentItem[];
}

export interface BankContentFilters {
  platform: "all" | ContentPlatform;
  topik: "all" | string;
  wilayah_id: "all" | string;
  date_from?: string;
  date_to?: string;
  search: string;
  page: number;
  limit: number;
}

export interface UploadBankContentPayload {
  judul: string;
  deskripsi?: string | null;
  platform: ContentPlatform[];
  jenis_konten: ContentJenis;
  topik: string;
  regional_asal: string;
  tahun_kampanye: number;
  drive_link: string;
  visibility_scope: BankContentVisibilityScope;
  assignment_scope: BankContentAssignmentScope;
  visibility_target_wilayah_ids?: string[];
  assignment_target_wilayah_ids?: string[];
  hashtags: string[];
}

export interface UploadBankContentResponse {
  id: string;
  judul: string;
  message: string;
}

export type BankContentMeta = PaginatedMeta;
