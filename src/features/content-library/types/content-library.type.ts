import type { BankContentAccessStatus } from "@/features/content-shared/constants/content-options";
import type {
  ContentJenis,
  ContentJumlahFile,
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
  judul: string;
  platform: ContentPlatform[];
  wilayah_id?: string;
  topik: string;
  regional_asal: string;
  tahun_kampanye: number;
  drive_link: string;
  thumbnail_url: string | null;
  hashtags: string[];
  status_akses: BankContentAccessStatus;
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

export interface BankContentDetail extends BankContentItem {
  deskripsi: string | null;
  jenis_konten: string;
  jumlah_file: ContentJumlahFile;
  regional_terbatas: string[];
  updated_at: string;
  jumlah_posting_digunakan: number;
  jumlah_konten_turunan: number;
  source_content?: {
    id: string;
    status: string;
    submission_code: string;
  } | null;
  penggunaan_posting: BankContentUsageItem[];
}

export interface ListBankContentData {
  stats: BankContentStats;
  items: BankContentItem[];
}

export interface BankContentFilters {
  platform: "all" | ContentPlatform;
  topik: "all" | string;
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
  jumlah_file: ContentJumlahFile;
  status_akses: BankContentAccessStatus;
  regional_terbatas?: string[];
  hashtags: string[];
  thumbnail?: File | null;
}

export interface UploadBankContentResponse {
  id: string;
  judul: string;
  message: string;
}

export type BankContentMeta = PaginatedMeta;
