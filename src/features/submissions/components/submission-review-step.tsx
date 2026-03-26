"use client";

import { ClipboardCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  formatDate,
  formatDurasiLabel,
  formatJenisKontenLabel,
  formatJumlahFileLabel,
  formatTargetAudiensLabel,
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
  mode?: "create" | "resubmit";
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
        <AlertTitle>Periksa kembali sebelum submit</AlertTitle>
        <AlertDescription>
          {mode === "resubmit"
            ? "Setelah dikirim ulang, revisi akan langsung masuk kembali ke antrian final approval Superadmin."
            : "Setelah dikirim, konten akan langsung masuk ke antrian final approval Superadmin. Perubahan setelah submit hanya bisa dilakukan jika reviewer meminta revisi."}
        </AlertDescription>
      </Alert>

      <div className="rounded-3xl border bg-muted/20 p-4 md:p-5">
        <div className="space-y-4">
          <PreviewListRow label="Judul" value={draft.judul || "-"} />
          <PreviewListRow label="Platform" value={summaryPlatformLabels} />
          <PreviewListRow label="Jenis" value={formatJenisKontenLabel(draft.jenis_konten)} />
          <PreviewListRow label="Topik" value={formatTopikLabel(draft.topik)} />
          <PreviewListRow
            label="Tgl. Posting"
            value={draft.tanggal_posting ? formatDate(draft.tanggal_posting) : "-"}
          />
          <PreviewListRow label="Drive Link" value={draft.drive_link || "-"} />
          <PreviewListRow label="Jumlah File" value={formatJumlahFileLabel(draft.jumlah_file)} />
          <PreviewListRow label="Urgensi" value={formatUrgensiLabel(draft.urgensi)} />
          <PreviewListRow label="Durasi" value={formatDurasiLabel(draft.durasi_konten)} />
          <PreviewListRow label="Audiens" value={formatTargetAudiensLabel(draft.target_audiens)} />
        </div>
      </div>

      <div className="space-y-3">
        <p className="font-medium text-sm">Alur Persetujuan</p>
        <div className="flex flex-wrap gap-2">
          <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white">WCC</Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            Superadmin
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            Bank Konten
          </Badge>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border bg-background p-4">
        <Checkbox
          id="review-confirmation"
          checked={draft.review_confirmation}
          onCheckedChange={(checked) => onFieldChange("review_confirmation", checked === true)}
        />
        <Label htmlFor="review-confirmation" className="text-sm leading-6">
          Saya menyatakan konten ini sesuai dengan panduan komunikasi pemerintah, tidak mengandung informasi
          menyesatkan, dan telah memperoleh persetujuan internal sebelum dikirim.
        </Label>
      </div>
      {errors.review_confirmation && <p className="text-destructive text-xs">{errors.review_confirmation}</p>}
    </>
  );
}
