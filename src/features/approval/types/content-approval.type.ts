import type {
  ContentItem,
  ContentPlatform,
  ContentStatus,
  PaginatedMeta,
  ReviewHistoryItem,
} from "@/features/content-shared/types/content.type";

export type ApprovalBoardMode = "regional-review" | "final-approval";

export interface ApprovalQueueFilters {
  search: string;
  platform: "all" | ContentPlatform;
  regional: "all" | string;
  dateFrom: string;
  dateTo: string;
  page: number;
  limit: number;
}

export interface ReviewDecisionPayload {
  action: "approved" | "rejected";
  note: string;
}

export interface ReviewDecisionResponse {
  id: string;
  status: ContentStatus;
  message: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approved_by?: string;
  approved_at?: string;
}

export interface ApprovalQueueState {
  items: ContentItem[];
  meta: PaginatedMeta | null;
  filters: ApprovalQueueFilters;
  isLoading: boolean;
  error: string | null;
  isMutatingItemId?: string;
  availableRegionals: string[];
}

export type ReviewHistoryState = {
  isLoading: boolean;
  items: ReviewHistoryItem[];
};
