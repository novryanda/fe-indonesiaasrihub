import { z } from "zod";

import { CONTENT_TOPIC_OPTIONS } from "@/features/content-shared/constants/content-options";

const fileSchema = z
  .custom<File | null | undefined>((value) => value == null || value instanceof File, {
    message: "File thumbnail tidak valid",
  })
  .refine((value) => !value || value.size <= 2 * 1024 * 1024, "Ukuran thumbnail maksimal 2MB")
  .refine(
    (value) => !value || ["image/jpeg", "image/png", "image/webp"].includes(value.type),
    "Thumbnail harus berformat JPG, PNG, atau WebP",
  );

const topikSchema = z
  .string({ message: "Topik kampanye wajib dipilih" })
  .trim()
  .min(1, "Topik kampanye wajib dipilih")
  .refine(
    (value) =>
      CONTENT_TOPIC_OPTIONS.includes(value as (typeof CONTENT_TOPIC_OPTIONS)[number]) || value.trim().length > 0,
    "Topik kampanye wajib dipilih",
  );

export const contentSubmissionSchema = z.object({
  judul: z
    .string({ message: "Judul konten wajib diisi" })
    .trim()
    .min(3, "Judul minimal 3 karakter")
    .max(120, "Judul maksimal 120 karakter"),
  platform: z.array(z.enum(["instagram", "tiktok", "youtube", "facebook", "x"])).min(1, "Pilih minimal satu platform"),
  jenis_konten: z.enum(["foto_poster", "video_reels", "infografis", "carousel", "thread_teks", "live"], {
    message: "Jenis konten wajib dipilih",
  }),
  topik: topikSchema,
  tanggal_posting: z
    .string({ message: "Tanggal posting wajib diisi" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal posting wajib diisi"),
  drive_link: z
    .string({ message: "Link Google Drive wajib diisi" })
    .url("Link Google Drive tidak valid")
    .refine((value) => value.includes("drive.google.com"), "Gunakan link Google Drive"),
  jumlah_file: z.enum(["1", "2-3", "4-5", "folder"], {
    message: "Jumlah file wajib dipilih",
  }),
  caption: z
    .string({ message: "Caption wajib diisi" })
    .trim()
    .min(10, "Caption minimal 10 karakter")
    .max(2200, "Caption maksimal 2200 karakter"),
  hashtags: z.array(z.string()).default([]),
  durasi_konten: z
    .enum(["kurang_30_detik", "30_60_detik", "1_3_menit", "3_10_menit", "lebih_10_menit"])
    .nullable()
    .optional(),
  target_audiens: z.array(z.enum(["masyarakat_umum", "pelajar", "ibu_rumah_tangga", "pelaku_usaha", "komunitas"])),
  urgensi: z.enum(["normal", "prioritas", "urgent"], {
    message: "Tingkat urgensi wajib dipilih",
  }),
  tipe: z.enum(["baru", "revisi_repost"], {
    message: "Tipe konten wajib dipilih",
  }),
  catatan_reviewer: z.string().trim().max(500, "Catatan untuk reviewer maksimal 500 karakter").optional().nullable(),
  thumbnail: fileSchema.optional(),
});

export const contentSubmissionInfoSchema = contentSubmissionSchema.pick({
  judul: true,
  platform: true,
  jenis_konten: true,
  topik: true,
  tanggal_posting: true,
});

export const contentSubmissionDriveSchema = contentSubmissionSchema.pick({
  drive_link: true,
  jumlah_file: true,
  thumbnail: true,
});

export const contentSubmissionDetailSchema = contentSubmissionSchema.pick({
  caption: true,
  hashtags: true,
  durasi_konten: true,
  target_audiens: true,
  urgensi: true,
  tipe: true,
  catatan_reviewer: true,
});

export type ContentSubmissionFormValues = z.infer<typeof contentSubmissionSchema>;
