"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HashtagInput } from "@/features/content-shared/components/hashtag-input";
import {
  CONTENT_ENTRY_TYPE_OPTIONS,
  DURATION_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
  URGENCY_OPTIONS,
} from "@/features/content-shared/constants/content-options";
import { cn } from "@/lib/utils";

import type { ContentSubmissionDraft, FormErrorState } from "./content-submission-form.types";

interface SubmissionDetailStepProps {
  draft: ContentSubmissionDraft;
  errors: FormErrorState;
  disableBriefFields?: boolean;
  onFieldChange: <TKey extends keyof ContentSubmissionDraft>(field: TKey, value: ContentSubmissionDraft[TKey]) => void;
}

export function SubmissionDetailStep({
  draft,
  errors,
  disableBriefFields = false,
  onFieldChange,
}: SubmissionDetailStepProps) {
  return (
    <>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="caption">Caption / Deskripsi</Label>
          <span className="text-muted-foreground text-xs">{draft.caption.length}/2200</span>
        </div>
        <Textarea
          id="caption"
          value={draft.caption}
          placeholder="Tulis caption, narasi utama, atau konteks konten"
          className="min-h-40"
          maxLength={2200}
          onChange={(event) => onFieldChange("caption", event.target.value)}
        />
        {errors.caption && <p className="text-destructive text-xs">{errors.caption}</p>}
      </div>

      <div className="grid gap-2">
        <Label>Hashtag</Label>
        <HashtagInput
          value={draft.hashtags}
          disabled={disableBriefFields}
          onChange={(value) => onFieldChange("hashtags", value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Durasi Konten</Label>
          <Select
            value={draft.durasi_konten ?? "none"}
            disabled={disableBriefFields}
            onValueChange={(value) =>
              onFieldChange(
                "durasi_konten",
                value === "none" ? null : (value as ContentSubmissionDraft["durasi_konten"]),
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih durasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Tidak ada</SelectItem>
              {DURATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3">
          <Label>Target Audiens</Label>
          <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-2">
            {TARGET_AUDIENCE_OPTIONS.map((option) => {
              const selected = draft.target_audiens.includes(option.value);

              return (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-3 py-3 transition",
                    selected
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-border/70 bg-background hover:border-primary/30 hover:bg-primary/5",
                    disableBriefFields && "cursor-not-allowed opacity-60",
                  )}
                >
                  <Checkbox
                    checked={selected}
                    disabled={disableBriefFields}
                    onCheckedChange={(checked) =>
                      onFieldChange(
                        "target_audiens",
                        checked
                          ? [...draft.target_audiens, option.value]
                          : draft.target_audiens.filter((item) => item !== option.value),
                      )
                    }
                  />
                  <span className="font-medium text-sm leading-5">{option.label}</span>
                </div>
              );
            })}
          </div>
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
                disabled={disableBriefFields}
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
      </div>

      <div className="space-y-3">
        <Label>Tipe Konten</Label>
        <div className="flex flex-wrap gap-3">
          {CONTENT_ENTRY_TYPE_OPTIONS.map((option) => {
            const selected = draft.tipe === option.value;

            return (
              <button
                key={option.value}
                type="button"
                disabled={disableBriefFields}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60",
                  selected
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-border bg-background hover:border-primary/30 hover:bg-primary/5",
                )}
                onClick={() => onFieldChange("tipe", option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="catatan-reviewer">Catatan untuk Reviewer</Label>
          <span className="text-muted-foreground text-xs">{draft.catatan_reviewer?.length ?? 0}/500</span>
        </div>
        <Textarea
          id="catatan-reviewer"
          value={draft.catatan_reviewer ?? ""}
          placeholder="Tambahkan konteks singkat, angle konten, atau kebutuhan spesifik untuk reviewer"
          className="min-h-28"
          maxLength={500}
          onChange={(event) => onFieldChange("catatan_reviewer", event.target.value)}
        />
        {errors.catatan_reviewer && <p className="text-destructive text-xs">{errors.catatan_reviewer}</p>}
      </div>
    </>
  );
}
