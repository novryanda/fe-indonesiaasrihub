import { apiClient } from "@/shared/api/api-client";

import type { UserDetailData } from "../types/user-management.type";

export async function getUserDetail(userId: string) {
  const response = await apiClient<{
    user: {
      id: string;
      name: string;
      username: string | null;
      display_username: string | null;
      email: string;
      phone_number: string | null;
      additional_phone_numbers?: string[];
      phone_numbers?: string[];
      image: string | null;
      role: UserDetailData["user"]["role"];
      wilayah_id: string | null;
      wilayah: {
        id: string;
        nama: string;
        kode: string;
        level: string;
      } | null;
      status: UserDetailData["user"]["status"];
      avatar_initials: string;
      email_verified: boolean;
      created_at: string;
      updated_at: string;
      last_active: string | null;
    };
    summary: UserDetailData["summary"];
    recent_sessions: UserDetailData["recent_sessions"];
    recent_activities: UserDetailData["recent_activities"];
  }>(`/v1/users/${userId}`, {
    method: "GET",
  });

  return {
    ...response,
    data: {
      user: {
        ...response.data.user,
        additional_phone_numbers: response.data.user.additional_phone_numbers ?? [],
        phone_numbers: response.data.user.phone_numbers ?? [
          response.data.user.phone_number,
          ...(response.data.user.additional_phone_numbers ?? []),
        ].filter((phoneNumber): phoneNumber is string => Boolean(phoneNumber)),
        regional: response.data.user.wilayah?.nama ?? null,
      },
      summary: response.data.summary,
      recent_sessions: response.data.recent_sessions,
      recent_activities: response.data.recent_activities,
    } satisfies UserDetailData,
  };
}
