export interface ActivityLogActor {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ActivityLogLocation {
  city: string | null;
  region: string | null;
  country: string | null;
}

export interface ActivityLogGps {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  capturedAt: string | null;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  entityName: string;
  entityId: string;
  createdAt: string;
  actor: ActivityLogActor | null;
  source: string;
  method: string | null;
  path: string | null;
  route: string | null;
  result: string | null;
  statusCode: number | null;
  durationMs: number | null;
  ipAddress: string | null;
  isPrivateNetwork: boolean | null;
  userAgent: string | null;
  location: ActivityLogLocation;
  gps: ActivityLogGps;
  payload: unknown;
}

export interface ActivityLogStats {
  totalLogs: number;
  todayLogs: number;
  uniqueActors: number;
  requestLogs: number;
}

export interface ActivityLogsResponse {
  stats: ActivityLogStats;
  items: ActivityLogItem[];
}

export interface ActivityLogsQuery {
  search?: string;
  actorId?: string;
  entityName?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ActivityLogsMeta {
  page: number;
  limit: number;
  total: number;
}
