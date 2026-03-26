"use client";

import { useCallback, useEffect, useState } from "react";

import { Globe, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { formatPlatformLabel, formatTimeAgo } from "@/features/content-shared/utils/content-formatters";
import { cn } from "@/lib/utils";
import { listWilayahOptions, type WilayahOption } from "@/shared/api/wilayah";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import {
  createSocialAccount,
  deleteSocialAccount,
  listSocialAccounts,
  updateSocialAccount,
} from "../api/social-accounts-api";
import type {
  CreateSocialAccountPayload,
  SocialAccountItem,
  UpdateSocialAccountPayload,
} from "../types/social-account.type";

const PLATFORM_OPTIONS = ["instagram", "tiktok", "youtube", "facebook", "x"] as const;
const ACCOUNT_TYPE_OPTIONS = [
  { value: "government", label: "Government" },
  { value: "bisnis", label: "Bisnis" },
  { value: "personal", label: "Personal" },
] as const;

function getVerificationBadge(status: SocialAccountItem["verification_status"]) {
  switch (status) {
    case "verified":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getDelegationBadge(status: SocialAccountItem["delegation_status"]) {
  switch (status) {
    case "sudah_didelegasikan":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "delegasi_dicabut":
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
    default:
      return "border-orange-200 bg-orange-50 text-orange-700";
  }
}

type SocialAccountFormState = Omit<CreateSocialAccountPayload, "screenshot"> & { screenshot: File | null };

const initialForm: SocialAccountFormState = {
  wilayah: "",
  platform: "instagram",
  username: "",
  profile_url: "",
  nama_profil: "",
  tipe_akun: "government",
  followers: 0,
  deskripsi: "",
  screenshot: null,
};

export function SocialAccountDirectoryView() {
  const { isAuthorized, isPending } = useRoleGuard(["superadmin"]);
  const [items, setItems] = useState<SocialAccountItem[]>([]);
  const [wilayahOptions, setWilayahOptions] = useState<WilayahOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SocialAccountItem | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<SocialAccountItem | null>(null);
  const [form, setForm] = useState(initialForm);

  const resetFormState = () => {
    setForm(initialForm);
    setEditingAccount(null);
  };

  const openCreateDialog = () => {
    resetFormState();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: SocialAccountItem) => {
    setEditingAccount(item);
    setForm({
      wilayah: item.wilayah_id,
      platform: item.platform,
      username: item.username.replace(/^@/, ""),
      profile_url: item.profile_url,
      nama_profil: item.nama_profil,
      tipe_akun: item.tipe_akun,
      followers: item.followers,
      deskripsi: item.description ?? "",
      screenshot: null,
    });
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetFormState();
    }
  };

  const validateForm = (requireScreenshot: boolean) => {
    if (!form.wilayah.trim()) {
      toast.error("Wilayah akun wajib diisi.");
      return false;
    }

    if (!form.username.trim()) {
      toast.error("Username akun wajib diisi.");
      return false;
    }

    if (!form.profile_url.trim()) {
      toast.error("Profile URL wajib diisi.");
      return false;
    }

    if (!form.nama_profil.trim()) {
      toast.error("Nama profil wajib diisi.");
      return false;
    }

    if (requireScreenshot && !form.screenshot) {
      toast.error("Screenshot profil wajib diunggah.");
      return false;
    }

    return true;
  };

  const toUpdatePayload = (): UpdateSocialAccountPayload => ({
    wilayah: form.wilayah,
    platform: form.platform,
    username: form.username,
    profile_url: form.profile_url,
    nama_profil: form.nama_profil,
    tipe_akun: form.tipe_akun,
    followers: form.followers,
    deskripsi: form.deskripsi,
  });

  const handleSubmit = async () => {
    const isEditMode = Boolean(editingAccount);

    if (!validateForm(!isEditMode)) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAccount) {
        await updateSocialAccount(editingAccount.id, toUpdatePayload());
        toast.success("Akun sosmed berhasil diperbarui.");
      } else if (form.screenshot) {
        await createSocialAccount({
          ...toUpdatePayload(),
          screenshot: form.screenshot,
        });
        toast.success("Akun sosmed berhasil didaftarkan.");
      }

      handleDialogOpenChange(false);
      await loadAccounts();
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal menyimpan akun sosmed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAccount) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteSocialAccount(deletingAccount.id);
      toast.success("Akun sosmed berhasil dihapus.");
      setDeletingAccount(null);
      await loadAccounts();
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal menghapus akun sosmed");
    } finally {
      setIsDeleting(false);
    }
  };

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [response, wilayahList] = await Promise.all([
        listSocialAccounts({
          page: 1,
          limit: 50,
        }),
        listWilayahOptions(),
      ]);
      setItems(response.data);
      setWilayahOptions(wilayahList);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat daftar akun sosmed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending && isAuthorized) {
      void loadAccounts();
    }
  }, [isAuthorized, isPending, loadAccounts]);

  if (isPending) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Spinner />
          <span>Memuat session...</span>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <>
      <div className="space-y-6">
        <Card className="border-emerald-100 bg-linear-to-br from-emerald-50 via-background to-amber-50">
          <CardContent className="space-y-5 px-6 py-8 md:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-200 bg-white/70 px-3 py-1 text-emerald-700"
                >
                  Akun Sosmed / Registrasi
                </Badge>
                <div className="space-y-2">
                  <h1 className="font-semibold text-3xl tracking-tight">Daftar Akun Sosmed</h1>
                  <p className="max-w-2xl text-muted-foreground text-sm leading-6">
                    Superadmin membuat akun sosmed, menetapkan wilayah pemilik akun, lalu mendelegasikannya ke PIC
                    sosmed yang sesuai.
                  </p>
                </div>
              </div>

              <Button type="button" onClick={openCreateDialog}>
                <Plus className="mr-2 size-4" />
                Daftarkan Akun
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Spinner />
              <span>Memuat akun sosmed...</span>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <Card key={item.id} className="border-foreground/10">
                <CardContent className="space-y-4 py-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-xl">{item.nama_profil}</h2>
                        <Badge
                          variant="outline"
                          className={cn("rounded-full px-3 py-1", getVerificationBadge(item.verification_status))}
                        >
                          {item.verification_status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn("rounded-full px-3 py-1", getDelegationBadge(item.delegation_status))}
                        >
                          {item.delegation_status.replaceAll("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {item.username} • {formatPlatformLabel(item.platform)}
                      </p>
                      {item.description && (
                        <p className="max-w-2xl text-muted-foreground text-sm leading-6">{item.description}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <p className="text-muted-foreground text-xs">Ditambahkan {formatTimeAgo(item.created_at)}</p>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </Button>
                        <Button type="button" variant="destructive" size="sm" onClick={() => setDeletingAccount(item)}>
                          <Trash2 className="mr-2 size-4" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border bg-muted/20 p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Wilayah Akun</p>
                      <p className="mt-2 font-medium text-sm">{item.wilayah_name}</p>
                      <p className="text-muted-foreground text-xs">Scope delegasi dan analitik akun</p>
                    </div>
                    <div className="rounded-2xl border bg-muted/20 p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Added By</p>
                      <p className="mt-2 font-medium text-sm">{item.added_by.name}</p>
                      <p className="text-muted-foreground text-xs">{item.added_by.regional ?? "Nasional"}</p>
                    </div>
                    <div className="rounded-2xl border bg-muted/20 p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">PIC Sosmed</p>
                      <p className="mt-2 font-medium text-sm">{item.officer_name ?? "Belum didelegasikan"}</p>
                      <p className="text-muted-foreground text-xs">{item.officer_regional ?? "-"}</p>
                    </div>
                    <div className="rounded-2xl border bg-muted/20 p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Followers</p>
                      <p className="mt-2 font-medium text-sm">{item.followers.toLocaleString("id-ID")}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.verification_note ?? "Tanpa catatan verifikasi"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-muted-foreground text-sm">
                    <Globe className="size-4" />
                    <a
                      href={item.profile_url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline-offset-4 hover:underline"
                    >
                      {item.profile_url}
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}

            {items.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  Belum ada akun sosmed yang terdaftar.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit Akun Sosmed" : "Daftarkan Akun Sosmed"}</DialogTitle>
            <DialogDescription>
              {editingAccount
                ? "Perbarui metadata akun sosmed yang sudah terdaftar."
                : "Lengkapi metadata akun lalu unggah screenshot profil terbaru."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Wilayah Akun</Label>
              <Select
                value={form.wilayah}
                onValueChange={(value) => setForm((previous) => ({ ...previous, wilayah: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih wilayah akun" />
                </SelectTrigger>
                <SelectContent>
                  {wilayahOptions.map((wilayah) => (
                    <SelectItem key={wilayah.id} value={wilayah.id}>
                      {wilayah.nama} ({wilayah.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Platform</Label>
              <Select
                value={form.platform}
                onValueChange={(value) =>
                  setForm((previous) => ({ ...previous, platform: value as CreateSocialAccountPayload["platform"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {formatPlatformLabel(platform)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Username</Label>
              <Input
                value={form.username}
                onChange={(event) => setForm((previous) => ({ ...previous, username: event.target.value }))}
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label>Profile URL</Label>
              <Input
                value={form.profile_url}
                onChange={(event) => setForm((previous) => ({ ...previous, profile_url: event.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label>Nama Profil</Label>
              <Input
                value={form.nama_profil}
                onChange={(event) => setForm((previous) => ({ ...previous, nama_profil: event.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label>Tipe Akun</Label>
              <Select
                value={form.tipe_akun}
                onValueChange={(value) =>
                  setForm((previous) => ({ ...previous, tipe_akun: value as CreateSocialAccountPayload["tipe_akun"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe akun" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Followers Awal</Label>
              <Input
                type="number"
                min={0}
                value={String(form.followers)}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    followers: Number(event.target.value || 0),
                  }))
                }
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={form.deskripsi ?? ""}
                onChange={(event) => setForm((previous) => ({ ...previous, deskripsi: event.target.value }))}
              />
            </div>

            {!editingAccount && (
              <div className="grid gap-2 md:col-span-2">
                <Label>Screenshot Profil</Label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      screenshot: event.target.files?.[0] ?? null,
                    }))
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
              Batal
            </Button>
            <Button type="button" disabled={isSubmitting} onClick={handleSubmit}>
              {isSubmitting && <Spinner className="mr-2" />}
              <Upload className="mr-2 size-4" />
              {editingAccount ? "Simpan Perubahan" : "Simpan Akun"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingAccount)} onOpenChange={(open) => !open && setDeletingAccount(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus akun sosmed?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingAccount
                ? `Akun ${deletingAccount.nama_profil} (${deletingAccount.username}) akan dihapus dari daftar aktif.`
                : "Akun sosmed ini akan dihapus dari daftar aktif."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {isDeleting && <Spinner className="mr-2" />}
              Hapus Akun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
