import { apiClient } from "@/shared/api/api-client";

import type {
  MonitorPicDetailData,
  MonitorPicListData,
  MonitorPicReminderResult,
  PicActivityStatus,
} from "../types/monitor-pic-sosmed.type";

export async function getMonitorPicSosmedList(params?: {
  status?: PicActivityStatus;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return apiClient<MonitorPicListData, { page: number; limit: number; total: number }>(
    "/v1/monitor-pic-sosmed",
    {
      method: "GET",
      params: {
        status: params?.status,
        search: params?.search,
        page: params?.page,
        limit: params?.limit,
      },
    },
  );
}

export async function getMonitorPicSosmedDetail(id: string) {
  return apiClient<MonitorPicDetailData>(`/v1/monitor-pic-sosmed/${id}`, {
    method: "GET",
  });
}

export async function sendMonitorPicReminder(id: string, body?: { pesan?: string }) {
  return apiClient<MonitorPicReminderResult>(`/v1/monitor-pic-sosmed/${id}/reminders`, {
    method: "POST",
    body,
  });
}
