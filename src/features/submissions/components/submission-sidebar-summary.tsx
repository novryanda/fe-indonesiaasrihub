"use client";

import { CalendarClock, CheckCircle2, FolderKanban, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContentPlatform } from "@/features/content-shared/types/content.type";
import {
  composePostingTimeRange,
  formatJenisKontenLabel,
  formatPlatformLabel,
  formatPostingSchedule,
  formatUrgensiLabel,
  getPlatformAccentClassName,
} from "@/features/content-shared/utils/content-formatters";
import { cn } from "@/lib/utils";

import { WIZARD_STEPS, type WizardStep } from "./submission-stepper";

interface SubmissionSidebarSummaryProps {
  step: WizardStep;
  judul: string;
  platform: ContentPlatform[];
  jenisKonten: string;
  tanggalPosting: string;
  jamPostingMulai: string;
  jamPostingSelesai: string;
  urgensi: string;
}

export function SubmissionSidebarSummary({
  step,
  judul,
  platform,
  jenisKonten,
  tanggalPosting,
  jamPostingMulai,
  jamPostingSelesai,
  urgensi,
}: SubmissionSidebarSummaryProps) {
  return (
    <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
      <Card className="app-bg-surface app-border-soft shadow-lg">
        <CardHeader>
          <CardTitle>Ringkasan Singkat</CardTitle>
          <CardDescription>Snapshot konten yang sedang Anda siapkan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Judul</p>
            <p className="line-clamp-2 font-medium text-sm">{judul || "Belum diisi"}</p>
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Platform</p>
            <div className="flex flex-wrap gap-2">
              {platform.length > 0 ? (
                platform.map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className={cn("rounded-full px-3 py-1", getPlatformAccentClassName(item))}
                  >
                    {formatPlatformLabel(item)}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">Belum dipilih</span>
              )}
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl bg-background/70 p-4 text-sm dark:bg-card/70">
            <div className="flex items-center gap-3">
              <FolderKanban className="size-4 text-[color:var(--brand-hero)]" />
              <span>{formatJenisKontenLabel(jenisKonten as never)}</span>
            </div>
            <div className="flex items-center gap-3">
              <CalendarClock className="size-4 text-[color:var(--brand-hero)]" />
              <span>
                {tanggalPosting
                  ? formatPostingSchedule(tanggalPosting, composePostingTimeRange(jamPostingMulai, jamPostingSelesai))
                  : "Target posting belum dipilih"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-[color:var(--brand-hero)]" />
              <span>{formatUrgensiLabel(urgensi as never)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="app-bg-highlight app-border-soft">
        <CardHeader>
          <CardTitle>Checklist Wizard</CardTitle>
          <CardDescription>Pastikan tiap step selesai sebelum dikirim.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {WIZARD_STEPS.map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex size-6 items-center justify-center rounded-full border font-semibold text-xs",
                  item.step < step
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : item.step === step
                      ? "border-emerald-500 bg-white text-emerald-700"
                      : "border-border bg-white text-muted-foreground",
                )}
              >
                {item.step < step ? <CheckCircle2 className="size-3.5" /> : item.step}
              </div>
              <div className="space-y-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground text-xs">{item.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
