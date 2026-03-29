export type UserRole = "superadmin" | "sysadmin" | "qcc_wcc" | "wcc" | "pic_sosmed";

export type UserStatus = "aktif" | "nonaktif";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  role: UserRole;
  wilayah_id: string | null;
  regional: string | null;
  status: UserStatus;
  avatar_initials: string;
  email_verified: boolean;
  last_active: string | null;
  created_at: string;
}

export interface UsersStats {
  total: number;
  wcc: number;
  pic_sosmed: number;
  sysadmin: number;
  qcc_wcc: number;
  nonaktif: number;
}

export interface ListUsersData {
  stats: UsersStats;
  users: UserItem[];
}

export interface ListUsersMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ListUsersQuery {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  phone_number?: string | null;
  role: UserRole;
  wilayah_id?: string | null;
  password: string;
}

export interface CreateUserResult {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  role: UserRole;
  wilayah_id: string | null;
  regional: string | null;
  message: string;
}

export interface UpdateUserPayload {
  name?: string;
  phone_number?: string | null;
  role?: UserRole;
  wilayah_id?: string | null;
  status?: UserStatus;
}

export interface UpdateUserResult {
  id: string;
  name: string;
  phone_number: string | null;
  role: UserRole;
  wilayah_id: string | null;
  regional: string | null;
  status: UserStatus;
  updated_at: string;
}

export interface DeleteUserResult {
  id: string;
  name: string;
  email: string;
  deleted_at: string;
  message: string;
}

export interface ImportUsersErrorItem {
  row: number;
  email: string;
  reason: string;
}

export interface ImportUsersResult {
  imported: number;
  skipped: number;
  errors: ImportUsersErrorItem[];
}
