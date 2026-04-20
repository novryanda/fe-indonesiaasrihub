"use client";

import { useEffect, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HashtagInput } from "@/features/content-shared/components/hashtag-input";
import { DURATION_OPTIONS } from "@/features/content-shared/constants/content-options";
import { cn } from "@/lib/utils";
import { listWilayahOptions, type WilayahOption } from "@/shared/api/wilayah";

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
  const [wilayahOptions, setWilayahOptions] = useState<WilayahOption[]>([]);

  useEffect(() => {
    void listWilayahOptions()
      .then(setWilayahOptions)
      .catch(() => setWilayahOptions([]));
  }, []);

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

      <div className="grid gap-4">
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
      </div>

      <div className="grid gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Cakupan Visibilitas</Label>
            <Select
              value={draft.visibility_scope}
              onValueChange={(value) =>
                onFieldChange("visibility_scope", value as ContentSubmissionDraft["visibility_scope"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih cakupan visibilitas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="national">Nasional</SelectItem>
                <SelectItem value="targeted_regions">Wilayah Tertentu</SelectItem>
                <SelectItem value="internal_only">Internal Saja</SelectItem>
              </SelectContent>
            </Select>
            {errors.visibility_scope && <p className="text-destructive text-xs">{errors.visibility_scope}</p>}
          </div>

          <div className="grid gap-2">
            <Label>Cakupan Penugasan</Label>
            <Select
              value={draft.assignment_scope}
              onValueChange={(value) =>
                onFieldChange("assignment_scope", value as ContentSubmissionDraft["assignment_scope"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih cakupan penugasan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa Penugasan</SelectItem>
                <SelectItem value="national">Nasional</SelectItem>
                <SelectItem value="targeted_regions">Wilayah Tertentu</SelectItem>
              </SelectContent>
            </Select>
            {errors.assignment_scope && <p className="text-destructive text-xs">{errors.assignment_scope}</p>}
          </div>
        </div>

        {draft.visibility_scope === "targeted_regions" && (
          <div className="grid gap-3">
            <Label>Target Wilayah Visibilitas</Label>
            <div className="grid gap-3 rounded-2xl border border-border/70 bg-background p-4 sm:grid-cols-2">
              {wilayahOptions.map((wilayah) => {
                const selected = draft.visibility_target_wilayah_ids.includes(wilayah.id);

                return (
                  <div
                    key={`visibility-${wilayah.id}`}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border px-3 py-3 transition",
                      selected
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-border/70 bg-background hover:border-primary/30 hover:bg-primary/5",
                    )}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked: boolean | "indeterminate") =>
                        onFieldChange(
                          "visibility_target_wilayah_ids",
                          checked === true
                            ? [...draft.visibility_target_wilayah_ids, wilayah.id]
                            : draft.visibility_target_wilayah_ids.filter((item) => item !== wilayah.id),
                        )
                      }
                    />
                    <span className="font-medium text-sm leading-5">
                      {wilayah.nama} ({wilayah.kode})
                    </span>
                  </div>
                );
              })}
            </div>
            {errors.visibility_target_wilayah_ids && (
              <p className="text-destructive text-xs">{errors.visibility_target_wilayah_ids}</p>
            )}
          </div>
        )}

        {draft.assignment_scope === "targeted_regions" && (
          <div className="grid gap-3">
            <Label>Target Wilayah Penugasan</Label>
            <div className="grid gap-3 rounded-2xl border border-border/70 bg-background p-4 sm:grid-cols-2">
              {wilayahOptions.map((wilayah) => {
                const selected = draft.assignment_target_wilayah_ids.includes(wilayah.id);

                return (
                  <div
                    key={`assignment-${wilayah.id}`}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border px-3 py-3 transition",
                      selected
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-border/70 bg-background hover:border-primary/30 hover:bg-primary/5",
                    )}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked: boolean | "indeterminate") =>
                        onFieldChange(
                          "assignment_target_wilayah_ids",
                          checked === true
                            ? [...draft.assignment_target_wilayah_ids, wilayah.id]
                            : draft.assignment_target_wilayah_ids.filter((item) => item !== wilayah.id),
                        )
                      }
                    />
                    <span className="font-medium text-sm leading-5">
                      {wilayah.nama} ({wilayah.kode})
                    </span>
                  </div>
                );
              })}
            </div>
            {errors.assignment_target_wilayah_ids && (
              <p className="text-destructive text-xs">{errors.assignment_target_wilayah_ids}</p>
            )}
          </div>
        )}
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
