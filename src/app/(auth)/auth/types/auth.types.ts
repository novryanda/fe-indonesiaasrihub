export type UserRole = "superadmin" | "qcc_wcc" | "wcc" | "pic_sosmed";
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
