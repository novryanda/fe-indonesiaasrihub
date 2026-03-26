"use client";

import { CalendarClock, CheckCircle2, FolderKanban, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContentPlatform } from "@/features/content-shared/types/content.type";
import {
  formatDate,
  formatJenisKontenLabel,
  formatJumlahFileLabel,
  formatPlatformLabel,
  formatUrgensiLabel,
  getPlatformAccentClassName,
  getUrgencyAccentClassName,
} from "@/features/content-shared/utils/content-formatters";
import { cn } from "@/lib/utils";

import { WIZARD_STEPS, type WizardStep } from "./submission-stepper";

interface SubmissionSidebarSummaryProps {
  step: WizardStep;
  judul: string;
  platform: ContentPlatform[];
  jenisKonten: string;
  tanggalPosting: string;
  urgensi: string;
  hashtagCount: number;
  jumlahFile: string;
}

export function SubmissionSidebarSummary({
  step,
  judul,
  platform,
  jenisKonten,
  tanggalPosting,
  urgensi,
  hashtagCount,
  jumlahFile,
}: SubmissionSidebarSummaryProps) {
  return (
    <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
      <Card className="border-foreground/10 bg-linear-to-br from-zinc-950 to-zinc-900 text-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Ringkasan Singkat</CardTitle>
          <CardDescription className="text-zinc-300">Snapshot konten yang sedang Anda siapkan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 uppercase tracking-[0.2em]">Judul</p>
            <p className="line-clamp-2 font-medium text-sm">{judul || "Belum diisi"}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-zinc-400 uppercase tracking-[0.2em]">Platform</p>
            <div className="flex flex-wrap gap-2">
              {platform.length > 0 ? (
                platform.map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className={cn(
                      "rounded-full border-white/20 px-3 py-1 text-white",
                      getPlatformAccentClassName(item),
                    )}
                  >
                    {formatPlatformLabel(item)}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-zinc-300">Belum dipilih</span>
              )}
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl bg-white/8 p-4 text-sm">
            <div className="flex items-center gap-3">
              <FolderKanban className="size-4 text-emerald-300" />
              <span>{formatJenisKontenLabel(jenisKonten as never)}</span>
            </div>
            <div className="flex items-center gap-3">
              <CalendarClock className="size-4 text-emerald-300" />
              <span>{tanggalPosting ? formatDate(tanggalPosting) : "Tanggal belum dipilih"}</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-emerald-300" />
              <span>{formatUrgensiLabel(urgensi as never)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-100 bg-emerald-50/70">
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

      <Card>
        <CardHeader>
          <CardTitle>Tip Reviewer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Tambahkan konteks singkat pada catatan reviewer jika konten memiliki angle sensitif, data pendukung, atau
            tenggat khusus.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("rounded-full px-3 py-1", getUrgencyAccentClassName(urgensi as never))}
            >
              {formatUrgensiLabel(urgensi as never)}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {hashtagCount} hashtag
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {formatJumlahFileLabel(jumlahFile as never)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
