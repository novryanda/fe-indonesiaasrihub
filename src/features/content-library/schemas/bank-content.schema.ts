import { z } from "zod";

export const bankContentSchema = z
  .object({
    judul: z.string().trim().min(3, "Judul minimal 3 karakter").max(120, "Judul maksimal 120 karakter"),
    deskripsi: z.string().trim().max(500, "Deskripsi maksimal 500 karakter").optional().nullable(),
    platform: z
      .array(z.enum(["instagram", "tiktok", "youtube", "facebook", "x"]))
      .min(1, "Pilih minimal satu platform"),
    jenis_konten: z.enum(["foto_poster", "video_reels", "infografis", "carousel", "thread_teks", "live"], {
      message: "Jenis konten wajib dipilih",
    }),
    topik: z.string().trim().min(1, "Topik kampanye wajib dipilih"),
    regional_asal: z.string().trim().min(2, "Regional asal wajib diisi"),
    tahun_kampanye: z.coerce
      .number()
      .int()
      .min(2020, "Tahun kampanye tidak valid")
      .max(2100, "Tahun kampanye tidak valid"),
    drive_link: z
      .string()
      .url("Link Google Drive tidak valid")
      .refine((value) => value.includes("drive.google.com"), "Gunakan link Google Drive"),
    visibility_scope: z.enum(["national", "targeted_regions", "internal_only"], {
      message: "Cakupan visibilitas wajib dipilih",
    }),
    assignment_scope: z.enum(["none", "national", "targeted_regions"], {
      message: "Cakupan penugasan wajib dipilih",
    }),
    visibility_target_wilayah_ids: z.array(z.string()).default([]),
    assignment_target_wilayah_ids: z.array(z.string()).default([]),
    hashtags: z.array(z.string()).default([]),
  })
  .superRefine((value, context) => {
    if (value.visibility_scope === "targeted_regions" && value.visibility_target_wilayah_ids.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visibility_target_wilayah_ids"],
        message: "Isi minimal satu target visibility jika visibility scope targeted.",
      });
    }

    if (value.assignment_scope === "targeted_regions" && value.assignment_target_wilayah_ids.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignment_target_wilayah_ids"],
        message: "Isi minimal satu target assignment jika assignment scope targeted.",
      });
    }
  });

export type BankContentFormValues = z.infer<typeof bankContentSchema>;
