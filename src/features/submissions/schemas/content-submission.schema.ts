import { z } from "zod";

import { CONTENT_TOPIC_OPTIONS } from "@/features/content-shared/constants/content-options";

const topikSchema = z
  .string({ message: "Topik kampanye wajib dipilih" })
  .trim()
  .min(1, "Topik kampanye wajib dipilih")
  .refine(
    (value) =>
      CONTENT_TOPIC_OPTIONS.includes(value as (typeof CONTENT_TOPIC_OPTIONS)[number]) || value.trim().length > 0,
    "Topik kampanye wajib dipilih",
  );

const contentSubmissionSchemaBase = z.object({
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
  urgensi: z.enum(["normal", "prioritas", "urgent"], {
    message: "Tingkat urgensi wajib dipilih",
  }),
  visibility_scope: z.enum(["national", "targeted_regions", "internal_only"], {
    message: "Cakupan visibilitas wajib dipilih",
  }),
  assignment_scope: z.enum(["none", "national", "targeted_regions"], {
    message: "Cakupan penugasan wajib dipilih",
  }),
  visibility_target_wilayah_ids: z.array(z.string()).default([]),
  assignment_target_wilayah_ids: z.array(z.string()).default([]),
  catatan_reviewer: z.string().trim().max(500, "Catatan untuk reviewer maksimal 500 karakter").optional().nullable(),
});

export const contentSubmissionSchema = contentSubmissionSchemaBase.superRefine((value, context) => {
  if (value.visibility_scope === "targeted_regions" && value.visibility_target_wilayah_ids.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["visibility_target_wilayah_ids"],
      message: "Pilih minimal satu wilayah target untuk visibility targeted",
    });
  }

  if (value.assignment_scope === "targeted_regions" && value.assignment_target_wilayah_ids.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["assignment_target_wilayah_ids"],
      message: "Pilih minimal satu wilayah target untuk assignment targeted",
    });
  }
});

export const contentSubmissionInfoSchema = contentSubmissionSchemaBase.pick({
  judul: true,
  platform: true,
  jenis_konten: true,
  topik: true,
  tanggal_posting: true,
});

export const contentSubmissionDriveSchema = contentSubmissionSchemaBase.pick({
  drive_link: true,
});

export const contentSubmissionDetailSchema = contentSubmissionSchemaBase.pick({
  caption: true,
  hashtags: true,
  durasi_konten: true,
  urgensi: true,
  visibility_scope: true,
  assignment_scope: true,
  visibility_target_wilayah_ids: true,
  assignment_target_wilayah_ids: true,
  catatan_reviewer: true,
});

export type ContentSubmissionFormValues = z.infer<typeof contentSubmissionSchema>;
