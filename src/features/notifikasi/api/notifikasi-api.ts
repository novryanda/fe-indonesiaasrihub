import { apiClient } from "@/shared/api/api-client";

import type { NotificationListData, NotificationStatusFilter } from "../types/notifikasi.type";

export async function getNotifications(params?: {
  page?: number;
  limit?: number;
  status?: NotificationStatusFilter;
}) {
  return apiClient<NotificationListData, { page: number; limit: number; total: number; totalPages: number }>(
    "/v1/notifikasi",
    {
      method: "GET",
      params: {
        page: params?.page,
        limit: params?.limit,
        status: params?.status,
      },
    },
  );
}

export async function markNotificationAsRead(id: string) {
  return apiClient<unknown>(`/v1/notifikasi/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsAsRead() {
  return apiClient<{ updatedCount: number }>("/v1/notifikasi/read-all", {
    method: "PATCH",
  });
}
