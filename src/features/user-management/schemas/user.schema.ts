import { z } from "zod";

export const userRoleSchema = z.enum(["superadmin", "sysadmin", "qcc_wcc", "wcc", "pic_sosmed"]);
export const userStatusSchema = z.enum(["aktif", "nonaktif"]);
const nullablePhoneNumber = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}, z.string().min(8, "Nomor HP minimal 8 karakter").max(24, "Nomor HP maksimal 24 karakter").regex(/^[0-9+\-\s()]+$/, "Format nomor HP tidak valid").nullable().optional());

const nullableWilayahId = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}, z.string().min(1, "Wilayah wajib dipilih").nullable().optional());

export const createUserSchema = z
  .object({
    name: z.string().trim().min(3, "Nama minimal 3 karakter").max(120, "Nama maksimal 120 karakter"),
    email: z.string().trim().email("Format email tidak valid"),
    phone_number: nullablePhoneNumber,
    role: userRoleSchema,
    wilayah_id: nullableWilayahId,
    password: z.string().min(8, "Password minimal 8 karakter").max(128, "Password maksimal 128 karakter"),
  })
  .superRefine((value, context) => {
    if (value.role !== "superadmin" && value.role !== "sysadmin" && !value.wilayah_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wilayah_id"],
        message: "Wilayah wajib untuk role berbasis wilayah",
      });
    }
  });

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(3, "Nama minimal 3 karakter").max(120, "Nama maksimal 120 karakter"),
    phone_number: nullablePhoneNumber,
    role: userRoleSchema,
    wilayah_id: nullableWilayahId,
    status: userStatusSchema,
  })
  .superRefine((value, context) => {
    if (value.role !== "superadmin" && value.role !== "sysadmin" && !value.wilayah_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wilayah_id"],
        message: "Wilayah wajib untuk role berbasis wilayah",
      });
    }
  });

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
