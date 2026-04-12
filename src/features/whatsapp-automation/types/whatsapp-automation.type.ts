import type { UserRole } from "@/app/(auth)/auth/types/auth.types";

export type WhatsappAutomationKey =
  | "pic_task_assigned"
  | "pic_deadline_reminder"
  | "pic_overdue_reminder"
  | "content_final_approval_pending_reminder"
  | "posting_validation_pending_reminder";

export type WhatsappAutomationScheduleKind = "immediate" | "daily";

export type WhatsappAutomationItem = {
  id: string;
  key: WhatsappAutomationKey;
  name: string;
  description: string;
  executionMode: WhatsappAutomationScheduleKind;
  supportedExecutionModes: WhatsappAutomationScheduleKind[];
  supportedVariables: string[];
  targetRoles: UserRole[];
  templateBody: string;
  runAt: string | null;
  isActive: boolean;
  updatedAt: string;
};
