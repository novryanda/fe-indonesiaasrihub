import type { UserRole, UserStatus } from "@/app/(auth)/auth/types/auth.types";
import type { ContentPlatform } from "@/features/content-shared/types/content.type";
import type {
  SocialAccountEselon1,
  SocialAccountEselon2,
} from "@/features/social-accounts/constants/social-account-eselon";
import type {
  SocialAccountDelegationStatus,
  SocialAccountType,
  SocialAccountVerificationStatus,
} from "@/features/social-accounts/types/social-account.type";

export interface AccountProfileRegion {
  id: string;
  nama: string;
  kode: string;
  level: "nasional" | "provinsi";
}

export interface AccountProfileDelegatedAccount {
  id: string;
  wilayah_id: string;
  wilayah: AccountProfileRegion | null;
  platform: ContentPlatform;
  username: string;
  profile_url: string;
  nama_profil: string;
  tipe_akun: SocialAccountType;
  eselon_1: SocialAccountEselon1 | null;
  eselon_2: SocialAccountEselon2 | null;
  followers: number;
  verification_status: SocialAccountVerificationStatus;
  delegation_status: SocialAccountDelegationStatus;
  last_stat_update: string | null;
  delegated_at: string | null;
  created_at: string;
}

export interface AccountProfileData {
  user: {
    id: string;
    name: string;
    username: string | null;
    email: string;
    phone_number: string | null;
    image: string | null;
    role: UserRole;
    wilayah_id: string | null;
    wilayah: AccountProfileRegion | null;
    status: UserStatus;
    email_verified: boolean;
    created_at: string;
    updated_at: string;
  };
  delegated_account_count: number;
  delegated_accounts: AccountProfileDelegatedAccount[];
}

export interface ChangeMyPasswordPayload {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}

export interface UpdateMyAccountProfilePayload {
  name?: string;
  username?: string;
  phone_number?: string | null;
}

export interface ChangeMyEmailPayload {
  newEmail: string;
  callbackURL?: string;
}
