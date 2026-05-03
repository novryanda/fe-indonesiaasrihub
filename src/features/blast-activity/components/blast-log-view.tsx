"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { ArrowDown, ArrowUp, ExternalLink, FileSpreadsheet, FileText, Repeat2, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { PlatformIcon } from "@/features/content-shared/components/platform-icon";
import { formatDateTime, formatNumber, formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { ApiError } from "@/shared/api/api-client";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { getBlastFeed } from "../api/get-blast-feed";
import { getBlastRanking } from "../api/get-blast-ranking";
import type {
  BlastActivityItem,
  BlastFeedFilters,
  BlastFeedItem,
  BlastMeta,
  BlastRankingStats,
} from "../types/blast-activity.type";

const INITIAL_FILTERS: BlastFeedFilters = {
  platform: "all",
  social_account_id: "all",
  status: "blasted",
  scope: "all",
  timeliness: "all",
  sort_direction: "desc",
  date_from: "",
  date_to: "",
  search: "",
  page: 1,
  limit: 20,
};

const EXPORT_PAGE_SIZE = 100;

type ExportMode = "excel" | "pdf";

interface BlastReportRow {
  waktu_input: string;
  waktu_blast: string;
  user_blast: string;
  wilayah_user: string;
  judul: string;
  akun_sosmed: string;
  platform: string;
  post_url: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  catatan: string;
}

function LastBlastSortButton({ direction, onToggle }: { direction: "asc" | "desc"; onToggle: () => void }) {
  const Icon = direction === "desc" ? ArrowDown : ArrowUp;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 px-2"
      aria-label={`Urutkan waktu terakhir blast ${direction === "desc" ? "terbaru" : "terlama"}`}
      onClick={onToggle}
    >
      Waktu Terakhir
      <Icon className="ml-2 size-4" />
    </Button>
  );
}

function getReportPeriodLabel(filters: BlastFeedFilters) {
  if (filters.date_from && filters.date_to) {
    return `${filters.date_from} s.d. ${filters.date_to}`;
  }

  if (filters.date_from) {
    return `Mulai ${filters.date_from}`;
  }

  if (filters.date_to) {
    return `Sampai ${filters.date_to}`;
  }

  return "Semua periode";
}

function buildReportRows(activities: BlastActivityItem[]): BlastReportRow[] {
  return activities.map((activity) => ({
    waktu_input: formatDateTime(activity.created_at),
    waktu_blast: formatDateTime(activity.posted_at),
    user_blast: activity.blast_user.name,
    wilayah_user: activity.blast_user.wilayah?.nama ?? "-",
    judul: activity.blast_assignment?.content.title ?? activity.caption ?? "-",
    akun_sosmed: activity.social_account?.username ?? "-",
    platform: formatPlatformLabel(activity.platform),
    post_url: activity.post_url,
    views: activity.views,
    likes: activity.likes,
    comments: activity.comments,
    shares: activity.shares,
    reposts: activity.reposts,
    catatan: activity.notes ?? "-",
  }));
}

function escapeHtml(value: string | number) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildExcelReport(rows: BlastReportRow[], filters: BlastFeedFilters) {
  const reportRows = rows
    .map(
      (row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(row.waktu_input)}</td>
          <td>${escapeHtml(row.waktu_blast)}</td>
          <td>${escapeHtml(row.user_blast)}</td>
          <td>${escapeHtml(row.wilayah_user)}</td>
          <td>${escapeHtml(row.judul)}</td>
          <td>${escapeHtml(row.akun_sosmed)}</td>
          <td>${escapeHtml(row.platform)}</td>
          <td><a href="${escapeHtml(row.post_url)}">${escapeHtml(row.post_url)}</a></td>
          <td style="mso-number-format:'0';">${escapeHtml(row.views)}</td>
          <td style="mso-number-format:'0';">${escapeHtml(row.likes)}</td>
          <td style="mso-number-format:'0';">${escapeHtml(row.comments)}</td>
          <td style="mso-number-format:'0';">${escapeHtml(row.shares)}</td>
          <td style="mso-number-format:'0';">${escapeHtml(row.reposts)}</td>
          <td>${escapeHtml(row.catatan)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Log Blast</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines /></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; }
          th, td { border: 1px solid #b7c0cc; padding: 6px; vertical-align: top; }
          th { background: #e8f3ee; font-weight: bold; }
          a { color: #047857; text-decoration: underline; }
          .meta th { background: #d9eadf; text-align: left; }
        </style>
      </head>
      <body>
        <table class="meta">
          <tr><th colspan="15">Laporan Log Blast</th></tr>
          <tr><td>Periode</td><td colspan="14">${escapeHtml(getReportPeriodLabel(filters))}</td></tr>
          <tr><td>Platform</td><td colspan="14">${escapeHtml(filters.platform === "all" ? "Semua Platform" : formatPlatformLabel(filters.platform))}</td></tr>
        </table>
        <br />
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Waktu Input</th>
              <th>Waktu Blast</th>
              <th>User Blast</th>
              <th>Wilayah User</th>
              <th>Judul</th>
              <th>Akun Sosmed</th>
              <th>Platform</th>
              <th>Post URL</th>
              <th>Views</th>
              <th>Likes</th>
              <th>Comments</th>
              <th>Shares</th>
              <th>Reposts</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>${reportRows}</tbody>
        </table>
      </body>
    </html>
  `;
}

function buildPrintableReport(rows: BlastReportRow[], filters: BlastFeedFilters) {
  const totals = rows.reduce(
    (summary, row) => ({
      views: summary.views + row.views,
      likes: summary.likes + row.likes,
      comments: summary.comments + row.comments,
      shares: summary.shares + row.shares,
      reposts: summary.reposts + row.reposts,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, reposts: 0 },
  );

  const reportRows = rows
    .map(
      (row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(row.waktu_input)}</td>
          <td>${escapeHtml(row.waktu_blast)}</td>
          <td>${escapeHtml(row.user_blast)}</td>
          <td>${escapeHtml(row.wilayah_user)}</td>
          <td>${escapeHtml(row.judul)}</td>
          <td>${escapeHtml(row.akun_sosmed)}</td>
          <td>${escapeHtml(row.platform)}</td>
          <td><a href="${escapeHtml(row.post_url)}" target="_blank" rel="noreferrer">Buka Postingan</a></td>
          <td class="number">${escapeHtml(row.views)}</td>
          <td class="number">${escapeHtml(row.likes)}</td>
          <td class="number">${escapeHtml(row.comments)}</td>
          <td class="number">${escapeHtml(row.shares)}</td>
          <td class="number">${escapeHtml(row.reposts)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>Laporan Log Blast</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
          h1 { font-size: 22px; margin: 0 0 8px; }
          p { margin: 0; color: #4b5563; font-size: 12px; }
          .summary { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin: 24px 0; }
          .summary div { border: 1px solid #d1d5db; padding: 10px; }
          .summary span { display: block; color: #6b7280; font-size: 10px; text-transform: uppercase; }
          .summary strong { display: block; margin-top: 4px; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th, td { border: 1px solid #d1d5db; padding: 6px; vertical-align: top; }
          th { background: #f3f4f6; text-align: left; }
          a { color: #047857; text-decoration: underline; }
          .number { text-align: right; }
          @page { size: landscape; margin: 12mm; }
        </style>
      </head>
      <body>
        <h1>Laporan Log Blast</h1>
        <p>Periode: ${escapeHtml(getReportPeriodLabel(filters))}</p>
        <p>Platform: ${escapeHtml(filters.platform === "all" ? "Semua Platform" : formatPlatformLabel(filters.platform))}</p>
        <div class="summary">
          <div><span>Aktivitas</span><strong>${escapeHtml(rows.length)}</strong></div>
          <div><span>Views</span><strong>${escapeHtml(formatNumber(totals.views))}</strong></div>
          <div><span>Likes</span><strong>${escapeHtml(formatNumber(totals.likes))}</strong></div>
          <div><span>Comments</span><strong>${escapeHtml(formatNumber(totals.comments))}</strong></div>
          <div><span>Shares</span><strong>${escapeHtml(formatNumber(totals.shares))}</strong></div>
          <div><span>Reposts</span><strong>${escapeHtml(formatNumber(totals.reposts))}</strong></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Waktu Input</th>
              <th>Waktu Blast</th>
              <th>User Blast</th>
              <th>Wilayah</th>
              <th>Judul</th>
              <th>Akun</th>
              <th>Platform</th>
              <th>Link Postingan</th>
              <th>Views</th>
              <th>Likes</th>
              <th>Comments</th>
              <th>Shares</th>
              <th>Reposts</th>
            </tr>
          </thead>
          <tbody>${reportRows}</tbody>
        </table>
      </body>
    </html>
  `;
}

function ReferenceCell({ item }: { item: BlastFeedItem }) {
  return (
    <div className="max-w-md space-y-1">
      <p className="line-clamp-1 font-medium text-sm">{item.title}</p>
      <p className="text-muted-foreground text-xs">
        {item.submission_code ? `${item.submission_code} • ` : ""}
        {item.target_wilayah.nama}
      </p>
    </div>
  );
}

export function BlastLogView() {
  const { isAuthorized, isPending } = useRoleGuard(["blast", "sysadmin"]);
  const [filters, setFilters] = useState<BlastFeedFilters>(INITIAL_FILTERS);
  const [items, setItems] = useState<BlastFeedItem[]>([]);
  const [meta, setMeta] = useState<BlastMeta | null>(null);
  const [blastStats, setBlastStats] = useState<BlastRankingStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<ExportMode | null>(null);

  useEffect(() => {
    if (!isAuthorized || isPending) {
      return;
    }

    let isActive = true;

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);

      try {
        const [feedResponse, rankingResponse] = await Promise.all([
          getBlastFeed(filters),
          getBlastRanking({
            platform: filters.platform,
            social_account_id: filters.social_account_id,
            date_from: filters.date_from,
            date_to: filters.date_to,
            search: filters.search,
            blast_user_id: "all",
            page: 1,
            limit: 1,
          }),
        ]);
        if (!isActive) {
          return;
        }

        setItems(feedResponse.data);
        setMeta(feedResponse.meta ?? null);
        setBlastStats(rankingResponse.data.stats);
      } catch (errorValue) {
        if (!isActive) {
          return;
        }

        setError(errorValue instanceof ApiError ? errorValue.message : "Gagal memuat log blast");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void fetchLogs();

    return () => {
      isActive = false;
    };
  }, [filters, isAuthorized, isPending]);

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;
  const stats = useMemo(
    () => ({
      bank_content: blastStats?.total_bank_konten ?? 0,
      manual: blastStats?.total_manual ?? 0,
      total: blastStats?.total_postingan ?? 0,
    }),
    [blastStats],
  );
  const hasFilters =
    filters.platform !== "all" ||
    Boolean(filters.search.trim()) ||
    Boolean(filters.date_from?.trim()) ||
    Boolean(filters.date_to?.trim());

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const fetchReportRows = async () => {
    const activities: BlastActivityItem[] = [];
    let page = 1;
    let total = 0;

    do {
      const response = await getBlastRanking({
        platform: filters.platform,
        social_account_id: filters.social_account_id,
        date_from: filters.date_from,
        date_to: filters.date_to,
        search: filters.search,
        blast_user_id: "all",
        page,
        limit: EXPORT_PAGE_SIZE,
      });

      activities.push(...response.data.activities);
      total = response.meta?.total ?? activities.length;
      page += 1;
    } while (activities.length < total);

    return buildReportRows(activities);
  };

  const handleExportExcel = async () => {
    setExporting("excel");

    try {
      const rows = await fetchReportRows();

      if (rows.length === 0) {
        toast.error("Belum ada data aktivitas blast untuk diexport.");
        return;
      }

      const filename = `laporan-log-blast-${new Date().toISOString().slice(0, 10)}.xls`;
      downloadTextFile(`\uFEFF${buildExcelReport(rows, filters)}`, filename, "application/vnd.ms-excel;charset=utf-8");
      toast.success("Laporan Excel berhasil dibuat.");
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal membuat laporan Excel");
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    setExporting("pdf");

    try {
      const rows = await fetchReportRows();

      if (rows.length === 0) {
        toast.error("Belum ada data aktivitas blast untuk diexport.");
        return;
      }

      const printWindow = window.open("", "_blank", "width=1200,height=800");

      if (!printWindow) {
        toast.error("Popup browser diblokir. Izinkan popup untuk export PDF.");
        return;
      }

      printWindow.document.write(buildPrintableReport(rows, filters));
      printWindow.document.close();
      printWindow.focus();
      window.setTimeout(() => {
        printWindow.print();
      }, 300);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal membuat laporan PDF");
    } finally {
      setExporting(null);
    }
  };

  if (isPending || isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Spinner />
          <span>{isPending ? "Memuat session..." : "Memuat log blast..."}</span>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="app-bg-hero app-border-soft">
        <CardContent className="space-y-4 px-6 py-8 md:px-8">
          <Badge
            variant="outline"
            className="rounded-full border-emerald-200 bg-background/75 px-3 py-1 text-emerald-700 dark:bg-card/75"
          >
            Blast / Log Blast
          </Badge>
          <div className="space-y-2">
            <h1 className="font-semibold text-3xl tracking-tight">Log Blast</h1>
            <p className="max-w-3xl text-muted-foreground text-sm leading-6">
              Riwayat postingan yang sudah diblast di wilayah Anda, termasuk user blast terakhir dan jumlah blast ulang.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-2 py-5">
            <p className="text-muted-foreground text-sm">Dari Bank Konten</p>
            <p className="font-semibold text-2xl">{formatNumber(stats.bank_content)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 py-5">
            <p className="text-muted-foreground text-sm">Manual</p>
            <p className="font-semibold text-2xl">{formatNumber(stats.manual)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 py-5">
            <p className="text-muted-foreground text-sm">Total Postingan Diblast</p>
            <p className="font-semibold text-2xl">{formatNumber(stats.total)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-[180px_170px_170px_minmax(240px,1fr)_auto] xl:items-end">
            <div className="space-y-1">
              <label htmlFor="blast-log-platform" className="text-muted-foreground text-xs">
                Platform
              </label>
              <Select
                value={filters.platform}
                onValueChange={(value) =>
                  setFilters((previous) => ({
                    ...previous,
                    platform: value as typeof previous.platform,
                    page: 1,
                  }))
                }
              >
                <SelectTrigger id="blast-log-platform">
                  <SelectValue placeholder="Semua Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Platform</SelectItem>
                  {["instagram", "tiktok", "youtube", "facebook", "x"].map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {formatPlatformLabel(platform as never)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label htmlFor="blast-log-date-from" className="text-muted-foreground text-xs">
                Dari tanggal
              </label>
              <Input
                id="blast-log-date-from"
                type="date"
                value={filters.date_from ?? ""}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    date_from: event.target.value,
                    page: 1,
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="blast-log-date-to" className="text-muted-foreground text-xs">
                Sampai tanggal
              </label>
              <Input
                id="blast-log-date-to"
                type="date"
                value={filters.date_to ?? ""}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    date_to: event.target.value,
                    page: 1,
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="blast-log-search" className="text-muted-foreground text-xs">
                Pencarian
              </label>
              <div className="relative">
                <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
                <Input
                  id="blast-log-search"
                  className="pl-9"
                  placeholder="Cari judul, akun, wilayah, atau link"
                  value={filters.search}
                  onChange={(event) => setFilters((previous) => ({ ...previous, search: event.target.value, page: 1 }))}
                />
              </div>
            </div>

            <Button className="h-10" variant="outline" onClick={resetFilters} disabled={!hasFilters}>
              Reset Filter
            </Button>
          </div>

          <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
            <p className="text-muted-foreground text-sm">
              Export laporan mengikuti filter aktif dan memuat metrik yang diinput oleh user blast.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleExportExcel}
                disabled={exporting !== null || (meta?.total ?? 0) === 0}
              >
                {exporting === "excel" ? <Spinner className="mr-2" /> : <FileSpreadsheet className="mr-2 size-4" />}
                Export Excel
              </Button>
              <Button type="button" onClick={handleExportPdf} disabled={exporting !== null || (meta?.total ?? 0) === 0}>
                {exporting === "pdf" ? <Spinner className="mr-2" /> : <FileText className="mr-2 size-4" />}
                Export PDF
              </Button>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive text-sm">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referensi Blast</TableHead>
                    <TableHead>Akun Sosmed</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Jumlah Blast</TableHead>
                    <TableHead>User Blast Terakhir</TableHead>
                    <TableHead>
                      <LastBlastSortButton
                        direction={filters.sort_direction}
                        onToggle={() =>
                          setFilters((previous) => ({
                            ...previous,
                            sort_direction: previous.sort_direction === "asc" ? "desc" : "asc",
                            page: 1,
                          }))
                        }
                      />
                    </TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Belum ada log blast.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="align-top">
                          <ReferenceCell item={item} />
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="max-w-48 space-y-1">
                            <p className="truncate font-medium text-sm">{item.social_account?.username ?? "-"}</p>
                            <p className="line-clamp-1 text-muted-foreground text-xs">
                              {item.social_account?.profile_name ?? "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <PlatformIcon platform={item.platform} />
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                            <Repeat2 className="size-3" />
                            {formatNumber(item.blast_count)}x
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{item.completed_by?.name ?? "-"}</p>
                            <p className="text-muted-foreground text-xs">{item.completed_by?.wilayah?.nama ?? "-"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-sm">{formatDateTime(item.last_blasted_at)}</TableCell>
                        <TableCell className="text-right align-top">
                          <div className="flex justify-end gap-1">
                            <Button asChild variant="ghost" size="icon-sm" aria-label="Buka postingan">
                              <Link href={item.post_url} target="_blank" rel="noreferrer">
                                <ExternalLink className="size-4" />
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/blast/log/${item.id}`}>Detail</Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <TablePagination
            summary={`Halaman ${filters.page} dari ${totalPages}${meta ? ` (${meta.total} total log)` : ""}`}
            page={filters.page}
            totalPages={totalPages}
            disabled={isLoading}
            onPageChange={(nextPage) => setFilters((previous) => ({ ...previous, page: nextPage }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
