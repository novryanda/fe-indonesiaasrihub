"use client";

import { CalendarDays, Clock3 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlatformMultiSelect } from "@/features/content-shared/components/platform-multi-select";
import {
  CONTENT_TOPIC_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  URGENCY_OPTIONS,
} from "@/features/content-shared/constants/content-options";
import { formatTopikLabel } from "@/features/content-shared/utils/content-formatters";
import { cn } from "@/lib/utils";

import type { ContentSubmissionDraft, FormErrorState } from "./content-submission-form.types";

interface SubmissionInfoStepProps {
  draft: ContentSubmissionDraft;
  errors: FormErrorState;
  disabled?: boolean;
  onFieldChange: <TKey extends keyof ContentSubmissionDraft>(field: TKey, value: ContentSubmissionDraft[TKey]) => void;
}

export function SubmissionInfoStep({ draft, errors, onFieldChange, disabled = false }: SubmissionInfoStepProps) {
  return (
    <>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="judul-konten">Judul Konten</Label>
          <span className="text-muted-foreground text-xs">{draft.judul.length}/120</span>
        </div>
        <Input
          id="judul-konten"
          value={draft.judul}
          placeholder="Masukkan judul konten"
          maxLength={120}
          disabled={disabled}
          onChange={(event) => onFieldChange("judul", event.target.value)}
        />
        {errors.judul && <p className="text-destructive text-xs">{errors.judul}</p>}
      </div>

      <div className="grid gap-2">
        <Label>Platform</Label>
        <PlatformMultiSelect
          value={draft.platform}
          disabled={disabled}
          onChange={(value) => onFieldChange("platform", value)}
        />
        {errors.platform && <p className="text-destructive text-xs">{errors.platform}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Jenis Konten</Label>
          <Select
            value={draft.jenis_konten}
            disabled={disabled}
            onValueChange={(value) => onFieldChange("jenis_konten", value as ContentSubmissionDraft["jenis_konten"])}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih jenis konten" />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.jenis_konten && <p className="text-destructive text-xs">{errors.jenis_konten}</p>}
        </div>

        <div className="grid gap-2">
          <Label>Topik Kampanye</Label>
          <Select value={draft.topik} disabled={disabled} onValueChange={(value) => onFieldChange("topik", value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih topik kampanye" />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_TOPIC_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatTopikLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.topik && <p className="text-destructive text-xs">{errors.topik}</p>}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Tingkat Urgensi</Label>
        <div className="flex flex-wrap gap-3">
          {URGENCY_OPTIONS.map((option) => {
            const selected = draft.urgensi === option.value;

            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                  selected
                    ? (option.accentClassName ?? "border-primary bg-primary/10 text-primary")
                    : "border-border bg-background hover:border-primary/30 hover:bg-primary/5",
                )}
                onClick={() => onFieldChange("urgensi", option.value)}
              >
                <p className="font-medium text-sm">{option.label}</p>
                <p className="mt-1 text-xs opacity-80">{option.hint}</p>
              </button>
            );
          })}
        </div>
        {errors.urgensi && <p className="text-destructive text-xs">{errors.urgensi}</p>}
      </div>

      <div className="rounded-3xl border border-border/60 bg-muted/20 p-4 md:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:items-end">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-4" />
              <Label htmlFor="tanggal-posting" className="text-foreground">
                Rencana Tanggal Posting
              </Label>
            </div>
            <Input
              id="tanggal-posting"
              type="date"
              value={draft.tanggal_posting}
              disabled={disabled}
              className="bg-background"
              onChange={(event) => onFieldChange("tanggal_posting", event.target.value)}
            />
            {errors.tanggal_posting && <p className="text-destructive text-xs">{errors.tanggal_posting}</p>}
          </div>

          <fieldset className="grid gap-3">

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-start">
              <div className="grid gap-2">
                <Label
                  htmlFor="jam-posting-mulai"
                  className="text-muted-foreground text-xs uppercase tracking-[0.18em]"
                >
                  Dari
                </Label>
                <Input
                  id="jam-posting-mulai"
                  type="time"
                  value={draft.jam_posting_mulai}
                  disabled={disabled}
                  className="bg-background"
                  onChange={(event) => onFieldChange("jam_posting_mulai", event.target.value)}
                />
                {errors.jam_posting_mulai && <p className="text-destructive text-xs">{errors.jam_posting_mulai}</p>}
              </div>

              <div className="hidden h-10 items-center justify-center text-muted-foreground text-sm sm:flex">s/d</div>

              <div className="grid gap-2">
                <Label
                  htmlFor="jam-posting-selesai"
                  className="text-muted-foreground text-xs uppercase tracking-[0.18em]"
                >
                  Sampai
                </Label>
                <Input
                  id="jam-posting-selesai"
                  type="time"
                  value={draft.jam_posting_selesai}
                  disabled={disabled}
                  className="bg-background"
                  onChange={(event) => onFieldChange("jam_posting_selesai", event.target.value)}
                />
                {errors.jam_posting_selesai && <p className="text-destructive text-xs">{errors.jam_posting_selesai}</p>}
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </>
  );
}
