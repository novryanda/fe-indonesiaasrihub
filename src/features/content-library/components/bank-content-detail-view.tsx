"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  Copy,
  ExternalLink,
  FileText,
  FolderOpen,
  LibraryBig,
  Link2,
  MapPinned,
  Send,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  formatDate,
  formatDateTime,
  formatJenisKontenLabel,
  formatNumber,
  formatPlatformLabel,
  formatTopikLabel,
  getPlatformAccentClassName,
} from "@/features/content-shared/utils/content-formatters";
import { cn } from "@/lib/utils";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { getBankContentDetail } from "../api/get-bank-content-detail";
import type { BankContentDetail } from "../types/content-library.type";

type UsageFilter = "all" | "posted" | "pending";

type UsageTableRow = {
  id: string;
  type: "posted" | "pending";
  proof_id: string | null;
  account_name: string | null;
  username: string | null;
  platforms: BankContentDetail["platform"];
  posted_at: string | null;
  pic_name: string;
  pic_regional: string | null;
  proof_sender_name: string | null;
  validation_status: string | null;
  post_url: string | null;
};

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

function DetailRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="grid gap-1 md:grid-cols-[160px_minmax(0,1fr)]">
      <p className="text-muted-foreground text-sm">{label}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="break-all font-medium text-emerald-700 text-sm leading-6 underline-offset-4 hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="font-medium text-sm leading-6">{value}</p>
      )}
    </div>
  );
}

function formatAccessLabel(value: BankContentDetail["status_akses"]) {
  return value === "publik" ? "Publik" : "Terbatas";
}

function formatValidationStatusLabel(value: string | null) {
  return value ? value.replaceAll("_", " ") : "-";
}

export function BankContentDetailView() {
  const params = useParams<{ id: string }>();
  const contentId = typeof params?.id === "string" ? params.id : "";
  const { accessToken, role, isAuthorized, isPending } = useRoleGuard([
    "qcc_wcc",
    "wcc",
    "pic_sosmed",
    "superadmin",
    "supervisi",
  ]);

  const [detail, setDetail] = useState<BankContentDetail | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageFilter, setUsageFilter] = useState<UsageFilter>("all");
  const [usagePage, setUsagePage] = useState(1);
  const canViewUsage = role === "superadmin" || role === "supervisi";

  const handleCopy = async (value: string, label: string) => {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return;
    }

    try {
      await navigator.clipboard.writeText(normalizedValue);
      toast.success(`${label} berhasil disalin.`);
    } catch {
      toast.error(`Gagal menyalin ${label.toLowerCase()}.`);
    }
  };

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

  const postedPicCount = new Set(
    detail.penggunaan_posting.map((usage) => usage.bukti_posting_id).filter((value): value is string => Boolean(value)),
  ).size;
  const totalAssignedPicCount = detail.task_summary.assigned_pic_count;
  const totalPublicationTarget = totalAssignedPicCount > 0 ? totalAssignedPicCount : postedPicCount;
  const pendingPicCount = Math.max(totalPublicationTarget - postedPicCount, 0);
  const postedRows: UsageTableRow[] = detail.penggunaan_posting.map((usage) => ({
    id: usage.id,
    type: "posted",
    proof_id: usage.bukti_posting_id,
    account_name: usage.social_account.nama_profil,
    username: usage.social_account.username,
    platforms: [usage.social_account.platform],
    posted_at: usage.posted_at,
    pic_name: usage.pic_sosmed?.name ?? usage.pic_bukti_posting?.name ?? "PIC belum tercatat",
    pic_regional: usage.pic_sosmed?.regional ?? usage.pic_bukti_posting?.regional ?? null,
    proof_sender_name: usage.pic_bukti_posting?.name ?? null,
    validation_status: usage.validation_status,
    post_url: usage.post_url,
  }));
  const postedProofIds = new Set(
    postedRows.map((row) => row.proof_id).filter((value): value is string => Boolean(value)),
  );
  const pendingRows: UsageTableRow[] = detail.penugasan_posting
    .filter((assignment) => !postedProofIds.has(assignment.id))
    .map((assignment) => ({
      id: assignment.id,
      type: "pending",
      proof_id: assignment.id,
      account_name: null,
      username: null,
      platforms: assignment.platform_targets,
      posted_at: null,
      pic_name: assignment.pic.name,
      pic_regional: assignment.pic.regional,
      proof_sender_name: assignment.submitted_at ? assignment.pic.name : null,
      validation_status: assignment.status,
      post_url: null,
    }));
  const usageRows = [...postedRows, ...pendingRows];
  const filteredUsageRows =
    usageFilter === "posted"
      ? usageRows.filter((row) => row.type === "posted")
      : usageFilter === "pending"
        ? usageRows.filter((row) => row.type === "pending")
        : usageRows;
  const usagePageSize = 10;
  const usageTotalPages = Math.max(1, Math.ceil(filteredUsageRows.length / usagePageSize));
  const paginatedUsageRows = filteredUsageRows.slice((usagePage - 1) * usagePageSize, usagePage * usagePageSize);
  const usageSummary =
    filteredUsageRows.length === 0
      ? "Menampilkan 0 data"
      : `Menampilkan ${Math.min((usagePage - 1) * usagePageSize + 1, filteredUsageRows.length)}-${Math.min(
          usagePage * usagePageSize,
          filteredUsageRows.length,
        )} dari ${filteredUsageRows.length} data`;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-start">
          <Button asChild variant="outline">
            <Link href="/konten/bank-konten">
              <ArrowLeft className="mr-2 size-4" />
              Kembali
            </Link>
          </Button>
        </div>

        <Card className="border-foreground/10">
          <CardContent className="space-y-4 px-6 py-6 md:px-8">
            <Badge variant="outline" className="rounded-full px-3 py-1">
              Konten / Detail Bank Konten
            </Badge>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="text-left font-semibold text-3xl tracking-tight transition-opacity hover:opacity-80"
                    onClick={() => void handleCopy(detail.judul, "Judul konten")}
                  >
                    {detail.judul}
                  </button>
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {formatAccessLabel(detail.status_akses)}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">{detail.regional_asal}</p>
              </div>

              <p className="text-muted-foreground text-sm">
                Dibuat {formatDateTime(detail.created_at)} • Update {formatDateTime(detail.updated_at)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-6">
          <Card className="overflow-hidden border-foreground/10">
            <CardContent className="space-y-5 py-6">
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

              <button
                type="button"
                className="w-full rounded-3xl bg-muted/30 p-4 text-left transition-colors hover:bg-muted/50"
                onClick={() => void handleCopy(detail.deskripsi?.trim() ?? "", "Deskripsi")}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-sm">Deskripsi</p>
                  <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                    <Copy className="size-3.5" />
                    Klik untuk salin
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {detail.deskripsi?.trim() || "Deskripsi belum tersedia."}
                </p>
              </button>

              {detail.hashtags.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-sm">Hashtag</p>
                  <div className="flex flex-wrap gap-2">
                    {detail.hashtags.map((hashtag) => (
                      <button
                        key={hashtag}
                        type="button"
                        className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground text-xs transition-colors hover:bg-secondary/80"
                        onClick={() => void handleCopy(hashtag, "Hashtag")}
                      >
                        {hashtag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-foreground/10">
            <CardHeader>
              <CardTitle className="text-xl">Informasi Detail Konten</CardTitle>
              <CardDescription>Rincian lengkap item yang tersimpan di bank konten.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow label="Jenis Konten" value={formatJenisKontenLabel(detail.jenis_konten as never)} />
              <DetailRow label="Regional Asal" value={detail.regional_asal} />
              <DetailRow label="Status Akses" value={formatAccessLabel(detail.status_akses)} />
              <DetailRow label="Uploader" value={detail.uploaded_by} />
              <DetailRow label="Tanggal Dibuat" value={formatDate(detail.created_at)} />
              <DetailRow label="Drive Link" value={detail.drive_link} href={detail.drive_link} />
              <DetailRow
                label="Regional Terbatas"
                value={detail.regional_terbatas.length > 0 ? detail.regional_terbatas.join(", ") : "Tidak ada batasan"}
              />
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
                    <a
                      href={detail.drive_link}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-emerald-700 text-sm leading-6 underline-offset-4 hover:underline"
                    >
                      {detail.drive_link}
                    </a>
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

      {canViewUsage ? (
        <Card className="border-foreground/10">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl">Posting yang Memakai Konten Ini</CardTitle>
                <CardDescription>
                  Ringkasan PIC yang sudah dan belum melakukan posting untuk konten ini, berdasarkan task publikasi dan
                  hasil validasi bukti posting.
                </CardDescription>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
                <div className="rounded-2xl border bg-muted/20 px-4 py-3">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Progress PIC Posting</p>
                  <p className="mt-2 font-semibold text-2xl">
                    {formatNumber(postedPicCount)}/{formatNumber(totalPublicationTarget)}
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {formatNumber(postedPicCount)} PIC sudah melakukan posting.
                  </p>
                </div>
                <div className="rounded-2xl border bg-muted/20 px-4 py-3">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Belum Posting</p>
                  <p className="mt-2 font-semibold text-2xl">{formatNumber(pendingPicCount)}</p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {formatNumber(pendingPicCount)} PIC belum melakukan posting.
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="w-full max-w-[260px]">
                <Select
                  value={usageFilter}
                  onValueChange={(value) => {
                    setUsageFilter(value as UsageFilter);
                    setUsagePage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter status posting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Data</SelectItem>
                    <SelectItem value="posted">Sudah Posting</SelectItem>
                    <SelectItem value="pending">Belum Posting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-muted-foreground text-sm">
                Sudah posting: {formatNumber(postedPicCount)} PIC. Belum posting: {formatNumber(pendingPicCount)} PIC.
              </p>
            </div>

            {filteredUsageRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-muted-foreground text-sm">
                {usageFilter === "posted"
                  ? "Belum ada posting tercatat yang memakai konten ini."
                  : usageFilter === "pending"
                    ? "Semua PIC yang ditugaskan sudah melakukan posting."
                    : "Belum ada data posting untuk konten ini."}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="min-w-[220px]">Akun</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead className="min-w-[160px]">Waktu Posting</TableHead>
                        <TableHead className="min-w-[180px]">PIC Sosmed</TableHead>
                        <TableHead className="min-w-[140px]">Regional PIC</TableHead>
                        <TableHead className="min-w-[180px]">PIC Pengirim Bukti</TableHead>
                        <TableHead className="min-w-[140px]">Status</TableHead>
                        <TableHead className="min-w-[280px]">Link Posting</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsageRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="whitespace-normal">
                            <div className="space-y-1">
                              <p className="font-medium text-sm">{row.account_name ?? "-"}</p>
                              <p className="text-muted-foreground text-xs">
                                {row.username ? `@${row.username.replace(/^@/, "")}` : "Belum ada akun posting"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            <div className="flex flex-wrap gap-2">
                              {row.platforms.length > 0 ? (
                                row.platforms.map((platform) => (
                                  <Badge
                                    key={`${row.id}-${platform}`}
                                    variant="outline"
                                    className={cn("rounded-full px-3 py-1", getPlatformAccentClassName(platform))}
                                  >
                                    {formatPlatformLabel(platform)}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-normal text-sm">
                            {row.posted_at ? formatDateTime(row.posted_at) : "-"}
                          </TableCell>
                          <TableCell className="whitespace-normal text-sm">{row.pic_name}</TableCell>
                          <TableCell className="whitespace-normal text-sm">{row.pic_regional ?? "-"}</TableCell>
                          <TableCell className="whitespace-normal text-sm">{row.proof_sender_name ?? "-"}</TableCell>
                          <TableCell className="whitespace-normal">
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                              {row.type === "pending"
                                ? "belum posting"
                                : formatValidationStatusLabel(row.validation_status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            {row.post_url ? (
                              <a
                                href={row.post_url}
                                target="_blank"
                                rel="noreferrer"
                                className="break-all text-emerald-700 text-sm underline-offset-4 hover:underline"
                              >
                                {row.post_url}
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <TablePagination
                  summary={usageSummary}
                  page={usagePage}
                  totalPages={usageTotalPages}
                  onPageChange={setUsagePage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
