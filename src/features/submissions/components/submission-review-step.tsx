"use client";

import { ClipboardCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  composePostingTimeRange,
  formatDurasiLabel,
  formatJenisKontenLabel,
  formatPostingSchedule,
  formatTopikLabel,
  formatUrgensiLabel,
} from "@/features/content-shared/utils/content-formatters";

import type { ContentSubmissionDraft, FormErrorState } from "./content-submission-form.types";

function PreviewListRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

interface SubmissionReviewStepProps {
  draft: ContentSubmissionDraft;
  summaryPlatformLabels: string;
  errors: FormErrorState;
  mode?: "create" | "edit" | "resubmit";
  onFieldChange: <TKey extends keyof ContentSubmissionDraft>(field: TKey, value: ContentSubmissionDraft[TKey]) => void;
}

export function SubmissionReviewStep({
  draft,
  summaryPlatformLabels,
  errors,
  mode = "create",
  onFieldChange,
}: SubmissionReviewStepProps) {
  return (
    <>
      <Alert className="border-amber-200 bg-amber-50 text-amber-900">
        <ClipboardCheck className="size-4" />
        <AlertTitle>
          {mode === "edit" ? "Periksa kembali sebelum menyimpan" : "Periksa kembali sebelum submit"}
        </AlertTitle>
        <AlertDescription>
          {mode === "create"
            ? "Setelah dikirim, konten akan langsung masuk ke antrian final approval Superadmin. Selama belum disetujui, submission masih bisa diedit oleh WCC pengaju."
            : mode === "edit"
              ? "Setelah disimpan, konten tetap berada di antrian final approval Superadmin dan masih bisa diedit sampai disetujui."
              : "Setelah dikirim ulang, revisi akan langsung masuk kembali ke antrian final approval Superadmin."}
        </AlertDescription>
      </Alert>

      <div className="rounded-3xl border bg-muted/20 p-4 md:p-5">
        <div className="space-y-4">
          <PreviewListRow label="Judul" value={draft.judul || "-"} />
          <PreviewListRow label="Platform" value={summaryPlatformLabels} />
          <PreviewListRow label="Jenis" value={formatJenisKontenLabel(draft.jenis_konten)} />
          <PreviewListRow label="Topik" value={formatTopikLabel(draft.topik)} />
          <PreviewListRow
            label="Target Posting"
            value={formatPostingSchedule(
              draft.tanggal_posting,
              composePostingTimeRange(draft.jam_posting_mulai, draft.jam_posting_selesai),
            )}
          />
          <PreviewListRow label="Drive Link" value={draft.drive_link || "-"} />
          <PreviewListRow label="Urgensi" value={formatUrgensiLabel(draft.urgensi)} />
          <PreviewListRow label="Durasi" value={formatDurasiLabel(draft.durasi_konten)} />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border bg-background p-4">
        <Checkbox
          id="review-confirmation"
          checked={draft.review_confirmation}
          onCheckedChange={(checked) => onFieldChange("review_confirmation", checked === true)}
        />
        <Label htmlFor="review-confirmation" className="text-sm leading-6">
          apakah submit yang anda masukkan sudah sesuai.
        </Label>
      </div>
      {errors.review_confirmation && <p className="text-destructive text-xs">{errors.review_confirmation}</p>}
    </>
  );
}
