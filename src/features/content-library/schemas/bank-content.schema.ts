import { z } from "zod";

const fileSchema = z
  .custom<File | null | undefined>((value) => value == null || value instanceof File, {
    message: "File thumbnail tidak valid",
  })
  .refine((value) => !value || value.size <= 2 * 1024 * 1024, "Ukuran thumbnail maksimal 2MB")
  .refine(
    (value) => !value || ["image/jpeg", "image/png", "image/webp"].includes(value.type),
    "Thumbnail harus berformat JPG, PNG, atau WebP",
  );

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
    jumlah_file: z.enum(["1", "2-3", "4-5", "folder"], {
      message: "Jumlah file wajib dipilih",
    }),
    status_akses: z.enum(["publik", "terbatas"], {
      message: "Status akses wajib dipilih",
    }),
    regional_terbatas: z.array(z.string()).default([]),
    hashtags: z.array(z.string()).default([]),
    thumbnail: fileSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.status_akses === "terbatas" && value.regional_terbatas.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["regional_terbatas"],
        message: "Isi minimal satu regional jika akses dibatasi.",
      });
    }
  });

export type BankContentFormValues = z.infer<typeof bankContentSchema>;
