"use client";

import { useCallback, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { AtSign, Globe, KeyRound, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
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
import { authClient } from "@/lib/auth-client";
import { isValidIndonesianPhoneNumber, normalizeIndonesianPhoneNumber } from "@/lib/phone-number";
import { getInitials } from "@/lib/utils";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import {
  changeMyEmail,
  changeMyPassword,
  getMyAccountProfile,
  updateMyAccountProfile,
} from "../api/account-profile-api";
import type { AccountProfileData } from "../types/account-profile.type";

const ALL_ROLES: UserRole[] = ["superadmin", "sysadmin", "qcc_wcc", "wcc", "pic_sosmed"];
const USERNAME_REGEX = /^[a-zA-Z0-9_.]+$/;

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

type ProfileFormState = {
  name: string;
  username: string;
  email: string;
  phone_number: string;
};

function createProfileFormState(data: AccountProfileData | null): ProfileFormState {
  return {
    name: data?.user.name ?? "",
    username: data?.user.username ?? "",
    email: data?.user.email ?? "",
    phone_number: data?.user.phone_number ?? "",
  };
}

export function AccountProfileView() {
  const router = useRouter();
  const { isAuthorized, isPending } = useRoleGuard(ALL_ROLES);
  const [data, setData] = useState<AccountProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(createProfileFormState(null));
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

  useEffect(() => {
    setProfileForm(createProfileFormState(data));
  }, [data]);

  const handleResetProfileForm = () => {
    setProfileForm(createProfileFormState(data));
  };

  async function handleSaveProfile() {
    if (!data) {
      return;
    }

    const normalized = {
      name: profileForm.name.trim(),
      username: profileForm.username.trim().toLowerCase(),
      email: profileForm.email.trim().toLowerCase(),
      phone_number: normalizeIndonesianPhoneNumber(profileForm.phone_number),
    };

    if (normalized.name.length < 3) {
      toast.error("Nama minimal 3 karakter.");
      return;
    }

    if (!normalized.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
      toast.error("Format email tidak valid.");
      return;
    }

    if (normalized.username.length < 3) {
      toast.error("Username minimal 3 karakter.");
      return;
    }

    if (normalized.username.length > 30) {
      toast.error("Username maksimal 30 karakter.");
      return;
    }

    if (!USERNAME_REGEX.test(normalized.username)) {
      toast.error("Username hanya boleh huruf, angka, titik, dan underscore.");
      return;
    }

    if (normalized.phone_number) {
      if (!isValidIndonesianPhoneNumber(normalized.phone_number)) {
        toast.error("Format nomor HP tidak valid.");
        return;
      }
    }

    const original = {
      name: data.user.name.trim(),
      username: (data.user.username ?? "").trim().toLowerCase(),
      email: data.user.email.trim().toLowerCase(),
      phone_number: normalizeIndonesianPhoneNumber(data.user.phone_number),
    };

    const hasProfileChanges =
      normalized.name !== original.name ||
      normalized.username !== original.username ||
      normalized.phone_number !== original.phone_number;
    const hasEmailChange = normalized.email !== original.email;

    if (!hasProfileChanges && !hasEmailChange) {
      toast.error("Belum ada perubahan untuk disimpan.");
      return;
    }

    setIsSubmittingProfile(true);

    try {
      if (hasProfileChanges) {
        await updateMyAccountProfile({
          name: normalized.name,
          username: normalized.username,
          phone_number: normalized.phone_number || null,
        });
      }

      if (hasEmailChange) {
        await changeMyEmail({
          newEmail: normalized.email,
          callbackURL: "/akun/profil",
        });
      }

      await authClient.getSession();
      const refreshedProfile = await getMyAccountProfile();
      setData(refreshedProfile.data);
      router.refresh();

      toast.success(
        hasEmailChange
          ? "Profil disimpan. Jika backend meminta verifikasi email, cek inbox untuk melanjutkan."
          : "Profil berhasil diperbarui.",
      );
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memperbarui profil");
    } finally {
      setIsSubmittingProfile(false);
    }
  }

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
      <Card className="app-bg-hero app-border-soft overflow-hidden">
        <CardContent className="space-y-6 px-6 py-8 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Avatar className="size-16 rounded-2xl border bg-card shadow-sm">
                <AvatarImage src={data.user.image ?? undefined} alt={data.user.name} />
                <AvatarFallback className="rounded-2xl text-lg">{getInitials(data.user.name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className="rounded-full border-emerald-200 bg-background/75 px-3 py-1 text-emerald-700 dark:bg-card/75"
                  >
                    Akun / Profil
                  </Badge>
                  <div>
                    <h1 className="font-semibold text-3xl tracking-tight">{data.user.name}</h1>
                    <p className="text-muted-foreground text-sm leading-6">
                      {data.user.email}
                      {data.user.username ? ` • @${data.user.username.replace(/^@/, "")}` : ""}
                      {" • "}
                      {formatRoleLabel(data.user.role)}
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
            <CardDescription>Nama, email, nomor HP, dan username bisa Anda perbarui sendiri.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="profile-name">Nama</Label>
                <Input
                  id="profile-name"
                  value={profileForm.name}
                  onChange={(event) =>
                    setProfileForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  disabled={isSubmittingProfile}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile-username">Username</Label>
                <Input
                  id="profile-username"
                  value={profileForm.username}
                  onChange={(event) =>
                    setProfileForm((previous) => ({
                      ...previous,
                      username: event.target.value,
                    }))
                  }
                  placeholder="username.login"
                  disabled={isSubmittingProfile}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={profileForm.email}
                  onChange={(event) =>
                    setProfileForm((previous) => ({
                      ...previous,
                      email: event.target.value,
                    }))
                  }
                  disabled={isSubmittingProfile}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile-phone-number">Nomor HP</Label>
                <Input
                  id="profile-phone-number"
                  value={profileForm.phone_number}
                  onChange={(event) =>
                    setProfileForm((previous) => ({
                      ...previous,
                      phone_number: event.target.value,
                    }))
                  }
                  onBlur={(event) =>
                    setProfileForm((previous) => ({
                      ...previous,
                      phone_number: normalizeIndonesianPhoneNumber(event.target.value) ?? "",
                    }))
                  }
                  placeholder="+6281234567890"
                  disabled={isSubmittingProfile}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sky-800 text-sm">
              Perubahan email memerlukan verifikasi ulang, tapi sekarang masih belum perlu, belum dipasang verifikasi
              email nya .
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={handleSaveProfile} disabled={isSubmittingProfile}>
                {isSubmittingProfile ? <Spinner className="mr-2" /> : null}
                Simpan Profil
              </Button>
              <Button type="button" variant="outline" onClick={handleResetProfileForm} disabled={isSubmittingProfile}>
                Reset
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
              <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
                <UserRound className="mt-0.5 size-4 text-emerald-700" />
                <div>
                  <p className="font-medium">Role</p>
                  <p className="text-muted-foreground text-sm">{formatRoleLabel(data.user.role)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
                <AtSign className="mt-0.5 size-4 text-emerald-700" />
                <div>
                  <p className="font-medium">Username Aktif</p>
                  <p className="text-muted-foreground text-sm">{data.user.username ?? "Belum tersedia"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
                <Mail className="mt-0.5 size-4 text-emerald-700" />
                <div>
                  <p className="font-medium">Email Aktif</p>
                  <p className="text-muted-foreground text-sm">{data.user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
                <Phone className="mt-0.5 size-4 text-emerald-700" />
                <div>
                  <p className="font-medium">Nomor HP Aktif</p>
                  <p className="text-muted-foreground text-sm">{data.user.phone_number ?? "Belum tersedia"}</p>
                </div>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Wilayah</p>
                <p className="mt-2 font-medium">{data.user.wilayah?.nama ?? "Nasional / Tidak ditetapkan"}</p>
                <p className="text-muted-foreground text-xs">{data.user.wilayah?.kode ?? "-"}</p>
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
