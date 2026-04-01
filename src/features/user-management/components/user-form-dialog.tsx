"use client";

import { useEffect, useMemo, useState } from "react";

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
import { Spinner } from "@/components/ui/spinner";
import { normalizeIndonesianPhoneNumber } from "@/lib/phone-number";
import { listWilayahOptions, type WilayahOption } from "@/shared/api/wilayah";

import {
  type CreateUserFormValues,
  createUserSchema,
  type UpdateUserFormValues,
  updateUserSchema,
} from "../schemas/user.schema";
import type { UserItem } from "../types/user-management.type";

type FormMode = "create" | "edit";

interface UserFormDialogProps {
  mode: FormMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValue?: UserItem | null;
  allowedRoles: UserItem["role"][];
  isSubmitting: boolean;
  onSubmit: (value: CreateUserFormValues | UpdateUserFormValues) => Promise<void>;
}

type FormDraft = {
  name: string;
  username: string;
  email: string;
  phone_number: string;
  role: UserItem["role"];
  wilayah_id: string;
  password: string;
  status: UserItem["status"];
};

type FormErrorState = Partial<Record<keyof FormDraft, string>>;

function createInitialDraft(mode: FormMode, allowedRoles: UserItem["role"][], user?: UserItem | null): FormDraft {
  if (mode === "edit" && user) {
    return {
      name: user.name,
      username: user.username ?? "",
      email: user.email,
      phone_number: user.phone_number ?? "",
      role: user.role,
      wilayah_id: user.wilayah_id ?? "",
      password: "",
      status: user.status,
    };
  }

  return {
    name: "",
    username: "",
    email: "",
    phone_number: "",
    role: allowedRoles[0] ?? "wcc",
    wilayah_id: "",
    password: "",
    status: "aktif",
  };
}

function parseErrors(error: { issues: Array<{ path: Array<string | number>; message: string }> }): FormErrorState {
  const fieldErrors: FormErrorState = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string") {
      continue;
    }

    if (!fieldErrors[field as keyof FormDraft]) {
      fieldErrors[field as keyof FormDraft] = issue.message;
    }
  }

  return fieldErrors;
}

export function UserFormDialog({
  mode,
  open,
  onOpenChange,
  defaultValue,
  allowedRoles,
  isSubmitting,
  onSubmit,
}: UserFormDialogProps) {
  const [draft, setDraft] = useState<FormDraft>(createInitialDraft(mode, allowedRoles, defaultValue));
  const [errors, setErrors] = useState<FormErrorState>({});
  const [wilayahOptions, setWilayahOptions] = useState<WilayahOption[]>([]);
  const [isLoadingWilayah, setIsLoadingWilayah] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraft(createInitialDraft(mode, allowedRoles, defaultValue));
    setErrors({});
  }, [open, mode, defaultValue, allowedRoles]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setIsLoadingWilayah(true);

    void listWilayahOptions()
      .then((options) => {
        if (!cancelled) {
          setWilayahOptions(options);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingWilayah(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const dialogTitle = useMemo(() => {
    if (mode === "create") {
      return "Tambah User";
    }

    return `Edit User: ${defaultValue?.name ?? "-"}`;
  }, [mode, defaultValue?.name]);

  const dialogDescription =
    mode === "create"
      ? "Buat user baru sesuai kontrak backend."
      : "Perbarui informasi user, termasuk role, wilayah, dan status.";

  const handleFieldChange = <TKey extends keyof FormDraft>(field: TKey, value: FormDraft[TKey]) => {
    setDraft((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((previous) => {
        const next = { ...previous };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload =
      mode === "create"
        ? {
            name: draft.name,
            username: draft.username,
            email: draft.email,
            phone_number: draft.phone_number,
            role: draft.role,
            wilayah_id: draft.wilayah_id,
            password: draft.password,
          }
        : {
            name: draft.name,
            username: draft.username,
            phone_number: draft.phone_number,
            role: draft.role,
            wilayah_id: draft.wilayah_id,
            status: draft.status,
          };

    const validation = mode === "create" ? createUserSchema.safeParse(payload) : updateUserSchema.safeParse(payload);

    if (!validation.success) {
      setErrors(parseErrors(validation.error));
      return;
    }

    await onSubmit(validation.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="user-name">Nama</Label>
            <Input
              id="user-name"
              value={draft.name}
              onChange={(event) => handleFieldChange("name", event.target.value)}
              placeholder="Nama lengkap"
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user-username">Username</Label>
            <Input
              id="user-username"
              value={draft.username}
              onChange={(event) => handleFieldChange("username", event.target.value)}
              placeholder="username.login"
            />
            {errors.username && <p className="text-destructive text-xs">{errors.username}</p>}
          </div>

          {mode === "create" ? (
            <div className="grid gap-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={draft.email}
                onChange={(event) => handleFieldChange("email", event.target.value)}
                placeholder="nama@contoh.com"
              />
              {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
            </div>
          ) : (
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={draft.email} disabled />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="user-phone-number">Nomor HP</Label>
            <Input
              id="user-phone-number"
              value={draft.phone_number}
              onChange={(event) => handleFieldChange("phone_number", event.target.value)}
              onBlur={(event) => handleFieldChange("phone_number", normalizeIndonesianPhoneNumber(event.target.value) ?? "")}
              placeholder="+6281234567890"
            />
            {errors.phone_number && <p className="text-destructive text-xs">{errors.phone_number}</p>}
          </div>

          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={draft.role} onValueChange={(value) => handleFieldChange("role", value as UserItem["role"])}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                {allowedRoles.includes("superadmin") ? <SelectItem value="superadmin">Superadmin</SelectItem> : null}
                {allowedRoles.includes("sysadmin") ? <SelectItem value="sysadmin">Sysadmin</SelectItem> : null}
                {allowedRoles.includes("qcc_wcc") ? <SelectItem value="qcc_wcc">QCC/WCC</SelectItem> : null}
                {allowedRoles.includes("wcc") ? <SelectItem value="wcc">WCC</SelectItem> : null}
                {allowedRoles.includes("pic_sosmed") ? <SelectItem value="pic_sosmed">PIC Sosmed</SelectItem> : null}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-destructive text-xs">{errors.role}</p>}
          </div>

          <div className="grid gap-2">
            <Label>Wilayah</Label>
            <Select
              value={draft.wilayah_id || "__none__"}
              onValueChange={(value) => handleFieldChange("wilayah_id", value === "__none__" ? "" : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoadingWilayah ? "Memuat wilayah..." : "Pilih wilayah"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Tanpa wilayah</SelectItem>
                {wilayahOptions.map((wilayah) => (
                  <SelectItem key={wilayah.id} value={wilayah.id}>
                    {wilayah.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.wilayah_id && <p className="text-destructive text-xs">{errors.wilayah_id}</p>}
          </div>

          {mode === "create" ? (
            <div className="grid gap-2">
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                type="password"
                value={draft.password}
                onChange={(event) => handleFieldChange("password", event.target.value)}
                placeholder="Minimal 8 karakter"
              />
              {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
            </div>
          ) : (
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={draft.status}
                onValueChange={(value) => handleFieldChange("status", value as UserItem["status"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-destructive text-xs">{errors.status}</p>}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2" />}
              {mode === "create" ? "Simpan User" : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
