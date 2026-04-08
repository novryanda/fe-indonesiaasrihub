export type UserRole = "superadmin" | "supervisi" | "sysadmin" | "qcc_wcc" | "wcc" | "pic_sosmed" | "blast";
export type UserStatus = "aktif" | "nonaktif";

/** Role tabs shown on login page */
export type LoginRole = "creator" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  regional: string | null;
  status: UserStatus;
}
