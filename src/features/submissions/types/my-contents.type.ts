import type { ContentPlatform, ContentStatus } from "@/features/content-shared/types/content.type";

export interface MyContentsFilters {
  search: string;
  status: "all" | ContentStatus;
  platform: "all" | ContentPlatform;
  dateFrom: string;
  dateTo: string;
  page: number;
  limit: number;
}
