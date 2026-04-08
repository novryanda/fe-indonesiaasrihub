"use client";

import { useEffect, useMemo, useState } from "react";

import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { HashtagInput } from "@/features/content-shared/components/hashtag-input";
import { PlatformMultiSelect } from "@/features/content-shared/components/platform-multi-select";
import { CONTENT_TOPIC_OPTIONS, CONTENT_TYPE_OPTIONS } from "@/features/content-shared/constants/content-options";
import { formatTopikLabel } from "@/features/content-shared/utils/content-formatters";
import { listWilayahOptions, type WilayahOption } from "@/shared/api/wilayah";

import { type BankContentFormValues, bankContentSchema } from "../schemas/bank-content.schema";

type DraftState = BankContentFormValues;
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
    visibility_scope: "national",
    assignment_scope: "none",
    visibility_target_wilayah_ids: [],
    assignment_target_wilayah_ids: [],
    hashtags: [],
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
  const [wilayahOptions, setWilayahOptions] = useState<WilayahOption[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraft(createInitialState());
    setErrors({});
    void listWilayahOptions()
      .then(setWilayahOptions)
      .catch(() => setWilayahOptions([]));
  }, [open]);

  const wilayahList = useMemo(
    () =>
      wilayahOptions.map((wilayah) => ({
        id: wilayah.id,
        label: `${wilayah.nama} (${wilayah.kode})`,
      })),
    [wilayahOptions],
  );

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

  const toggleArrayValue = (
    field: "visibility_target_wilayah_ids" | "assignment_target_wilayah_ids",
    wilayahId: string,
    checked: boolean,
  ) => {
    setFieldValue(field, checked ? [...draft[field], wilayahId] : draft[field].filter((item) => item !== wilayahId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Upload ke Bank Konten</DialogTitle>
          <DialogDescription>
            Simpan konten final ke bank konten, atur visibilitas, dan target penugasan secara langsung.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();

            const validation = bankContentSchema.safeParse(draft);

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
              <Label>Wilayah Asal</Label>
              <Select value={draft.regional_asal} onValueChange={(value) => setFieldValue("regional_asal", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih wilayah asal" />
                </SelectTrigger>
                <SelectContent>
                  {wilayahList.map((wilayah) => (
                    <SelectItem key={wilayah.id} value={wilayah.id}>
                      {wilayah.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="grid gap-2">
            <div className="grid gap-2">
              <Label>Link Google Drive</Label>
              <Input value={draft.drive_link} onChange={(event) => setFieldValue("drive_link", event.target.value)} />
              {errors.drive_link && <p className="text-destructive text-xs">{errors.drive_link}</p>}
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl border p-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-2">
                <Label>Cakupan Visibilitas</Label>
                <Select
                  value={draft.visibility_scope}
                  onValueChange={(value) => setFieldValue("visibility_scope", value as DraftState["visibility_scope"])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national">Nasional</SelectItem>
                    <SelectItem value="targeted_regions">Wilayah Tertentu</SelectItem>
                    <SelectItem value="internal_only">Internal Saja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Cakupan Penugasan</Label>
                <Select
                  value={draft.assignment_scope}
                  onValueChange={(value) => setFieldValue("assignment_scope", value as DraftState["assignment_scope"])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa Penugasan</SelectItem>
                    <SelectItem value="national">Nasional</SelectItem>
                    <SelectItem value="targeted_regions">Wilayah Tertentu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {draft.visibility_scope === "targeted_regions" && (
              <div className="grid gap-2">
                <Label>Target Wilayah Visibilitas</Label>
                <div className="grid max-h-48 gap-2 overflow-y-auto rounded-xl border p-3">
                  {wilayahList.map((wilayah) => (
                    <div key={`visibility-${wilayah.id}`} className="flex items-center gap-3 text-sm">
                      <Checkbox
                        id={`visibility-${wilayah.id}`}
                        checked={draft.visibility_target_wilayah_ids.includes(wilayah.id)}
                        onCheckedChange={(checked) =>
                          toggleArrayValue("visibility_target_wilayah_ids", wilayah.id, checked === true)
                        }
                      />
                      <label htmlFor={`visibility-${wilayah.id}`}>{wilayah.label}</label>
                    </div>
                  ))}
                </div>
                {errors.visibility_target_wilayah_ids && (
                  <p className="text-destructive text-xs">{errors.visibility_target_wilayah_ids}</p>
                )}
              </div>
            )}

            {draft.assignment_scope === "targeted_regions" && (
              <div className="grid gap-2">
                <Label>Target Wilayah Penugasan</Label>
                <div className="grid max-h-48 gap-2 overflow-y-auto rounded-xl border p-3">
                  {wilayahList.map((wilayah) => (
                    <div key={`assignment-${wilayah.id}`} className="flex items-center gap-3 text-sm">
                      <Checkbox
                        id={`assignment-${wilayah.id}`}
                        checked={draft.assignment_target_wilayah_ids.includes(wilayah.id)}
                        onCheckedChange={(checked) =>
                          toggleArrayValue("assignment_target_wilayah_ids", wilayah.id, checked === true)
                        }
                      />
                      <label htmlFor={`assignment-${wilayah.id}`}>{wilayah.label}</label>
                    </div>
                  ))}
                </div>
                {errors.assignment_target_wilayah_ids && (
                  <p className="text-destructive text-xs">{errors.assignment_target_wilayah_ids}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Hashtag</Label>
            <HashtagInput value={draft.hashtags} onChange={(value) => setFieldValue("hashtags", value)} />
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
