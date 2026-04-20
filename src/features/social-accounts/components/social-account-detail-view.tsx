"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  ExternalLink,
  Globe,
  Layers3,
  MessageSquareText,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatPlatformLabel, formatTimeAgo } from "@/features/content-shared/utils/content-formatters";
import { cn } from "@/lib/utils";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { getSocialAccountDetail } from "../api/social-accounts-api";
import type { SocialAccountDetail } from "../types/social-account.type";

const numberFormatter = new Intl.NumberFormat("id-ID");
const compactNumberFormatter = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

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

function getPlatformBadge(platform: SocialAccountDetail["platform"]) {
  switch (platform) {
    case "instagram":
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";
    case "tiktok":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "youtube":
      return "border-red-200 bg-red-50 text-red-700";
    case "facebook":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "x":
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
    default:
      return "border-border bg-muted text-foreground";
  }
}

function getVerificationBadge(status: SocialAccountDetail["verification_status"]) {
  switch (status) {
    case "verified":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getDelegationBadge(status: SocialAccountDetail["delegation_status"]) {
  switch (status) {
    case "sudah_didelegasikan":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "delegasi_dicabut":
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
    default:
      return "border-orange-200 bg-orange-50 text-orange-700";
  }
}

function StatPill({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="flex h-full flex-col justify-between rounded-[1.35rem] border border-white/75 bg-white/72 px-3.5 py-3 shadow-sm">
      <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-1.5 font-semibold text-[1.45rem] leading-none tracking-tight">{value}</p>
      <p className="mt-1 text-muted-foreground text-xs leading-5">{helper}</p>
    </div>
  );
}

function MetaItem({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-3xl border bg-background px-4 py-4">
      <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 whitespace-normal font-medium leading-6">{value}</p>
      {helper ? <p className="mt-1 whitespace-normal text-muted-foreground text-sm leading-6">{helper}</p> : null}
    </div>
  );
}

export function SocialAccountDetailView({ id }: { id: string }) {
  const { isAuthorized, isPending } = useRoleGuard(["superadmin"]);
  const [data, setData] = useState<SocialAccountDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDetail = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getSocialAccountDetail(id);
      setData(response.data);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat detail akun sosmed");
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

  const heroStats = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        label: "Followers",
        value: numberFormatter.format(data.metrics.latest_followers),
        helper: data.last_stat_update
          ? `Update ${formatTimeAgo(data.last_stat_update)}`
          : "Belum ada snapshot follower",
      },
      {
        label: "Posting",
        value: numberFormatter.format(data.metrics.total_posting),
        helper: `${numberFormatter.format(data.scraped_posts.length)} hasil scrape`,
      },
      {
        label: "Views",
        value: compactNumberFormatter.format(data.metrics.total_views),
        helper: `${compactNumberFormatter.format(data.metrics.total_likes)} likes`,
      },
      {
        label: "Engagement",
        value: `${data.metrics.engagement_rate.toFixed(1)}%`,
        helper: `${compactNumberFormatter.format(data.metrics.total_comments)} komentar`,
      },
    ];
  }, [data]);

  if (isPending || isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Spinner />
          <span>{isPending ? "Memuat session..." : "Memuat detail akun sosmed..."}</span>
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
        <CardContent className="space-y-5 px-5 py-6 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <Badge
                variant="outline"
                className="rounded-full border-emerald-200 bg-background/80 px-3 py-1 text-emerald-700 dark:bg-card/75"
              >
                Akun / Daftar Akun / Detail
              </Badge>
              <p className="max-w-2xl text-muted-foreground text-sm leading-6">
                Ringkasan profil akun sosial, status operasional, dan snapshot performa terbaru.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="outline">
                <Link href="/akun/daftar-akun">
                  <ArrowLeft className="mr-2 size-4" />
                  Kembali
                </Link>
              </Button>
              <Button asChild>
                <a href={data.profile_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Buka Profil
                </a>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
            <Avatar className="size-20 rounded-[1.75rem] border-4 border-white/80 bg-card/95 shadow-lg ring-1 ring-emerald-100/80 sm:size-24">
              <AvatarImage src={data.screenshot_url || undefined} alt={data.nama_profil} className="object-cover" />
              <AvatarFallback className="rounded-[1.75rem] bg-white">
                <span
                  aria-hidden="true"
                  className="size-11 rounded-full border border-border/55 bg-background/70 shadow-inner sm:size-14"
                />
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 space-y-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-semibold text-3xl tracking-tight md:text-[2.4rem]">{data.nama_profil}</h1>
                  {data.is_verified ? <BadgeCheck className="size-5 text-sky-600 sm:size-6" /> : null}
                </div>
                <p className="text-base text-muted-foreground">{data.username}</p>
                <p className="max-w-3xl text-muted-foreground text-sm leading-6">
                  {data.description ||
                    "Belum ada deskripsi akun. Detail ini tetap menampilkan identitas akun, platform, wilayah, dan snapshot performa terakhir."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={cn("rounded-full", getPlatformBadge(data.platform))}>
                  {formatPlatformLabel(data.platform)}
                </Badge>
                <Badge variant="outline" className={cn("rounded-full", getVerificationBadge(data.verification_status))}>
                  {data.verification_status}
                </Badge>
                <Badge variant="outline" className={cn("rounded-full", getDelegationBadge(data.delegation_status))}>
                  {data.delegation_status.replaceAll("_", " ")}
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  {data.tipe_akun}
                </Badge>
                {data.wilayah ? (
                  <Badge variant="outline" className="rounded-full">
                    {data.wilayah.nama}
                  </Badge>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="flex items-start gap-3 rounded-[1.35rem] border border-white/75 bg-white/72 px-3.5 py-3 shadow-sm">
                  <Globe className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">Platform & Link</p>
                    <p className="text-muted-foreground text-xs leading-5">{formatPlatformLabel(data.platform)}</p>
                    <p className="line-clamp-1 text-muted-foreground text-xs leading-5">{data.profile_url}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-[1.35rem] border border-white/75 bg-white/72 px-3.5 py-3 shadow-sm">
                  <UserRound className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">PIC Sosmed</p>
                    <p className="text-muted-foreground text-xs leading-5">
                      {data.officer?.name ?? "Belum didelegasikan"}
                    </p>
                    <p className="text-muted-foreground text-xs leading-5">{data.officer?.wilayah?.nama ?? "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-[1.35rem] border border-white/75 bg-white/72 px-3.5 py-3 shadow-sm">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">Verifikasi</p>
                    <p className="text-muted-foreground text-xs leading-5">
                      {data.verified_by ? `Oleh ${data.verified_by.name}` : "Belum diverifikasi"}
                    </p>
                    <p className="line-clamp-1 text-muted-foreground text-xs leading-5">
                      {data.verification_note ?? "Tanpa catatan verifikasi"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-[1.35rem] border border-white/75 bg-white/72 px-3.5 py-3 shadow-sm">
                  <CalendarClock className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">Freshness</p>
                    <p className="text-muted-foreground text-xs leading-5">
                      {formatDateTime(data.scrape_overview?.latest_scraped_at ?? null)}
                    </p>
                    <p className="text-muted-foreground text-xs leading-5">
                      {data.scrape_overview
                        ? `${numberFormatter.format(data.scrape_overview.observed_posts_count)} post terpantau`
                        : "Belum ada data scrape"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {heroStats.map((item) => (
                  <StatPill key={item.label} label={item.label} value={item.value} helper={item.helper} />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardHeader>
            <CardTitle>Snapshot Profil</CardTitle>
            <CardDescription>Identitas akun, struktur organisasi, dan informasi ownership akun sosial.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <MetaItem label="Nama Profil" value={data.nama_profil} helper={data.username} />
            <MetaItem
              label="Wilayah"
              value={data.wilayah?.nama ?? "Tanpa wilayah"}
              helper={data.wilayah ? `${data.wilayah.kode} • ${data.wilayah.level ?? "Wilayah"}` : undefined}
            />
            <MetaItem label="Eselon 1" value={data.eselon_1 ?? "-"} />
            <MetaItem label="Eselon 2" value={data.eselon_2 ?? "-"} />
            <MetaItem label="Ditambahkan Oleh" value={data.added_by.name} helper={formatDateTime(data.created_at)} />
            <MetaItem
              label="Delegasi PIC"
              value={data.officer?.name ?? "Belum didelegasikan"}
              helper={data.delegated_at ? `Delegasi ${formatDateTime(data.delegated_at)}` : "Belum ada waktu delegasi"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Highlight Operasional</CardTitle>
            <CardDescription>Gambaran cepat kondisi akun dari sisi monitoring dan workflow PIC.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border bg-muted/20 p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Observed Posts</p>
                <p className="mt-2 font-semibold text-2xl">
                  {numberFormatter.format(data.scrape_overview?.observed_posts_count ?? 0)}
                </p>
                <p className="mt-1 text-muted-foreground text-sm">Jumlah post yang ikut termonitor saat scrape.</p>
              </div>
              <div className="rounded-3xl border bg-muted/20 p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Observed Comments</p>
                <p className="mt-2 font-semibold text-2xl">
                  {numberFormatter.format(data.scrape_overview?.observed_comments_count ?? 0)}
                </p>
                <p className="mt-1 text-muted-foreground text-sm">Komentar yang terbaca dari snapshot terbaru.</p>
              </div>
              <div className="rounded-3xl border bg-muted/20 p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">PIC Submitted</p>
                <p className="mt-2 font-semibold text-2xl">
                  {numberFormatter.format(data.pic_activity_summary.submitted_count)}
                </p>
                <p className="mt-1 text-muted-foreground text-sm">Total aktivitas PIC yang pernah disubmit.</p>
              </div>
              <div className="rounded-3xl border bg-muted/20 p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">PIC Valid</p>
                <p className="mt-2 font-semibold text-2xl">
                  {numberFormatter.format(data.pic_activity_summary.valid_count)}
                </p>
                <p className="mt-1 text-muted-foreground text-sm">Aktivitas PIC yang sudah tervalidasi.</p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border bg-background p-4">
              <p className="font-medium">Catatan Verifikasi</p>
              <p className="mt-2 text-muted-foreground text-sm leading-7">
                {data.verification_note || "Belum ada catatan verifikasi untuk akun ini."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardHeader>
            <CardTitle>Postingan Terbaru</CardTitle>
            <CardDescription>Feed ringkas hasil scrape terbaru untuk melihat ritme dan isi akun.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.scraped_posts.length === 0 ? (
              <div className="rounded-3xl border border-dashed px-4 py-10 text-center text-muted-foreground">
                Belum ada posting hasil scrape untuk ditampilkan.
              </div>
            ) : (
              data.scraped_posts.slice(0, 4).map((post) => (
                <div key={post.id} className="rounded-3xl border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn("rounded-full", getPlatformBadge(data.platform))}>
                          {formatPlatformLabel(data.platform)}
                        </Badge>
                        <Badge variant="outline" className="rounded-full">
                          {post.type}
                        </Badge>
                      </div>
                      <p className="line-clamp-3 whitespace-normal text-muted-foreground text-sm leading-6">
                        {post.caption || "Posting tanpa caption."}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <a href={post.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 size-4" />
                        Buka
                      </a>
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border bg-background px-3 py-2">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">Likes</p>
                      <p className="mt-2 font-medium">{compactNumberFormatter.format(post.likes_count ?? 0)}</p>
                    </div>
                    <div className="rounded-2xl border bg-background px-3 py-2">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">Comments</p>
                      <p className="mt-2 font-medium">{compactNumberFormatter.format(post.comments_count ?? 0)}</p>
                    </div>
                    <div className="rounded-2xl border bg-background px-3 py-2">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">Views</p>
                      <p className="mt-2 font-medium">
                        {compactNumberFormatter.format(post.video_view_count ?? post.video_play_count ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl border bg-background px-3 py-2">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">Tanggal</p>
                      <p className="mt-2 font-medium">{formatDateTime(post.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary Jejak Akun</CardTitle>
            <CardDescription>Badge informasi penting untuk memahami posisi akun secara cepat.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                `${formatPlatformLabel(data.platform)} platform`,
                `${data.tipe_akun} account`,
                data.verification_status,
                data.delegation_status.replaceAll("_", " "),
                `${numberFormatter.format(data.metrics.total_posting)} posting`,
                `${compactNumberFormatter.format(data.metrics.total_views)} views`,
                `${compactNumberFormatter.format(data.metrics.total_comments)} comments`,
                `${compactNumberFormatter.format(data.metrics.total_share_posts)} shares`,
              ].map((item) => (
                <Badge key={item} variant="outline" className="rounded-full px-3 py-1">
                  {item}
                </Badge>
              ))}
            </div>

            <div className="grid gap-3">
              <div className="flex items-start gap-3 rounded-3xl border bg-muted/20 p-4">
                <Users className="mt-0.5 size-4 text-emerald-700" />
                <div>
                  <p className="font-medium">Audience Reach</p>
                  <p className="mt-1 text-muted-foreground text-sm leading-6">
                    Followers saat ini {numberFormatter.format(data.metrics.latest_followers)} dengan engagement rate{" "}
                    {data.metrics.engagement_rate.toFixed(1)}%.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-3xl border bg-muted/20 p-4">
                <Layers3 className="mt-0.5 size-4 text-emerald-700" />
                <div>
                  <p className="font-medium">Konten Terpantau</p>
                  <p className="mt-1 text-muted-foreground text-sm leading-6">
                    Sistem sudah membaca {numberFormatter.format(data.scraped_posts.length)} posting hasil scrape dan{" "}
                    {numberFormatter.format(data.posting_links.length)} bukti posting terkait akun ini.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-3xl border bg-muted/20 p-4">
                <MessageSquareText className="mt-0.5 size-4 text-emerald-700" />
                <div>
                  <p className="font-medium">Percakapan Audiens</p>
                  <p className="mt-1 text-muted-foreground text-sm leading-6">
                    {numberFormatter.format(data.latest_comments_summary.length)} komentar terbaru tersimpan untuk
                    review cepat respons audiens.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
