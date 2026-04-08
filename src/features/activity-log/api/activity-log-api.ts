import { apiClient } from "@/shared/api/api-client";

import type {
  ActivityLogItem,
  ActivityLogsMeta,
  ActivityLogsQuery,
  ActivityLogsResponse,
} from "../types/activity-log.type";

function mapActivityLog(item: {
  id: string;
  action: string;
  entity_name: string;
  entity_id: string;
  created_at: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  source: string;
  method: string | null;
  path: string | null;
  route: string | null;
  result: string | null;
  status_code: number | null;
  duration_ms: number | null;
  ip_address: string | null;
  is_private_network: boolean | null;
  user_agent: string | null;
  location: {
    city: string | null;
    region: string | null;
    country: string | null;
  };
  gps: {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    captured_at: string | null;
  };
  payload: unknown;
}): ActivityLogItem {
  return {
    id: item.id,
    action: item.action,
    entityName: item.entity_name,
    entityId: item.entity_id,
    createdAt: item.created_at,
    actor: item.actor,
    source: item.source,
    method: item.method,
    path: item.path,
    route: item.route,
    result: item.result,
    statusCode: item.status_code,
    durationMs: item.duration_ms,
    ipAddress: item.ip_address,
    isPrivateNetwork: item.is_private_network,
    userAgent: item.user_agent,
    location: item.location,
    gps: {
      latitude: item.gps.latitude,
      longitude: item.gps.longitude,
      accuracy: item.gps.accuracy,
      capturedAt: item.gps.captured_at,
    },
    payload: item.payload,
  };
}

export async function listActivityLogs(query: ActivityLogsQuery) {
  const response = await apiClient<
    {
      stats: {
        total_logs: number;
        today_logs: number;
        unique_actors: number;
        request_logs: number;
      };
      items: Array<{
        id: string;
        action: string;
        entity_name: string;
        entity_id: string;
        created_at: string;
        actor: {
          id: string;
          name: string;
          email: string;
          role: string;
        } | null;
        source: string;
        method: string | null;
        path: string | null;
        route: string | null;
        result: string | null;
        status_code: number | null;
        duration_ms: number | null;
        ip_address: string | null;
        is_private_network: boolean | null;
        user_agent: string | null;
        location: {
          city: string | null;
          region: string | null;
          country: string | null;
        };
        gps: {
          latitude: number | null;
          longitude: number | null;
          accuracy: number | null;
          captured_at: string | null;
        };
        payload: unknown;
      }>;
    },
    ActivityLogsMeta
  >("/v1/activity-logs", {
    params: {
      search: query.search,
      actor_id: query.actorId,
      entity_name: query.entityName,
      action: query.action,
      date_from: query.dateFrom,
      date_to: query.dateTo,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    },
  });

  return {
    ...response,
    data: {
      stats: {
        totalLogs: response.data.stats.total_logs,
        todayLogs: response.data.stats.today_logs,
        uniqueActors: response.data.stats.unique_actors,
        requestLogs: response.data.stats.request_logs,
      },
      items: response.data.items.map(mapActivityLog),
    } satisfies ActivityLogsResponse,
  };
}

export async function getActivityLogDetail(id: string) {
  const response = await apiClient<{
    id: string;
    action: string;
    entity_name: string;
    entity_id: string;
    created_at: string;
    actor: {
      id: string;
      name: string;
      email: string;
      role: string;
    } | null;
    source: string;
    method: string | null;
    path: string | null;
    route: string | null;
    result: string | null;
    status_code: number | null;
    duration_ms: number | null;
    ip_address: string | null;
    is_private_network: boolean | null;
    user_agent: string | null;
    location: {
      city: string | null;
      region: string | null;
      country: string | null;
    };
    gps: {
      latitude: number | null;
      longitude: number | null;
      accuracy: number | null;
      captured_at: string | null;
    };
    payload: unknown;
  }>(`/v1/activity-logs/${id}`);

  return {
    ...response,
    data: mapActivityLog(response.data),
  };
}
