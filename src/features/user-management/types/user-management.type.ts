export type UserRole = "superadmin" | "supervisi" | "sysadmin" | "qcc_wcc" | "wcc" | "pic_sosmed" | "blast";

export type UserStatus = "aktif" | "nonaktif";

export interface UserItem {
  id: string;
  name: string;
  username: string | null;
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

export interface UserDetailActivityItem {
  id: string;
  action: string;
  entity_name: string;
  entity_id: string;
  source: string;
  method: string | null;
  path: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface UserDetailSessionItem {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
}

export interface UserDetailData {
  user: UserItem & {
    display_username: string | null;
    image: string | null;
    wilayah: {
      id: string;
      nama: string;
      kode: string;
      level: string;
    } | null;
    updated_at: string;
  };
  summary: {
    session_count: number;
    audit_log_count: number;
    delegated_social_account_count: number;
    created_content_count: number;
    posting_proof_count: number;
    notification_count: number;
  };
  recent_sessions: UserDetailSessionItem[];
  recent_activities: UserDetailActivityItem[];
}

export interface UsersStats {
  total: number;
  wcc: number;
  pic_sosmed: number;
  supervisi: number;
  sysadmin: number;
  qcc_wcc: number;
  blast: number;
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
  username: string;
  email: string;
  phone_number?: string | null;
  role: UserRole;
  wilayah_id?: string | null;
  password: string;
}

export interface CreateUserResult {
  id: string;
  name: string;
  username: string;
  email: string;
  phone_number: string | null;
  role: UserRole;
  wilayah_id: string | null;
  regional: string | null;
  message: string;
}

export interface UpdateUserPayload {
  name?: string;
  username?: string;
  phone_number?: string | null;
  role?: UserRole;
  wilayah_id?: string | null;
  status?: UserStatus;
}

export interface UpdateUserResult {
  id: string;
  name: string;
  username: string | null;
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
