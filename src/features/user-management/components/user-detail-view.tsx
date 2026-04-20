"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { ArrowLeft, CheckCircle2, Clock3, Mail, MapPinned, NotebookTabs, Phone, ShieldCheck, Wifi } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { UserAvatarPlaceholder } from "@/components/ui/user-avatar-placeholder";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { getUserDetail } from "../api/get-user-detail";
import type { UserDetailActivityItem, UserDetailData, UserRole } from "../types/user-management.type";

function toRoleLabel(role: UserRole) {
  switch (role) {
    case "superadmin":
      return "Superadmin";
    case "supervisi":
      return "Supervisi";
    case "sysadmin":
      return "Sysadmin";
    case "qcc_wcc":
      return "QCC/WCC";
    case "wcc":
      return "WCC";
    case "pic_sosmed":
      return "PIC Sosmed";
    case "blast":
      return "Blast";
    default:
      return role;
  }
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTimeAgo(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) {
    return "Baru saja";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} hari lalu`;
}

function getStatusClassName(status: UserDetailData["user"]["status"]) {
  return status === "aktif"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function getActivitySourceClassName(source: UserDetailActivityItem["source"]) {
  return source === "request" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function ProfileMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-emerald-100/80 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-sm">
      <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 font-semibold text-2xl tracking-tight">{value}</p>
    </div>
  );
}

export function UserDetailView({ id }: { id: string }) {
  const { isAuthorized, isPending } = useRoleGuard(["superadmin", "sysadmin"]);
  const [data, setData] = useState<UserDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDetail = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getUserDetail(id);
      setData(response.data);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat detail user");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthorized || isPending) {
      return;
    }

    void loadDetail();
  }, [isAuthorized, isPending, loadDetail]);

  const statCards = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      { label: "Sesi Login", value: data.summary.session_count },
      { label: "Audit Logs", value: data.summary.audit_log_count },
      { label: "Akun Delegasi", value: data.summary.delegated_social_account_count },
      { label: "Konten Dibuat", value: data.summary.created_content_count },
      { label: "Bukti Posting", value: data.summary.posting_proof_count },
      { label: "Notifikasi", value: data.summary.notification_count },
    ];
  }, [data]);

  if (isPending || isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Spinner />
          <span>{isPending ? "Memuat session..." : "Memuat detail user..."}</span>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthorized || !data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="app-bg-hero app-border-soft overflow-hidden">
        <CardContent className="space-y-6 px-6 py-8 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="rounded-full border-emerald-200 bg-background/75 px-3 py-1 text-emerald-700 dark:bg-card/75"
              >
                Admin / Manajemen User / Detail
              </Badge>
              <p className="text-muted-foreground text-sm leading-6">
                Profil user, status akses, dan ringkasan aktivitas terbaru.
              </p>
            </div>

            <Button asChild variant="outline">
              <Link href="/pengaturan/manajemen-user">
                <ArrowLeft className="mr-2 size-4" />
                Kembali
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.8fr)] xl:items-end">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Avatar className="size-24 rounded-[2rem] border-4 border-white/75 bg-card/95 shadow-lg ring-1 ring-emerald-100/80 sm:size-28">
                <AvatarImage src={data.user.image ?? undefined} alt={data.user.name} />
                <AvatarFallback className="rounded-[2rem] bg-white p-0">
                  <UserAvatarPlaceholder />
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">{data.user.name}</h1>
                    <p className="break-all text-base text-muted-foreground">{data.user.email}</p>
                    <p className="text-muted-foreground text-sm leading-6">
                      @{data.user.username ?? "-"}
                      {" • "}
                      {data.user.regional ?? "Tanpa wilayah"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={getStatusClassName(data.user.status)}>
                      {data.user.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </Badge>
                    <Badge variant="outline">{toRoleLabel(data.user.role)}</Badge>
                    <Badge variant="outline">
                      {data.user.email_verified ? "Email terverifikasi" : "Email belum terverifikasi"}
                    </Badge>
                    {data.user.regional ? <Badge variant="outline">{data.user.regional}</Badge> : null}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
                    <Mail className="mt-0.5 size-4 text-emerald-700" />
                    <div className="min-w-0">
                      <p className="font-medium">Email utama</p>
                      <p className="break-all text-muted-foreground text-sm">{data.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
                    <Phone className="mt-0.5 size-4 text-emerald-700" />
                    <div className="min-w-0">
                      <p className="font-medium">Nomor HP</p>
                      <p className="text-muted-foreground text-sm">{data.user.phone_number ?? "Belum tersedia"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
                    <ShieldCheck className="mt-0.5 size-4 text-emerald-700" />
                    <div className="min-w-0">
                      <p className="font-medium">Role & Akses</p>
                      <p className="text-muted-foreground text-sm">{toRoleLabel(data.user.role)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
                    <Clock3 className="mt-0.5 size-4 text-emerald-700" />
                    <div className="min-w-0">
                      <p className="font-medium">Terakhir aktif</p>
                      <p className="text-muted-foreground text-sm">{formatTimeAgo(data.user.last_active)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
              <div className="mb-4 space-y-1">
                <p className="font-medium">Ringkasan Aktivitas</p>
                <p className="text-muted-foreground text-sm">Snapshot cepat aktivitas dan jejak penggunaan akun.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {statCards.map((item) => (
                  <ProfileMetric key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <Card>
          <CardHeader>
            <CardTitle>Snapshot Akun</CardTitle>
            <CardDescription>Detail akun inti, identitas wilayah, dan status verifikasi user.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Email</p>
                <p className="mt-2 break-all font-medium">{data.user.email}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Username</p>
                <p className="mt-2 font-medium">@{data.user.username ?? "-"}</p>
                {data.user.display_username ? (
                  <p className="mt-1 text-muted-foreground text-sm">{data.user.display_username}</p>
                ) : null}
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Nomor HP</p>
                <p className="mt-2 font-medium">{data.user.phone_number ?? "Belum tersedia"}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Wilayah</p>
                <p className="mt-2 font-medium">{data.user.regional ?? "Tanpa wilayah"}</p>
                <p className="mt-1 text-muted-foreground text-sm">{data.user.wilayah?.kode ?? "-"}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Verifikasi Email</p>
                <p className="mt-2 inline-flex items-center gap-2 font-medium">
                  <CheckCircle2 className="size-4 text-emerald-700" />
                  {data.user.email_verified ? "Terverifikasi" : "Belum terverifikasi"}
                </p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Dibuat</p>
                <p className="mt-2 font-medium">{formatDateTime(data.user.created_at)}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Terakhir Aktif</p>
                <p className="mt-2 font-medium">{formatDateTime(data.user.last_active)}</p>
                <p className="mt-1 text-muted-foreground text-sm">{formatTimeAgo(data.user.last_active)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sesi Terbaru</CardTitle>
            <CardDescription>Riwayat sesi login terakhir untuk user ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recent_sessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground">
                Belum ada sesi yang tercatat.
              </div>
            ) : (
              data.recent_sessions.map((session) => (
                <div key={session.id} className="rounded-2xl border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="font-medium">{session.ip_address ?? "IP tidak tersedia"}</p>
                      <p className="inline-flex items-start gap-2 text-muted-foreground text-sm">
                        <Wifi className="mt-0.5 size-4 shrink-0" />
                        <span className="break-all">{session.user_agent ?? "User agent tidak tersedia"}</span>
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{formatDateTime(session.last_seen_at)}</p>
                      <p className="text-muted-foreground">Expired {formatDateTime(session.expires_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terbaru</CardTitle>
          <CardDescription>Audit trail terbaru yang melibatkan user ini sebagai actor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recent_activities.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground">
              Belum ada aktivitas audit yang tercatat.
            </div>
          ) : (
            data.recent_activities.map((activity) => (
              <div key={activity.id} className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={getActivitySourceClassName(activity.source)}>
                        {activity.source}
                      </Badge>
                      {activity.method ? <Badge variant="outline">{activity.method}</Badge> : null}
                      <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700">
                        {activity.entity_name}
                      </Badge>
                    </div>
                    <p className="font-medium">{activity.action}</p>
                    <div className="grid gap-2 text-muted-foreground text-sm md:grid-cols-3">
                      <p className="inline-flex items-start gap-2">
                        <NotebookTabs className="mt-0.5 size-4 shrink-0" />
                        <span className="break-all">{activity.path ?? activity.entity_id}</span>
                      </p>
                      <p className="inline-flex items-start gap-2">
                        <MapPinned className="mt-0.5 size-4 shrink-0" />
                        <span>{activity.ip_address ?? "IP tidak tersedia"}</span>
                      </p>
                      <p className="inline-flex items-start gap-2">
                        <Clock3 className="mt-0.5 size-4 shrink-0" />
                        <span>{formatDateTime(activity.created_at)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-muted-foreground text-sm">{formatTimeAgo(activity.created_at)}</div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
