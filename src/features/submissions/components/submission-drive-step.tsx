"use client";

import { AlertTriangle, FolderKanban, Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import type { ValidateDriveLinkResponse } from "../types/content-submission.type";
import type { ContentSubmissionDraft, FormErrorState } from "./content-submission-form.types";

interface SubmissionDriveStepProps {
  draft: ContentSubmissionDraft;
  errors: FormErrorState;
  driveValidation: ValidateDriveLinkResponse | null;
  isValidatingDrive: boolean;
  onFieldChange: <TKey extends keyof ContentSubmissionDraft>(field: TKey, value: ContentSubmissionDraft[TKey]) => void;
  onValidateDrive: () => void;
}

export function SubmissionDriveStep({
  draft,
  errors,
  driveValidation,
  isValidatingDrive,
  onFieldChange,
  onValidateDrive,
}: SubmissionDriveStepProps) {
  return (
    <>
      <Alert className="border-sky-200 bg-sky-50 text-sky-900">
        <Info className="size-4" />
        <AlertTitle>Panduan sharing Google Drive</AlertTitle>
        <AlertDescription>
          Pastikan file diatur ke <strong>Anyone with the link - Viewer</strong>. File bisa berupa Google Docs, Sheets,
          Slides, gambar, video, atau folder. Tombol validasi hanya untuk pengecekan tambahan dan tidak wajib untuk
          lanjut ke step berikutnya.
        </AlertDescription>
      </Alert>

      <div className="grid gap-3">
        <Label htmlFor="drive-link">Link Google Drive</Label>
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            id="drive-link"
            value={draft.drive_link}
            placeholder="https://drive.google.com/..."
            onChange={(event) => onFieldChange("drive_link", event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={onValidateDrive}
            disabled={isValidatingDrive || !draft.drive_link.trim()}
          >
            {isValidatingDrive && <Spinner className="mr-2" />}
            Validasi Link
          </Button>
        </div>
        {errors.drive_link && <p className="text-destructive text-xs">{errors.drive_link}</p>}
      </div>

      {driveValidation && (
        <Alert
          className={cn(
            "border",
            driveValidation.is_valid && driveValidation.is_accessible
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-900",
          )}
        >
          {driveValidation.is_valid && driveValidation.is_accessible ? (
            <FolderKanban className="size-4" />
          ) : (
            <AlertTriangle className="size-4" />
          )}
          <AlertTitle>
            {driveValidation.is_valid && driveValidation.is_accessible
              ? "Link valid dan dapat diakses"
              : "Link perlu diperbaiki"}
          </AlertTitle>
          <AlertDescription>
            {driveValidation.file_name ? `${driveValidation.file_name} • ` : ""}
            {driveValidation.file_type ? `${driveValidation.file_type}. ` : ""}
            {driveValidation.error_reason ?? "File siap dipakai untuk proses review."}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
