"use client";

import { useEffect, useState } from "react";

import type { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileDropzone } from "@/features/content-shared/components/file-dropzone";
import { HashtagInput } from "@/features/content-shared/components/hashtag-input";
import { PlatformMultiSelect } from "@/features/content-shared/components/platform-multi-select";
import {
  ACCESS_STATUS_OPTIONS,
  CONTENT_TOPIC_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  FILE_COUNT_OPTIONS,
} from "@/features/content-shared/constants/content-options";
import { formatTopikLabel } from "@/features/content-shared/utils/content-formatters";

import { type BankContentFormValues, bankContentSchema } from "../schemas/bank-content.schema";

type DraftState = BankContentFormValues & {
  regional_terbatas_text: string;
};

type FormErrors = Partial<Record<keyof DraftState, string>>;

function createInitialState(): DraftState {
  return {
    judul: "",
    deskripsi: "",
    platform: [],
    jenis_konten: "foto_poster",
    topik: "",
    regional_asal: "",
    tahun_kampanye: new Date().getFullYear(),
    drive_link: "",
    jumlah_file: "1",
    status_akses: "publik",
    regional_terbatas: [],
    regional_terbatas_text: "",
    hashtags: [],
    thumbnail: null,
  };
}

function parseErrors(error: z.ZodError): FormErrors {
  const fieldErrors: FormErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string") {
      continue;
    }

    if (!fieldErrors[field as keyof DraftState]) {
      fieldErrors[field as keyof DraftState] = issue.message;
    }
  }

  return fieldErrors;
}

export function BankContentUploadDialog({
  open,
  onOpenChange,
  isSubmitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (payload: BankContentFormValues) => Promise<void>;
}) {
  const [draft, setDraft] = useState<DraftState>(createInitialState);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraft(createInitialState());
    setErrors({});
  }, [open]);

  const setFieldValue = <TKey extends keyof DraftState>(field: TKey, value: DraftState[TKey]) => {
    setDraft((previous) => ({ ...previous, [field]: value }));

    if (errors[field]) {
      setErrors((previous) => {
        const next = { ...previous };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Upload ke Bank Konten</DialogTitle>
          <DialogDescription>
            Simpan referensi konten agar dapat diakses kembali oleh konten kreator, PIC sosmed, dan reviewer sesuai
            level akses.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();

            const regionalTerbatas = draft.regional_terbatas_text
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean);

            const validation = bankContentSchema.safeParse({
              ...draft,
              regional_terbatas: regionalTerbatas,
            });

            if (!validation.success) {
              setErrors(parseErrors(validation.error));
              return;
            }

            await onSubmit(validation.data);
          }}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2">
              <Label>Judul</Label>
              <Input value={draft.judul} onChange={(event) => setFieldValue("judul", event.target.value)} />
              {errors.judul && <p className="text-destructive text-xs">{errors.judul}</p>}
            </div>

            <div className="grid gap-2">
              <Label>Regional Asal</Label>
              <Input
                value={draft.regional_asal}
                onChange={(event) => setFieldValue("regional_asal", event.target.value)}
              />
              {errors.regional_asal && <p className="text-destructive text-xs">{errors.regional_asal}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Deskripsi</Label>
            <Textarea
              value={draft.deskripsi ?? ""}
              className="min-h-24"
              maxLength={500}
              onChange={(event) => setFieldValue("deskripsi", event.target.value)}
            />
            {errors.deskripsi && <p className="text-destructive text-xs">{errors.deskripsi}</p>}
          </div>

          <div className="grid gap-2">
            <Label>Platform</Label>
            <PlatformMultiSelect value={draft.platform} onChange={(value) => setFieldValue("platform", value)} />
            {errors.platform && <p className="text-destructive text-xs">{errors.platform}</p>}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label>Jenis Konten</Label>
              <Select
                value={draft.jenis_konten}
                onValueChange={(value) => setFieldValue("jenis_konten", value as DraftState["jenis_konten"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Topik</Label>
              <Select value={draft.topik} onValueChange={(value) => setFieldValue("topik", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih topik" />
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

            <div className="grid gap-2">
              <Label>Tahun Kampanye</Label>
              <Input
                type="number"
                value={draft.tahun_kampanye}
                onChange={(event) => setFieldValue("tahun_kampanye", Number(event.target.value))}
              />
              {errors.tahun_kampanye && <p className="text-destructive text-xs">{errors.tahun_kampanye}</p>}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="grid gap-2 lg:col-span-2">
              <Label>Link Google Drive</Label>
              <Input value={draft.drive_link} onChange={(event) => setFieldValue("drive_link", event.target.value)} />
              {errors.drive_link && <p className="text-destructive text-xs">{errors.drive_link}</p>}
            </div>

            <div className="grid gap-2">
              <Label>Jumlah File</Label>
              <Select
                value={draft.jumlah_file}
                onValueChange={(value) => setFieldValue("jumlah_file", value as DraftState["jumlah_file"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_COUNT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2">
              <Label>Status Akses</Label>
              <Select
                value={draft.status_akses}
                onValueChange={(value) => setFieldValue("status_akses", value as DraftState["status_akses"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {draft.status_akses === "terbatas" && (
              <div className="grid gap-2">
                <Label>Regional Terbatas</Label>
                <Input
                  placeholder="Pisahkan dengan koma, contoh: Jawa Barat, Bali"
                  value={draft.regional_terbatas_text}
                  onChange={(event) => setFieldValue("regional_terbatas_text", event.target.value)}
                />
                {errors.regional_terbatas && <p className="text-destructive text-xs">{errors.regional_terbatas}</p>}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Hashtag</Label>
            <HashtagInput value={draft.hashtags} onChange={(value) => setFieldValue("hashtags", value)} />
          </div>

          <div className="grid gap-2">
            <Label>Thumbnail</Label>
            <FileDropzone
              value={draft.thumbnail ?? null}
              onChange={(value) => setFieldValue("thumbnail", value)}
              description="JPG, PNG, WebP - maksimal 2MB"
            />
            {errors.thumbnail && <p className="text-destructive text-xs">{errors.thumbnail}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Upload Konten
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
