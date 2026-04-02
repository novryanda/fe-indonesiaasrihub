"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { AnalyticsFilterParams, AnalyticsPlatform } from "../types/analytics-report.type";

export const PLATFORM_OPTIONS: Array<{
  value: "all" | AnalyticsPlatform;
  label: string;
}> = [
  { value: "all", label: "Semua Platform" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X" },
];

const compactFormatter = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const decimalFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

const MONTH_OPTIONS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
] as const;

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, index) => currentYear - index);
}

function getMonthLabel(month: number) {
  return MONTH_OPTIONS.find((option) => option.value === month)?.label ?? "Pilih bulan";
}

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatCompactNumber(value: number) {
  return compactFormatter.format(value);
}

export function formatPercent(value: number) {
  return `${decimalFormatter.format(value)}%`;
}

export function formatScoreColor(value: number) {
  if (value >= 80) {
    return "text-emerald-600";
  }

  if (value >= 60) {
    return "text-amber-600";
  }

  return "text-rose-600";
}

export function medalLabel(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return String(rank);
}

export function SortHeader(props: { label: string; active: boolean; direction: "asc" | "desc"; onClick: () => void }) {
  return (
    <button type="button" className="inline-flex items-center gap-2 text-left font-medium" onClick={props.onClick}>
      <span>{props.label}</span>
      {props.active ? (
        props.direction === "asc" ? (
          <ArrowUp className="size-3.5 text-primary" />
        ) : (
          <ArrowDown className="size-3.5 text-primary" />
        )
      ) : (
        <ArrowUpDown className="size-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

export function ScoreProgress(props: { value: number }) {
  return (
    <div className="min-w-36 space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{formatPercent(props.value)}</span>
      </div>
      <Progress value={Math.max(0, Math.min(100, props.value))} className="h-2" />
    </div>
  );
}

export function TrendBadge(props: { direction: "up" | "down" | "same"; delta: number }) {
  const tone =
    props.direction === "up"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : props.direction === "down"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <Badge variant="outline" className={tone}>
      {props.direction === "up" ? "↑" : props.direction === "down" ? "↓" : "→"} {decimalFormatter.format(props.delta)}
    </Badge>
  );
}

export function AnalyticsFiltersBar(props: {
  title: string;
  description: string;
  filters: AnalyticsFilterParams;
  generatedAt?: string;
  showRealtimeNote?: boolean;
  onChange: (next: AnalyticsFilterParams) => void;
}) {
  return (
    <Card className="app-bg-hero app-border-soft overflow-hidden">
      <CardContent className="space-y-6 px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Badge
              variant="outline"
              className="rounded-full border-emerald-200 bg-background/75 px-3 py-1 text-emerald-700 dark:bg-card/75"
            >
              Analitik / Laporan Analitik
            </Badge>
            <div className="space-y-2">
              <h1 className="font-semibold text-3xl tracking-tight">{props.title}</h1>
              <p className="max-w-3xl text-muted-foreground text-sm leading-6">{props.description}</p>
            </div>
          </div>

          <div className="app-panel-glass grid gap-2 rounded-2xl border p-4 shadow-sm backdrop-blur">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">Scope Dashboard</p>
            <p className="font-semibold text-lg">Nasional</p>
            <p className="text-muted-foreground text-sm">
              {getMonthLabel(props.filters.month)} {props.filters.year}
            </p>
            {props.showRealtimeNote && props.generatedAt ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 text-xs leading-5">
                Realtime s.d. {formatGeneratedAt(props.generatedAt)}
              </p>
            ) : null}

            <Select
              value={String(props.filters.month)}
              onValueChange={(value) =>
                props.onChange({
                  ...props.filters,
                  month: Number(value),
                })
              }
            >
              <SelectTrigger className="app-control-surface min-w-56">
                <SelectValue placeholder="Pilih bulan" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(props.filters.year)}
              onValueChange={(value) =>
                props.onChange({
                  ...props.filters,
                  year: Number(value),
                })
              }
            >
              <SelectTrigger className="app-control-surface min-w-56">
                <SelectValue placeholder="Pilih tahun" />
              </SelectTrigger>
              <SelectContent>
                {getYearOptions().map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={props.filters.platform ?? "all"}
              onValueChange={(value) =>
                props.onChange({
                  ...props.filters,
                  platform: value === "all" ? undefined : (value as AnalyticsPlatform),
                })
              }
            >
              <SelectTrigger className="app-control-surface min-w-56">
                <SelectValue placeholder="Pilih platform" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KpiCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {["kpi-skeleton-1", "kpi-skeleton-2", "kpi-skeleton-3", "kpi-skeleton-4"].map((key) => (
        <Card key={key}>
          <CardContent className="space-y-3 py-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-4 w-48" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ErrorAlert(props: { title?: string; message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{props.title ?? "Terjadi kendala"}</AlertTitle>
      <AlertDescription>{props.message}</AlertDescription>
    </Alert>
  );
}

export function PlatformPill(props: { platform: AnalyticsPlatform; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        props.platform === "instagram" && "border-rose-200 bg-rose-50 text-rose-700",
        props.platform === "tiktok" && "border-cyan-200 bg-cyan-50 text-cyan-700",
        props.platform === "youtube" && "border-red-200 bg-red-50 text-red-700",
        props.platform === "facebook" && "border-blue-200 bg-blue-50 text-blue-700",
        props.platform === "x" && "border-slate-200 bg-slate-100 text-slate-700",
        props.className,
      )}
    >
      {props.platform}
    </Badge>
  );
}
