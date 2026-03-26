"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlatformMultiSelect } from "@/features/content-shared/components/platform-multi-select";
import { CONTENT_TOPIC_OPTIONS, CONTENT_TYPE_OPTIONS } from "@/features/content-shared/constants/content-options";
import { formatTopikLabel } from "@/features/content-shared/utils/content-formatters";

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

      <div className="grid gap-2 md:max-w-sm">
        <Label htmlFor="tanggal-posting">Rencana Tanggal Posting</Label>
        <Input
          id="tanggal-posting"
          type="date"
          value={draft.tanggal_posting}
          disabled={disabled}
          onChange={(event) => onFieldChange("tanggal_posting", event.target.value)}
        />
        {errors.tanggal_posting && <p className="text-destructive text-xs">{errors.tanggal_posting}</p>}
      </div>
    </>
  );
}
