import {
  CONTENT_TOPIC_LABELS,
  CONTENT_TYPE_OPTIONS,
  DURATION_OPTIONS,
  PLATFORM_OPTIONS,
  REVIEW_STEP_LABELS,
  URGENCY_OPTIONS,
} from "../constants/content-options";
import type {
  ContentDurasi,
  ContentJenis,
  ContentPlatform,
  ContentStatus,
  ContentUrgensi,
  ReviewStep,
} from "../types/content.type";

function getOptionLabel<TValue extends string>(
  options: Array<{ value: TValue; label: string }>,
  value: TValue | null | undefined,
) {
  if (!value) {
    return "-";
  }

  return options.find((option) => option.value === value)?.label ?? value;
}

export function formatPlatformLabel(value: ContentPlatform) {
  return getOptionLabel(PLATFORM_OPTIONS, value);
}

export function formatJenisKontenLabel(value: ContentJenis | null | undefined) {
  return getOptionLabel(CONTENT_TYPE_OPTIONS, value ?? undefined);
}

export function formatDurasiLabel(value: ContentDurasi | null | undefined) {
  return getOptionLabel(DURATION_OPTIONS, value ?? undefined);
}

export function formatUrgensiLabel(value: ContentUrgensi | null | undefined) {
  return getOptionLabel(URGENCY_OPTIONS, value ?? undefined);
}

export function formatTopikLabel(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return CONTENT_TOPIC_LABELS[value as keyof typeof CONTENT_TOPIC_LABELS] ?? value.replaceAll("_", " ");
}

export function formatReviewStepLabel(value: ReviewStep) {
  return REVIEW_STEP_LABELS[value];
}

export function formatContentStatusLabel(status: ContentStatus) {
  switch (status) {
    case "menunggu_final":
      return "Menunggu Final Approval";
    case "disetujui":
      return "Disetujui";
    case "ditolak":
      return "Ditolak";
    case "revisi":
      return "Perlu Revisi";
    default:
      return "Draft";
  }
}

export function getPlatformAccentClassName(platform: ContentPlatform) {
  return (
    PLATFORM_OPTIONS.find((option) => option.value === platform)?.accentClassName ??
    "border-border bg-muted text-foreground"
  );
}

export function getUrgencyAccentClassName(urgensi: ContentUrgensi) {
  return (
    URGENCY_OPTIONS.find((option) => option.value === urgensi)?.accentClassName ??
    "border-border bg-muted text-foreground"
  );
}

export function getStatusAccentClassName(status: ContentStatus) {
  switch (status) {
    case "menunggu_final":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "disetujui":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "revisi":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "ditolak":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
  }
}

export function formatDate(value: string | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", options ?? { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(value: string | null | undefined) {
  return formatDate(value, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("id-ID").format(value ?? 0);
}

export function formatYear(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("id-ID", { useGrouping: false, maximumFractionDigits: 0 }).format(value);
}

export function formatTimeAgo(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} hari lalu`;
  }

  return formatDate(value);
}
