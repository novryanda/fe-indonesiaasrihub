export type NotificationStatusFilter = "all" | "read" | "unread";

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationListData {
  notifications: NotificationItem[];
  unreadCount: number;
}
