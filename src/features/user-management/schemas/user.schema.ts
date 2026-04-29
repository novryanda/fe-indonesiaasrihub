import { z } from "zod";

import { normalizeIndonesianPhoneNumber } from "@/lib/phone-number";

export const userRoleSchema = z.enum(["superadmin", "supervisi", "sysadmin", "qcc_wcc", "wcc", "pic_sosmed", "blast"]);
export const userStatusSchema = z.enum(["aktif", "nonaktif"]);
const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username minimal 3 karakter")
  .max(30, "Username maksimal 30 karakter")
  .regex(/^[a-zA-Z0-9_.]+$/, "Username hanya boleh huruf, angka, titik, dan underscore")
  .transform((value) => value.toLowerCase());

const nullablePhoneNumber = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    return normalizeIndonesianPhoneNumber(value);
  },
  z
    .string()
    .min(11, "Nomor HP minimal 8 digit")
    .max(25, "Nomor HP maksimal 22 digit")
    .regex(/^\+62[0-9]+$/, "Format nomor HP tidak valid")
    .nullable()
    .optional(),
);
const additionalPhoneNumber = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    return normalizeIndonesianPhoneNumber(value);
  },
  z
    .string()
    .min(11, "Nomor HP minimal 8 digit")
    .max(25, "Nomor HP maksimal 22 digit")
    .regex(/^\+62[0-9]+$/, "Format nomor HP tidak valid"),
);
const additionalPhoneNumbers = z
  .array(additionalPhoneNumber)
  .max(10, "Nomor HP tambahan maksimal 10 nomor")
  .transform((values) => Array.from(new Set(values)));

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
    username: usernameSchema,
    email: z.string().trim().email("Format email tidak valid"),
    phone_number: nullablePhoneNumber,
    additional_phone_numbers: additionalPhoneNumbers,
    role: userRoleSchema,
    wilayah_id: nullableWilayahId,
    password: z.string().min(8, "Password minimal 8 karakter").max(128, "Password maksimal 128 karakter"),
  })
  .superRefine((value, context) => {
    if (value.role !== "superadmin" && value.role !== "supervisi" && value.role !== "sysadmin" && !value.wilayah_id) {
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
    username: usernameSchema,
    phone_number: nullablePhoneNumber,
    additional_phone_numbers: additionalPhoneNumbers,
    role: userRoleSchema,
    wilayah_id: nullableWilayahId,
    status: userStatusSchema,
  })
  .superRefine((value, context) => {
    if (value.role !== "superadmin" && value.role !== "supervisi" && value.role !== "sysadmin" && !value.wilayah_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wilayah_id"],
        message: "Wilayah wajib untuk role berbasis wilayah",
      });
    }
  });

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
