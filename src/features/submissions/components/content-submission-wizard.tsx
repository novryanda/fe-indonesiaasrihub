"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { ContentItem } from "@/features/content-shared/types/content.type";
import { formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";

import { useContentSubmission } from "../hooks/use-content-submission";
import {
  contentSubmissionDetailSchema,
  contentSubmissionDriveSchema,
  contentSubmissionInfoSchema,
  contentSubmissionSchema,
} from "../schemas/content-submission.schema";
import type { ValidateDriveLinkResponse } from "../types/content-submission.type";
import type { ContentSubmissionDraft, FormErrorState } from "./content-submission-form.types";
import { SubmissionDetailStep } from "./submission-detail-step";
import { SubmissionDriveStep } from "./submission-drive-step";
import { SubmissionInfoStep } from "./submission-info-step";
import { SubmissionReviewStep } from "./submission-review-step";
import { SubmissionSidebarSummary } from "./submission-sidebar-summary";
import { SubmissionStepper, WIZARD_STEPS, type WizardStep } from "./submission-stepper";

const CREATE_STORAGE_KEY = "asrihub.submit-konten.draft";

function createInitialDraft(): ContentSubmissionDraft {
  return {
    judul: "",
    platform: [],
    jenis_konten: "foto_poster",
    topik: "",
    tanggal_posting: "",
    drive_link: "",
    jumlah_file: "1",
    caption: "",
    hashtags: [],
    durasi_konten: null,
    target_audiens: [],
    urgensi: "normal",
    tipe: "baru",
    catatan_reviewer: "",
    thumbnail: null,
    review_confirmation: false,
  };
}

function createDraftFromContent(content: ContentItem): ContentSubmissionDraft {
  return {
    judul: content.judul,
    platform: content.platform,
    jenis_konten: content.jenis_konten,
    topik: content.topik,
    tanggal_posting: content.tanggal_posting,
    drive_link: content.drive_link,
    jumlah_file: content.jumlah_file,
    caption: content.caption ?? "",
    hashtags: content.hashtags ?? [],
    durasi_konten: content.durasi_konten ?? null,
    target_audiens: content.target_audiens ?? [],
    urgensi: content.urgensi,
    tipe: content.tipe,
    catatan_reviewer: "",
    thumbnail: null,
    review_confirmation: false,
  };
}

function getStorageKey(mode: "create" | "resubmit", contentId?: string) {
  if (mode === "resubmit" && contentId) {
    return `asrihub.submit-konten.resubmit.${contentId}`;
  }

  return CREATE_STORAGE_KEY;
}

function parseErrors(error: z.ZodError): FormErrorState {
  const fieldErrors: FormErrorState = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string") {
      continue;
    }

    if (!fieldErrors[field as keyof ContentSubmissionDraft]) {
      fieldErrors[field as keyof ContentSubmissionDraft] = issue.message;
    }
  }

  return fieldErrors;
}

interface ContentSubmissionWizardProps {
  accessToken?: string;
  mode?: "create" | "resubmit";
  contentId?: string;
  initialContent?: ContentItem | null;
}

export function ContentSubmissionWizard({
  accessToken,
  mode = "create",
  contentId,
  initialContent,
}: ContentSubmissionWizardProps) {
  const router = useRouter();
  const { submitContent, submitResubmission, runDriveValidation, isSubmitting, isValidatingDrive } =
    useContentSubmission(accessToken);
  const isResubmitMode = mode === "resubmit" && Boolean(contentId);
  const storageKey = useMemo(() => getStorageKey(mode, contentId), [contentId, mode]);

  const [step, setStep] = useState<WizardStep>(1);
  const [draft, setDraft] = useState<ContentSubmissionDraft>(createInitialDraft);
  const [errors, setErrors] = useState<FormErrorState>({});
  const [driveValidation, setDriveValidation] = useState<ValidateDriveLinkResponse | null>(null);
  const [successState, setSuccessState] = useState<{ submissionCode?: string; message: string } | null>(null);

  useEffect(() => {
    if (isResubmitMode && !initialContent) {
      return;
    }

    const baseDraft = isResubmitMode && initialContent ? createDraftFromContent(initialContent) : createInitialDraft();
    const rawDraft = window.localStorage.getItem(storageKey);

    if (!rawDraft) {
      setDraft(baseDraft);
      setErrors({});
      setDriveValidation(null);
      setStep(1);
      return;
    }

    try {
      const parsed = JSON.parse(rawDraft) as Partial<ContentSubmissionDraft>;
      setDraft({
        ...baseDraft,
        ...parsed,
        target_audiens: Array.isArray(parsed.target_audiens) ? parsed.target_audiens : baseDraft.target_audiens,
        thumbnail: null,
        review_confirmation: false,
      });
    } catch {
      window.localStorage.removeItem(storageKey);
      setDraft(baseDraft);
    }

    setErrors({});
    setDriveValidation(null);
    setStep(1);
  }, [initialContent, isResubmitMode, storageKey]);

  const summaryPlatformLabels = useMemo(
    () =>
      draft.platform.length > 0 ? draft.platform.map((platform) => formatPlatformLabel(platform)).join(", ") : "-",
    [draft.platform],
  );

  const setFieldValue = <TKey extends keyof ContentSubmissionDraft>(
    field: TKey,
    value: ContentSubmissionDraft[TKey],
  ) => {
    setDraft((previous) => ({ ...previous, [field]: value }));

    setErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }

      const next = { ...previous };
      delete next[field];
      return next;
    });

    if (field === "drive_link") {
      setDriveValidation(null);
    }
  };

  const validateCurrentStep = () => {
    if (step === 1) {
      const result = contentSubmissionInfoSchema.safeParse(draft);
      if (!result.success) {
        setErrors((previous) => ({ ...previous, ...parseErrors(result.error) }));
        return false;
      }
      return true;
    }

    if (step === 2) {
      const result = contentSubmissionDriveSchema.safeParse(draft);
      if (!result.success) {
        setErrors((previous) => ({ ...previous, ...parseErrors(result.error) }));
        return false;
      }

      return true;
    }

    if (step === 3) {
      const result = contentSubmissionDetailSchema.safeParse(draft);
      if (!result.success) {
        setErrors((previous) => ({ ...previous, ...parseErrors(result.error) }));
        return false;
      }
      return true;
    }

    if (!draft.review_confirmation) {
      setErrors((previous) => ({
        ...previous,
        review_confirmation: "Anda perlu menyetujui pernyataan sebelum submit.",
      }));
      return false;
    }

    const finalResult = contentSubmissionSchema.safeParse({
      ...draft,
      catatan_reviewer: draft.catatan_reviewer?.trim() ? draft.catatan_reviewer : null,
    });

    if (!finalResult.success) {
      setErrors((previous) => ({ ...previous, ...parseErrors(finalResult.error) }));
      return false;
    }

    return true;
  };

  const handleValidateDrive = async () => {
    const result = contentSubmissionDriveSchema.safeParse(draft);
    if (!result.success) {
      setErrors((previous) => ({ ...previous, ...parseErrors(result.error) }));
      return;
    }

    try {
      const validationResult = await runDriveValidation(draft.drive_link.trim());
      setDriveValidation(validationResult);

      if (validationResult.is_valid && validationResult.is_accessible) {
        toast.success("Link Google Drive valid dan dapat diakses.");
        return;
      }

      toast.error(validationResult.error_reason ?? "Link Google Drive belum memenuhi syarat akses publik.");
    } catch (errorValue) {
      toast(
        errorValue instanceof Error
          ? `${errorValue.message}. Anda tetap bisa lanjut tanpa validasi.`
          : "Validasi drive belum tersedia. Anda tetap bisa lanjut tanpa validasi.",
      );
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    try {
      if (isResubmitMode && contentId) {
        const result = await submitResubmission(contentId, {
          ...draft,
          judul: draft.judul.trim(),
          topik: draft.topik.trim(),
          drive_link: draft.drive_link.trim(),
          caption: draft.caption.trim(),
          hashtags: draft.hashtags,
          catatan_reviewer: draft.catatan_reviewer?.trim() ? draft.catatan_reviewer.trim() : null,
        });

        window.localStorage.removeItem(storageKey);
        setSuccessState({
          submissionCode: initialContent?.submission_code,
          message: result.message,
        });
        setDraft(initialContent ? createDraftFromContent(initialContent) : createInitialDraft());
        setStep(1);
        setDriveValidation(null);
        setErrors({});
        toast.success("Konten berhasil dikirim ulang untuk final approval.");
        return;
      }

      const result = await submitContent({
        ...draft,
        catatan_reviewer: draft.catatan_reviewer?.trim() ? draft.catatan_reviewer.trim() : null,
      });

      window.localStorage.removeItem(storageKey);
      setSuccessState({
        submissionCode: result.submission_code,
        message: result.message,
      });
      setDraft(createInitialDraft());
      setStep(1);
      setDriveValidation(null);
      setErrors({});
      toast.success("Konten berhasil dikirim untuk final approval.");
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal mengirim konten");
    }
  };

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <Card className="overflow-hidden border-emerald-100 bg-linear-to-br from-emerald-50 via-background to-amber-50">
            <CardContent className="space-y-8 px-6 py-8 md:px-8">
              <div className="space-y-4">
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-200 bg-white/70 px-3 py-1 text-emerald-700"
                >
                  {isResubmitMode ? "WCC / Resubmit Konten" : "WCC / Submit Konten Baru"}
                </Badge>
                <div className="space-y-2">
                  <h1 className="font-semibold text-3xl tracking-tight">
                    {isResubmitMode ? "Perbaiki dan Kirim Ulang Konten" : "Submit Konten Baru"}
                  </h1>
                  <p className="max-w-2xl text-muted-foreground text-sm leading-6">
                    {isResubmitMode
                      ? "Gunakan kembali wizard ini untuk menindaklanjuti catatan reviewer. Semua field dapat diperbarui sebelum dikirim ulang ke final approval."
                      : "Rancang konten dari brief sampai siap final approval. Wizard ini mengikuti kontrak API WCC dan menyimpan draft lokal."}
                  </p>
                </div>
              </div>

              <SubmissionStepper step={step} />
            </CardContent>
          </Card>

          {isResubmitMode && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900">
              <AlertCircle className="size-4" />
              <AlertTitle>Resubmit harus lewat wizard penuh</AlertTitle>
              <AlertDescription>
                Submission ini dibuka ulang dalam mode edit penuh. Sesuaikan brief, aset, dan detail konten sebelum
                dikirim ulang ke final approval.
              </AlertDescription>
            </Alert>
          )}

          {isResubmitMode && initialContent?.catatan_reviewer && (
            <Alert className="border-amber-200 bg-amber-50/70 text-amber-900">
              <AlertCircle className="size-4" />
              <AlertTitle>Catatan reviewer terakhir</AlertTitle>
              <AlertDescription>{initialContent.catatan_reviewer}</AlertDescription>
            </Alert>
          )}

          <Card className="border-foreground/10 shadow-sm">
            <CardHeader className="border-border/60 border-b">
              <CardTitle>
                Step {step} - {WIZARD_STEPS[step - 1]?.title}
              </CardTitle>
              <CardDescription>{WIZARD_STEPS[step - 1]?.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 py-6">
              {step === 1 && <SubmissionInfoStep draft={draft} errors={errors} onFieldChange={setFieldValue} />}
              {step === 2 && (
                <SubmissionDriveStep
                  draft={draft}
                  errors={errors}
                  driveValidation={driveValidation}
                  isValidatingDrive={isValidatingDrive}
                  onFieldChange={setFieldValue}
                  onValidateDrive={handleValidateDrive}
                />
              )}
              {step === 3 && <SubmissionDetailStep draft={draft} errors={errors} onFieldChange={setFieldValue} />}
              {step === 4 && (
                <SubmissionReviewStep
                  draft={draft}
                  summaryPlatformLabels={summaryPlatformLabels}
                  errors={errors}
                  mode={mode}
                  onFieldChange={setFieldValue}
                />
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 border-border/60 border-t pt-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((previous) => Math.max(1, previous - 1) as WizardStep)}
                disabled={step === 1 || isSubmitting}
              >
                <ArrowLeft className="mr-2 size-4" />
                Kembali
              </Button>
              {step === 4 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    window.localStorage.setItem(
                      storageKey,
                      JSON.stringify({ ...draft, thumbnail: null, review_confirmation: false }),
                    );
                    toast.success("Draft lokal berhasil disimpan di browser ini.");
                  }}
                  disabled={isSubmitting}
                >
                  Simpan Draft
                </Button>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
              <p className="text-muted-foreground text-sm">
                Langkah {step} dari {WIZARD_STEPS.length}
              </p>

              {step < 4 ? (
                <Button
                  type="button"
                  onClick={() =>
                    validateCurrentStep() && setStep((previous) => Math.min(4, previous + 1) as WizardStep)
                  }
                >
                  Lanjut
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && <Spinner className="mr-2" />}
                  {isResubmitMode ? "Kirim Ulang untuk Final Approval" : "Submit untuk Final Approval"}
                  {!isSubmitting && <ArrowRight className="ml-2 size-4" />}
                </Button>
              )}
            </div>
          </div>
        </section>

        <SubmissionSidebarSummary
          step={step}
          judul={draft.judul}
          platform={draft.platform}
          jenisKonten={draft.jenis_konten}
          tanggalPosting={draft.tanggal_posting}
          urgensi={draft.urgensi}
          hashtagCount={draft.hashtags.length}
          jumlahFile={draft.jumlah_file}
        />
      </div>

      <Dialog open={Boolean(successState)} onOpenChange={(open) => !open && setSuccessState(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isResubmitMode ? "Konten berhasil dikirim ulang" : "Konten berhasil dikirim"}</DialogTitle>
            <DialogDescription>
              {isResubmitMode
                ? "Revisi langsung masuk kembali ke antrian final approval Superadmin."
                : "Submission langsung masuk ke antrian final approval Superadmin."}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Kode Submission</p>
            <p className="mt-2 font-semibold text-lg">{successState?.submissionCode ?? "-"}</p>
            <p className="mt-3 text-muted-foreground">{successState?.message}</p>
          </div>

          <DialogFooter>
            {isResubmitMode ? (
              <>
                <Button type="button" variant="outline" onClick={() => setSuccessState(null)}>
                  Tutup
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setSuccessState(null);
                    router.push("/dashboard/konten-saya");
                  }}
                >
                  Kembali ke Konten Saya
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setSuccessState(null)}>
                  Tutup
                </Button>
                <Button type="button" onClick={() => setSuccessState(null)}>
                  Buat Konten Lagi
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
