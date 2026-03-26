"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  Clock3,
  ExternalLink,
  FileText,
  FolderKanban,
  Hash,
  ImageOff,
  MessageSquareQuote,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { ContentDetail, ReviewHistoryItem } from "@/features/content-shared/types/content.type";
import {
  formatContentStatusLabel,
  formatDate,
  formatDateTime,
  formatDurasiLabel,
  formatJenisKontenLabel,
  formatJumlahFileLabel,
  formatPlatformLabel,
  formatReviewStepLabel,
  formatTargetAudiensLabel,
  formatTimeAgo,
  formatTopikLabel,
  formatUrgensiLabel,
  getPlatformAccentClassName,
  getStatusAccentClassName,
  getUrgencyAccentClassName,
} from "@/features/content-shared/utils/content-formatters";
import { getContentSubmissionDetail } from "@/features/submissions/api/get-content-submission-detail";
import { cn } from "@/lib/utils";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import type { ApprovalBoardMode } from "../types/content-approval.type";

function getDetailConfig(mode: ApprovalBoardMode) {
  return mode === "regional-review"
    ? {
        title: "Detail Review Konten",
        subtitle: "Admin Regional / Detail Konten",
        description: "Tinjau detail brief, aset, dan histori review sebelum memberikan keputusan regional.",
        allowedRoles: ["qcc_wcc"] as const,
        backHref: "/dashboard/review-konten",
        backLabel: "Kembali ke Antrian Review",
      }
    : {
        title: "Detail Final Approval",
        subtitle: "Superadmin / Detail Konten",
        description: "Lihat keseluruhan submission sebelum memutuskan final approval dan distribusi ke bank konten.",
        allowedRoles: ["superadmin"] as const,
        backHref: "/dashboard/approval",
        backLabel: "Kembali ke Antrian Approval",
      };
}

function formatHistoryActionLabel(action: ReviewHistoryItem["action"]) {
  switch (action) {
    case "approved":
      return "Disetujui";
    case "rejected":
      return "Ditolak";
    case "resubmitted":
      return "Dikirim Ulang";
    default:
      return "Dikirim";
  }
}

function StageBadges({ mode }: { mode: ApprovalBoardMode }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white">WCC</Badge>
      {mode === "regional-review" && (
        <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white">QCC/WCC</Badge>
      )}
      <Badge
        className={cn(
          "rounded-full px-3 py-1",
          mode === "final-approval"
            ? "bg-emerald-600 text-white"
            : "border border-border bg-background text-foreground",
        )}
      >
        Superadmin
      </Badge>
      <Badge variant="outline" className="rounded-full px-3 py-1">
        Bank Konten
      </Badge>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 md:grid-cols-[160px_minmax(0,1fr)]">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="font-medium text-sm leading-6">{value}</p>
    </div>
  );
}

export function ContentApprovalDetailView({ mode }: { mode: ApprovalBoardMode }) {
  const config = getDetailConfig(mode);
  const params = useParams<{ id: string }>();
  const contentId = typeof params?.id === "string" ? params.id : "";
  const { accessToken, isAuthorized, isPending } = useRoleGuard([...config.allowedRoles]);

  const [detail, setDetail] = useState<ContentDetail | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contentId) {
      setLoading(false);
      setError("Konten tidak ditemukan.");
      return;
    }

    let active = true;

    const loadDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getContentSubmissionDetail(contentId, accessToken);
        if (!active) {
          return;
        }

        setDetail(response.data);
      } catch (errorValue) {
        if (!active) {
          return;
        }

        setError(errorValue instanceof Error ? errorValue.message : "Gagal memuat detail konten.");
        setDetail(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadDetail();

    return () => {
      active = false;
    };
  }, [accessToken, contentId]);

  const platformLabels = useMemo(
    () => detail?.platform.map((platform) => formatPlatformLabel(platform)).join(", ") ?? "-",
    [detail],
  );

  if (isPending || isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Spinner />
          <span>{isPending ? "Memuat session..." : "Memuat detail konten..."}</span>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  if (error || !detail) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10 text-center">
          <p className="font-medium text-destructive">{error ?? "Konten tidak ditemukan."}</p>
          <Button asChild variant="outline">
            <Link href={config.backHref}>
              <ArrowLeft className="mr-2 size-4" />
              Kembali ke Antrian
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-emerald-100 bg-linear-to-br from-emerald-50 via-background to-amber-50">
        <CardContent className="space-y-5 px-6 py-8 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="rounded-full border-emerald-200 bg-white/70 px-3 py-1 text-emerald-700"
              >
                {config.subtitle}
              </Badge>
              <div className="space-y-2">
                <h1 className="font-semibold text-3xl tracking-tight">{config.title}</h1>
                <p className="max-w-2xl text-muted-foreground text-sm leading-6">{config.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={config.backHref}>
                  <ArrowLeft className="mr-2 size-4" />
                  Kembali
                </Link>
              </Button>
              <Button asChild>
                <Link href={detail.drive_link} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Buka Drive
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-white/80 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-2xl">{detail.judul}</h2>
                  <Badge
                    variant="outline"
                    className={cn("rounded-full px-3 py-1", getStatusAccentClassName(detail.status))}
                  >
                    {formatContentStatusLabel(detail.status)}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {detail.officer.name} • {detail.officer.regional ?? "Regional belum tersedia"} •{" "}
                  {formatTimeAgo(detail.created_at)}
                </p>
              </div>

              <div className="space-y-2 text-muted-foreground text-sm">
                <p className="inline-flex items-center gap-2">
                  <Clock3 className="size-4" />
                  Dibuat {formatDateTime(detail.created_at)}
                </p>
                <p className="inline-flex items-center gap-2">
                  <Clock3 className="size-4" />
                  Update terakhir {formatDateTime(detail.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-6">
          <Card className="overflow-hidden border-foreground/10">
            <CardContent className="grid gap-5 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border bg-linear-to-br from-emerald-50 via-amber-50 to-zinc-100">
                {detail.thumbnail_url ? (
                  // biome-ignore lint/performance/noImgElement: preview thumbnail comes from backend file path or remote URL
                  <img src={detail.thumbnail_url} alt={detail.judul} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
                    <div className="flex size-14 items-center justify-center rounded-full bg-white/80 text-emerald-700">
                      <ImageOff className="size-6" />
                    </div>
                    <p className="text-xs">Thumbnail belum tersedia</p>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  {detail.platform.map((platform) => (
                    <Badge
                      key={platform}
                      variant="outline"
                      className={cn("rounded-full px-3 py-1", getPlatformAccentClassName(platform))}
                    >
                      {formatPlatformLabel(platform)}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {formatTopikLabel(detail.topik)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("rounded-full px-3 py-1", getUrgencyAccentClassName(detail.urgensi))}
                  >
                    {formatUrgensiLabel(detail.urgensi)}
                  </Badge>
                </div>

                <div className="rounded-3xl bg-muted/30 p-4">
                  <p className="font-medium text-sm">Caption / Deskripsi</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {detail.caption || "Caption belum tersedia."}
                  </p>
                </div>

                {detail.hashtags.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Hashtag</p>
                    <div className="flex flex-wrap gap-2">
                      {detail.hashtags.map((hashtag) => (
                        <Badge key={hashtag} variant="secondary" className="rounded-full px-3 py-1">
                          {hashtag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-foreground/10">
            <CardHeader>
              <CardTitle className="text-xl">Brief & Metadata</CardTitle>
              <CardDescription>Rincian submission yang diajukan oleh konten kreator.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow label="Kode Submission" value={detail.submission_code} />
              <DetailRow label="Platform" value={platformLabels} />
              <DetailRow label="Jenis Konten" value={formatJenisKontenLabel(detail.jenis_konten)} />
              <DetailRow label="Topik" value={formatTopikLabel(detail.topik)} />
              <DetailRow label="Tanggal Posting" value={formatDate(detail.tanggal_posting)} />
              <DetailRow label="Jumlah File" value={formatJumlahFileLabel(detail.jumlah_file)} />
              <DetailRow label="Durasi" value={formatDurasiLabel(detail.durasi_konten)} />
              <DetailRow label="Target Audiens" value={formatTargetAudiensLabel(detail.target_audiens)} />
              <DetailRow label="Urgensi" value={formatUrgensiLabel(detail.urgensi)} />
              <DetailRow label="Tipe Entri" value={detail.tipe === "revisi_repost" ? "Revisi / Repost" : "Baru"} />
            </CardContent>
          </Card>

          <Card className="border-foreground/10">
            <CardHeader>
              <CardTitle className="text-xl">Riwayat Review</CardTitle>
              <CardDescription>Jejak approval ditampilkan langsung di halaman detail ini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {detail.approval_history.length === 0 ? (
                <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-muted-foreground text-sm">
                  Riwayat review belum tersedia.
                </div>
              ) : (
                detail.approval_history.map((item) => (
                  <div key={`${item.step}-${item.timestamp}`} className="rounded-2xl border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{formatReviewStepLabel(item.step)}</p>
                        <p className="text-muted-foreground text-xs">{item.actor_name}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                          {formatHistoryActionLabel(item.action)}
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                          <Clock3 className="size-3.5" />
                          {formatDateTime(item.timestamp)}
                        </span>
                      </div>
                    </div>
                    {item.note && <p className="mt-3 text-sm leading-6">{item.note}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card className="border-foreground/10">
            <CardHeader>
              <CardTitle className="text-xl">Status Saat Ini</CardTitle>
              <CardDescription>Ringkasan cepat untuk reviewer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={cn("rounded-full px-3 py-1", getStatusAccentClassName(detail.status))}
                >
                  {formatContentStatusLabel(detail.status)}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("rounded-full px-3 py-1", getUrgencyAccentClassName(detail.urgensi))}
                >
                  {formatUrgensiLabel(detail.urgensi)}
                </Badge>
              </div>

              <StageBadges mode={mode} />

              <div className="space-y-3 rounded-3xl border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <UserRound className="mt-0.5 size-4 text-emerald-700" />
                  <div>
                    <p className="font-medium text-sm">WCC</p>
                    <p className="text-muted-foreground text-sm">{detail.officer.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {detail.officer.regional ?? "Regional belum tersedia"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Hash className="mt-0.5 size-4 text-emerald-700" />
                  <div>
                    <p className="font-medium text-sm">Submission Code</p>
                    <p className="text-muted-foreground text-sm">{detail.submission_code}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 size-4 text-emerald-700" />
                  <div>
                    <p className="font-medium text-sm">Drive Link</p>
                    <p className="break-all text-muted-foreground text-sm leading-6">{detail.drive_link}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {detail.catatan_reviewer && (
            <Card className="border-foreground/10">
              <CardHeader>
                <CardTitle className="text-xl">Catatan Review Terkait</CardTitle>
                <CardDescription>Catatan terakhir yang melekat pada submission ini.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-3xl border border-dashed bg-amber-50/60 p-4">
                  <div className="flex items-start gap-3">
                    <MessageSquareQuote className="mt-0.5 size-4 text-amber-700" />
                    <p className="text-sm leading-6">{detail.catatan_reviewer}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {detail.bukti_posting && (
            <Card className="border-foreground/10">
              <CardHeader>
                <CardTitle className="text-xl">Bukti Posting</CardTitle>
                <CardDescription>Status distribusi setelah approval.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl border bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <FolderKanban className="mt-0.5 size-4 text-emerald-700" />
                    <div>
                      <p className="font-medium text-sm">Status Bukti Posting</p>
                      <p className="text-muted-foreground text-sm">{detail.bukti_posting.status}</p>
                    </div>
                  </div>
                </div>

                {detail.bukti_posting.links.length > 0 && (
                  <div className="space-y-3">
                    {detail.bukti_posting.links.map((linkItem) => (
                      <div key={linkItem.id} className="rounded-2xl border bg-muted/20 p-4 text-sm">
                        <p className="font-medium">{formatPlatformLabel(linkItem.platform)}</p>
                        <p className="mt-1 break-all text-muted-foreground leading-6">{linkItem.post_url}</p>
                        <p className="mt-2 text-muted-foreground text-xs">
                          Diposting {formatDateTime(linkItem.posted_at)} • Validasi {linkItem.validation_status}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-foreground/10">
            <CardHeader>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild>
                <Link href={detail.drive_link} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Buka Drive
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={config.backHref}>
                  <ShieldCheck className="mr-2 size-4" />
                  {config.backLabel}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
