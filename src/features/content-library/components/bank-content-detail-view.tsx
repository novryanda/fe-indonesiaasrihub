"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileText,
  FolderOpen,
  LibraryBig,
  Link2,
  MapPinned,
  Send,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  formatDate,
  formatDateTime,
  formatJenisKontenLabel,
  formatJumlahFileLabel,
  formatNumber,
  formatPlatformLabel,
  formatTopikLabel,
  formatYear,
  getPlatformAccentClassName,
} from "@/features/content-shared/utils/content-formatters";
import { cn } from "@/lib/utils";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { getBankContentDetail } from "../api/get-bank-content-detail";
import type { BankContentDetail } from "../types/content-library.type";

function StatsCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="border-foreground/10">
      <CardContent className="flex items-center gap-4 py-5">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
        <div>
          <p className="font-semibold text-2xl">{value}</p>
          <p className="text-muted-foreground text-sm">{title}</p>
        </div>
      </CardContent>
    </Card>
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

function formatAccessLabel(value: BankContentDetail["status_akses"]) {
  return value === "publik" ? "Publik" : "Terbatas";
}

export function BankContentDetailView() {
  const params = useParams<{ id: string }>();
  const contentId = typeof params?.id === "string" ? params.id : "";
  const { accessToken, isAuthorized, isPending } = useRoleGuard(["qcc_wcc", "wcc", "pic_sosmed", "superadmin"]);

  const [detail, setDetail] = useState<BankContentDetail | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contentId) {
      setLoading(false);
      setError("Konten bank tidak ditemukan.");
      return;
    }

    let active = true;

    const loadDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getBankContentDetail(contentId, accessToken);
        if (!active) {
          return;
        }

        setDetail(response.data);
      } catch (errorValue) {
        if (!active) {
          return;
        }

        setError(errorValue instanceof Error ? errorValue.message : "Gagal memuat detail bank konten.");
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

  if (isPending || isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Spinner />
          <span>{isPending ? "Memuat session..." : "Memuat detail bank konten..."}</span>
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
          <p className="font-medium text-destructive">{error ?? "Konten bank tidak ditemukan."}</p>
          <Button asChild variant="outline">
            <Link href="/konten/bank-konten">
              <ArrowLeft className="mr-2 size-4" />
              Kembali ke Bank Konten
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="app-bg-hero app-border-soft">
        <CardContent className="space-y-5 px-6 py-8 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="rounded-full border-emerald-200 bg-background/75 dark:bg-card/75 px-3 py-1 text-emerald-700"
              >
                Konten / Detail Bank Konten
              </Badge>
              <div className="space-y-2">
                <h1 className="font-semibold text-3xl tracking-tight">Detail Bank Konten</h1>
                <p className="max-w-2xl text-muted-foreground text-sm leading-6">
                  Lihat ringkasan aset, metadata, dan berapa banyak posting yang sudah tercatat memakai konten ini.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/konten/bank-konten">
                  <ArrowLeft className="mr-2 size-4" />
                  Kembali
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-background/75 p-4 dark:bg-card/75">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-2xl">{detail.judul}</h2>
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {formatAccessLabel(detail.status_akses)}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {detail.regional_asal} • Tahun kampanye {detail.tahun_kampanye}
                </p>
              </div>

              <p className="text-muted-foreground text-sm">
                Dibuat {formatDateTime(detail.created_at)} • Update {formatDateTime(detail.updated_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Akun Posting"
          value={formatNumber(detail.jumlah_posting_digunakan)}
          icon={<Send className="size-5" />}
        />
        <StatsCard
          title="Konten Terkait"
          value={formatNumber(detail.jumlah_konten_turunan)}
          icon={<LibraryBig className="size-5" />}
        />
        <StatsCard
          title="Platform"
          value={formatNumber(detail.platform.length)}
          icon={<FolderOpen className="size-5" />}
        />
        <StatsCard
          title="Tahun Kampanye"
          value={formatYear(detail.tahun_kampanye)}
          icon={<CalendarDays className="size-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-6">
          <Card className="overflow-hidden border-foreground/10">
            <CardContent className="grid gap-5 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="app-bg-media relative aspect-[16/10] overflow-hidden rounded-3xl">
                {detail.thumbnail_url ? (
                  // biome-ignore lint/performance/noImgElement: remote URL preview is acceptable for bank content detail
                  <img src={detail.thumbnail_url} alt={detail.judul} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                    <div className="flex size-16 items-center justify-center rounded-full border border-emerald-200 bg-background/75 dark:bg-card/75 font-semibold text-2xl text-emerald-700">
                      {detail.judul.slice(0, 1).toUpperCase()}
                    </div>
                    <p className="px-6 text-xs">Preview thumbnail belum tersedia</p>
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
                </div>

                <div className="rounded-3xl bg-muted/30 p-4">
                  <p className="font-medium text-sm">Deskripsi</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {detail.deskripsi?.trim() || "Deskripsi belum tersedia."}
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
              <CardTitle className="text-xl">Informasi Detail Konten</CardTitle>
              <CardDescription>Rincian lengkap item yang tersimpan di bank konten.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow label="Jenis Konten" value={formatJenisKontenLabel(detail.jenis_konten as never)} />
              <DetailRow label="Jumlah File" value={formatJumlahFileLabel(detail.jumlah_file)} />
              <DetailRow label="Regional Asal" value={detail.regional_asal} />
              <DetailRow label="Status Akses" value={formatAccessLabel(detail.status_akses)} />
              <DetailRow label="Uploader" value={detail.uploaded_by} />
              <DetailRow label="Tanggal Dibuat" value={formatDate(detail.created_at)} />
              <DetailRow label="Drive Link" value={detail.drive_link} />
              <DetailRow
                label="Regional Terbatas"
                value={detail.regional_terbatas.length > 0 ? detail.regional_terbatas.join(", ") : "Tidak ada batasan"}
              />
            </CardContent>
          </Card>

          <Card className="border-foreground/10">
            <CardHeader>
              <CardTitle className="text-xl">Posting yang Memakai Konten Ini</CardTitle>
              <CardDescription>
                Daftar akun sosmed yang sudah memposting konten ini berdasarkan hasil validasi bukti posting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {detail.penggunaan_posting.length === 0 ? (
                <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-muted-foreground text-sm">
                  Belum ada posting tercatat yang memakai konten ini.
                </div>
              ) : (
                detail.penggunaan_posting.map((usage) => (
                  <div key={usage.id} className="rounded-2xl border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="font-medium text-sm">{usage.social_account.nama_profil}</p>
                        <p className="text-muted-foreground text-xs">
                          @{usage.social_account.username.replace(/^@/, "")} •{" "}
                          {usage.pic_sosmed?.name ?? "PIC belum tercatat"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full px-3 py-1",
                            getPlatformAccentClassName(usage.social_account.platform),
                          )}
                        >
                          {formatPlatformLabel(usage.social_account.platform)}
                        </Badge>
                        {usage.validation_status ? (
                          <Badge variant="outline" className={cn("rounded-full px-3 py-1")}>
                            {usage.validation_status.replaceAll("_", " ")}
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border bg-background px-4 py-3">
                        <p className="text-muted-foreground text-xs">Waktu Posting</p>
                        <p className="mt-1 font-medium text-sm">{formatDateTime(usage.posted_at)}</p>
                      </div>
                      <div className="rounded-2xl border bg-background px-4 py-3">
                        <p className="text-muted-foreground text-xs">Regional PIC</p>
                        <p className="mt-1 font-medium text-sm">{usage.pic_sosmed?.regional ?? "-"}</p>
                      </div>
                    </div>

                    {usage.pic_bukti_posting ? (
                      <div className="rounded-2xl border bg-background px-4 py-3 text-sm">
                        <p className="text-muted-foreground text-xs">PIC Pengirim Bukti</p>
                        <p className="mt-1 font-medium">{usage.pic_bukti_posting.name}</p>
                      </div>
                    ) : null}

                    {usage.post_url ? (
                      <div className="rounded-2xl border bg-background px-4 py-3 text-sm">
                        <p className="text-muted-foreground text-xs">Link Posting</p>
                        <a
                          href={usage.post_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block break-all text-emerald-700 underline-offset-4 hover:underline"
                        >
                          {usage.post_url}
                        </a>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card className="border-foreground/10">
            <CardContent className="space-y-4">
              <div className="rounded-3xl border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <UserRound className="mt-0.5 size-4 text-emerald-700" />
                  <div>
                    <p className="font-medium text-sm">Uploader</p>
                    <p className="text-muted-foreground text-sm">{detail.uploaded_by}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <MapPinned className="mt-0.5 size-4 text-emerald-700" />
                  <div>
                    <p className="font-medium text-sm">Regional Asal</p>
                    <p className="text-muted-foreground text-sm">{detail.regional_asal}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <Link2 className="mt-0.5 size-4 text-emerald-700" />
                  <div>
                    <p className="font-medium text-sm">Drive Link</p>
                    <p className="break-all text-muted-foreground text-sm leading-6">{detail.drive_link}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-foreground/10">
            <CardContent className="flex flex-col gap-2">
              <Button asChild>
                <Link href={detail.drive_link} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Lihat Drive
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/konten/bank-konten">
                  <FileText className="mr-2 size-4" />
                  Kembali ke Bank Konten
                </Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
