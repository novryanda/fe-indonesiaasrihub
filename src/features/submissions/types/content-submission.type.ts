import type {
  BankContentAssignmentScope,
  BankContentVisibilityScope,
  ContentDurasi,
  ContentJenis,
  ContentPlatform,
  ContentUrgensi,
} from "@/features/content-shared/types/content.type";

export interface ContentSubmissionPayload {
  judul: string;
  platform: ContentPlatform[];
  jenis_konten: ContentJenis;
  topik: string;
  tanggal_posting: string;
  jam_posting: string;
  drive_link: string;
  caption: string;
  hashtags: string[];
  durasi_konten?: ContentDurasi | null;
  urgensi: ContentUrgensi;
  visibility_scope: BankContentVisibilityScope;
  assignment_scope: BankContentAssignmentScope;
  visibility_target_wilayah_ids: string[];
  assignment_target_wilayah_ids: string[];
  catatan_reviewer?: string | null;
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
