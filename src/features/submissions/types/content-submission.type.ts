import type {
  ContentDurasi,
  ContentJenis,
  ContentJumlahFile,
  ContentPlatform,
  ContentTargetAudiens,
  ContentTipe,
  ContentUrgensi,
} from "@/features/content-shared/types/content.type";

export interface ContentSubmissionPayload {
  judul: string;
  platform: ContentPlatform[];
  jenis_konten: ContentJenis;
  topik: string;
  tanggal_posting: string;
  drive_link: string;
  jumlah_file: ContentJumlahFile;
  caption: string;
  hashtags: string[];
  durasi_konten?: ContentDurasi | null;
  target_audiens?: ContentTargetAudiens[];
  urgensi: ContentUrgensi;
  tipe: ContentTipe;
  catatan_reviewer?: string | null;
  thumbnail?: File | null;
}

export interface ValidateDriveLinkResponse {
  is_valid: boolean;
  is_accessible: boolean;
  file_name?: string;
  file_type?: string;
  error_reason?: string;
}

export interface CreateContentSubmissionResponse {
  id: string;
  submission_code: string;
  status: "menunggu_final";
  message: string;
}

export type ResubmitContentPayload = ContentSubmissionPayload;

export interface ResubmitContentResponse {
  id: string;
  status: "menunggu_final";
  message: string;
}
