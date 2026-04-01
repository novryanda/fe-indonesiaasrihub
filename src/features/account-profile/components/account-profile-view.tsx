"use client";

import { useCallback, useEffect, useState } from "react";

import { Globe, KeyRound, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";

import type { UserRole } from "@/app/(auth)/auth/types/auth.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime, formatNumber, formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { getInitials } from "@/lib/utils";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { changeMyPassword, getMyAccountProfile } from "../api/account-profile-api";
import type { AccountProfileData } from "../types/account-profile.type";

const ALL_ROLES: UserRole[] = ["superadmin", "sysadmin", "qcc_wcc", "wcc", "pic_sosmed"];

function formatRoleLabel(role: UserRole) {
  switch (role) {
    case "superadmin":
      return "Superadmin";
    case "sysadmin":
      return "Sysadmin";
    case "qcc_wcc":
      return "QCC/WCC";
    case "pic_sosmed":
      return "PIC Sosmed";
    default:
      return "WCC";
  }
}

function formatDelegationStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function AccountProfileView() {
  const { isAuthorized, isPending } = useRoleGuard(ALL_ROLES);
  const [data, setData] = useState<AccountProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    revokeOtherSessions: true,
  });

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getMyAccountProfile();
      setData(response.data);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat profil akun");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending && isAuthorized) {
      void loadProfile();
    }
  }, [isAuthorized, isPending, loadProfile]);

  async function handleChangePassword() {
    if (!passwordForm.currentPassword.trim()) {
      toast.error("Password saat ini wajib diisi.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Password baru minimal 8 karakter.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Konfirmasi password baru tidak sama.");
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await changeMyPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        revokeOtherSessions: passwordForm.revokeOtherSessions,
      });
      toast.success("Password berhasil diubah.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        revokeOtherSessions: true,
      });
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal mengubah password");
    } finally {
      setIsSubmittingPassword(false);
    }
  }

  if (isPending || isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Spinner />
          <span>{isPending ? "Memuat session..." : "Memuat profil akun..."}</span>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthorized || !data) {
    return null;
  }

  const isSocialPic = data.user.role === "pic_sosmed";

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.12),_transparent_40%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))]">
        <CardContent className="space-y-6 px-6 py-8 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Avatar className="size-16 rounded-2xl border bg-white shadow-sm">
                <AvatarImage src={data.user.image ?? undefined} alt={data.user.name} />
                <AvatarFallback className="rounded-2xl text-lg">{getInitials(data.user.name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className="rounded-full border-emerald-200 bg-white/80 px-3 py-1 text-emerald-700"
                  >
                    Akun / Profil
                  </Badge>
                  <div>
                    <h1 className="font-semibold text-3xl tracking-tight">{data.user.name}</h1>
                    <p className="text-muted-foreground text-sm leading-6">
                      {data.user.email} • {formatRoleLabel(data.user.role)}
                      {data.user.wilayah ? ` • ${data.user.wilayah.nama}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{formatRoleLabel(data.user.role)}</Badge>
                  <Badge variant="outline">{data.user.status}</Badge>
                  <Badge variant="outline">
                    {data.user.email_verified ? "email verified" : "email belum verified"}
                  </Badge>
                  {isSocialPic ? <Badge variant="outline">{data.delegated_account_count} akun delegasi</Badge> : null}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Profil</CardTitle>
            <CardDescription>Ringkasan identitas akun yang sedang aktif.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
                <UserRound className="mt-0.5 size-4 text-emerald-700" />
                <div>
                  <p className="font-medium">Nama</p>
                  <p className="text-muted-foreground text-sm">{data.user.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
                <Mail className="mt-0.5 size-4 text-emerald-700" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground text-sm">{data.user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
                <Phone className="mt-0.5 size-4 text-emerald-700" />
                <div>
                  <p className="font-medium">Nomor HP</p>
                  <p className="text-muted-foreground text-sm">{data.user.phone_number ?? "Belum tersedia"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
                <ShieldCheck className="mt-0.5 size-4 text-emerald-700" />
                <div>
                  <p className="font-medium">Status Akun</p>
                  <p className="text-muted-foreground text-sm">
                    {data.user.status} •{" "}
                    {data.user.email_verified ? "Email terverifikasi" : "Email belum terverifikasi"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Wilayah</p>
                <p className="mt-2 font-medium">{data.user.wilayah?.nama ?? "Nasional / Tidak ditetapkan"}</p>
                <p className="text-muted-foreground text-xs">{data.user.wilayah?.kode ?? "-"}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Role</p>
                <p className="mt-2 font-medium">{formatRoleLabel(data.user.role)}</p>
                <p className="text-muted-foreground text-xs">Akses menu dan workflow mengikuti role ini</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Dibuat</p>
                <p className="mt-2 font-medium">{formatDateTime(data.user.created_at)}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Terakhir Diperbarui</p>
                <p className="mt-2 font-medium">{formatDateTime(data.user.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ganti Password</CardTitle>
            <CardDescription>Ubah password akun yang Anda pakai untuk login ke sistem.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Password Saat Ini</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((previous) => ({ ...previous, currentPassword: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((previous) => ({ ...previous, newPassword: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((previous) => ({ ...previous, confirmPassword: event.target.value }))
                }
              />
            </div>

            <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
              <Checkbox
                id="revoke-other-sessions"
                checked={passwordForm.revokeOtherSessions}
                onCheckedChange={(checked) =>
                  setPasswordForm((previous) => ({
                    ...previous,
                    revokeOtherSessions: checked === true,
                  }))
                }
              />
              <div className="space-y-1">
                <Label htmlFor="revoke-other-sessions" className="font-medium text-sm">
                  Keluarkan sesi lain
                </Label>
                <p className="text-muted-foreground text-sm">
                  Jika aktif, semua sesi lain akan dicabut setelah password berhasil diubah.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sky-800 text-sm">
              Password baru minimal 8 karakter. Gunakan kombinasi yang tidak mudah ditebak.
            </div>

            <Button type="button" className="w-full" disabled={isSubmittingPassword} onClick={handleChangePassword}>
              {isSubmittingPassword ? <Spinner className="mr-2" /> : <KeyRound className="mr-2 size-4" />}
              Simpan Password Baru
            </Button>
          </CardContent>
        </Card>
      </div>

      {isSocialPic ? (
        <Card>
          <CardHeader>
            <CardTitle>Akun Sosmed Delegasi</CardTitle>
            <CardDescription>
              Daftar akun sosmed yang saat ini didelegasikan ke PIC ini, lengkap dengan eselon 1 dan eselon 2.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.delegated_accounts.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground">
                Belum ada akun sosmed yang didelegasikan.
              </div>
            ) : (
              data.delegated_accounts.map((account) => (
                <div key={account.id} className="rounded-2xl border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{formatPlatformLabel(account.platform)}</Badge>
                        <Badge variant="outline">{account.verification_status}</Badge>
                        <Badge variant="outline">{formatDelegationStatusLabel(account.delegation_status)}</Badge>
                      </div>
                      <div>
                        <p className="font-medium">{account.nama_profil}</p>
                        <p className="text-muted-foreground text-sm">{account.username}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{formatNumber(account.followers)} followers</p>
                      <p className="text-muted-foreground">{formatDateTime(account.last_stat_update)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border bg-background p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Wilayah Akun</p>
                      <p className="mt-2 font-medium text-sm">{account.wilayah?.nama ?? "-"}</p>
                    </div>
                    <div className="rounded-2xl border bg-background p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Eselon 1</p>
                      <p className="mt-2 font-medium text-sm">{account.eselon_1 ?? "-"}</p>
                    </div>
                    <div className="rounded-2xl border bg-background p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Eselon 2</p>
                      <p className="mt-2 font-medium text-sm">{account.eselon_2 ?? "-"}</p>
                    </div>
                    <div className="rounded-2xl border bg-background p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Didelegasikan</p>
                      <p className="mt-2 font-medium text-sm">{formatDateTime(account.delegated_at)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-muted-foreground text-sm">
                    <Globe className="size-4" />
                    <a
                      href={account.profile_url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline-offset-4 hover:underline"
                    >
                      {account.profile_url}
                    </a>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
