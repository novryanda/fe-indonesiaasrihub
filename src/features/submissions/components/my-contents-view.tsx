"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { CalendarClock, FolderOpen, History, Pencil, Plus, Search, Send } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { ReviewHistoryDialog } from "@/features/approval/components/review-history-dialog";
import { PlatformIconList } from "@/features/content-shared/components/platform-icon";
import type { ContentItem, ContentStatus } from "@/features/content-shared/types/content.type";
import {
  formatContentStatusLabel,
  formatDate,
  formatPlatformLabel,
  formatTopikLabel,
  getStatusAccentClassName,
} from "@/features/content-shared/utils/content-formatters";
import { cn } from "@/lib/utils";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { useMyContents } from "../hooks/use-my-contents";

const STATUS_OPTIONS: Array<{ value: "all" | ContentStatus; label: string }> = [
  { value: "all", label: "Semua Status" },
  { value: "menunggu_final", label: "Menunggu Final Approval" },
  { value: "disetujui", label: "Disetujui" },
  { value: "revisi", label: "Perlu Revisi" },
  { value: "ditolak", label: "Ditolak" },
  { value: "draft", label: "Draft" },
];

function SummaryCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-foreground/10">
      <CardContent className="flex items-center gap-4 py-5">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-2xl">{value}</p>
          <p className="text-sm">{title}</p>
          <p className="text-muted-foreground text-xs">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusSummary(items: ContentItem[]) {
  return items.reduce(
    (accumulator, item) => {
      if (item.status === "disetujui") {
        accumulator.approved += 1;
      }

      if (item.status === "menunggu_final") {
        accumulator.inReview += 1;
      }

      if (item.status === "revisi" || item.status === "ditolak") {
        accumulator.needsAttention += 1;
      }

      return accumulator;
    },
    {
      approved: 0,
      inReview: 0,
      needsAttention: 0,
    },
  );
}

function getSubmissionActionLabel(status: ContentStatus) {
  switch (status) {
    case "disetujui":
      return null;
    case "revisi":
    case "ditolak":
      return "Resubmit";
    case "draft":
      return "Lanjutkan";
    default:
      return "Edit";
  }
}

export function MyContentsView() {
  const { isAuthorized, isPending } = useRoleGuard(["wcc"]);
  const { items, meta, filters, setFilters, isLoading, error, loadHistory } = useMyContents();
  const [historyState, setHistoryState] = useState<{
    open: boolean;
    title?: string;
    loading: boolean;
    items: Awaited<ReturnType<typeof loadHistory>>;
  }>({
    open: false,
    title: undefined,
    loading: false,
    items: [],
  });

  const totalPages = useMemo(() => {
    if (!meta) {
      return 1;
    }

    return Math.max(1, Math.ceil(meta.total / meta.limit));
  }, [meta]);

  const summary = useMemo(() => getStatusSummary(items), [items]);

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
        <Card className="app-bg-hero app-border-soft">
          <CardContent className="space-y-5 px-6 py-8 md:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-200 bg-background/75 px-3 py-1 text-emerald-700 dark:bg-card/75"
                >
                  WCC / Konten Saya
                </Badge>
                <div className="space-y-2">
                  <h1 className="font-semibold text-3xl tracking-tight">Daftar Submission Konten</h1>
                  <p className="max-w-2xl text-muted-foreground text-sm leading-6">
                    Pantau seluruh submission Anda, lihat status review terakhir, dan buka riwayat approval dari satu
                    tabel operasional.
                  </p>
                </div>
              </div>

              <Button asChild>
                <Link href="/aksi/submit-konten">
                  <Plus className="mr-2 size-4" />
                  Submit Konten Baru
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Submission"
            value={`${meta?.total ?? items.length}`}
            hint="Semua konten yang sudah Anda kirim"
            icon={<FolderOpen className="size-5" />}
          />
          <SummaryCard
            title="Sedang Direview"
            value={`${summary.inReview}`}
            hint="Konten menunggu final approval"
            icon={<Send className="size-5" />}
          />
          <SummaryCard
            title="Perlu Tindak Lanjut"
            value={`${summary.needsAttention}`}
            hint="Status revisi atau ditolak"
            icon={<History className="size-5" />}
          />
          <SummaryCard
            title="Sudah Disetujui"
            value={`${summary.approved}`}
            hint="Konten yang lolos approval"
            icon={<CalendarClock className="size-5" />}
          />
        </div>

        <Card>
          <CardContent className="grid gap-3 py-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_repeat(2,minmax(0,0.7fr))]">
            <div className="relative">
              <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Cari judul atau kode submission"
                value={filters.search}
                onChange={(event) => setFilters((previous) => ({ ...previous, search: event.target.value, page: 1 }))}
              />
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((previous) => ({ ...previous, status: value as typeof previous.status, page: 1 }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.platform}
              onValueChange={(value) =>
                setFilters((previous) => ({ ...previous, platform: value as typeof previous.platform, page: 1 }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Platform</SelectItem>
                {["instagram", "tiktok", "youtube", "facebook", "x"].map((platform) => (
                  <SelectItem key={platform} value={platform}>
                    {formatPlatformLabel(platform as ContentItem["platform"][number])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => setFilters((previous) => ({ ...previous, dateFrom: event.target.value }))}
            />

            <Input
              type="date"
              value={filters.dateTo}
              onChange={(event) => setFilters((previous) => ({ ...previous, dateTo: event.target.value }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 py-6">
            {error ? (
              <div className="text-destructive text-sm">{error}</div>
            ) : isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Spinner />
                <span>Memuat daftar submission...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Topik</TableHead>
                    <TableHead>Tanggal Posting</TableHead>
                    <TableHead>Catatan Review</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        Belum ada submission yang cocok dengan filter saat ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="max-w-80 align-top">
                          <div className="space-y-1">
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                              {item.submission_code}
                            </Badge>
                            <p className="line-clamp-2 whitespace-normal font-medium">{item.judul}</p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge
                            variant="outline"
                            className={cn("rounded-full px-3 py-1", getStatusAccentClassName(item.status))}
                          >
                            {formatContentStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top">
                          <PlatformIconList platforms={item.platform} className="max-w-48" />
                        </TableCell>
                        <TableCell className="align-top">{formatTopikLabel(item.topik)}</TableCell>
                        <TableCell className="align-top">{formatDate(item.tanggal_posting)}</TableCell>
                        <TableCell className="max-w-72 align-top">
                          <p className="line-clamp-2 whitespace-normal text-muted-foreground text-sm">
                            {item.catatan_reviewer || "-"}
                          </p>
                        </TableCell>
                        <TableCell className="align-top">{formatDate(item.updated_at)}</TableCell>
                        <TableCell className="align-top">
                          <div className="flex justify-end gap-2">
                            {getSubmissionActionLabel(item.status) ? (
                              <Button asChild size="sm">
                                <Link href={`/aksi/submit-konten?mode=resubmit&contentId=${item.id}`}>
                                  {item.status === "revisi" || item.status === "ditolak" ? (
                                    <Send className="mr-2 size-4" />
                                  ) : (
                                    <Pencil className="mr-2 size-4" />
                                  )}
                                  {getSubmissionActionLabel(item.status)}
                                </Link>
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                setHistoryState({ open: true, title: item.judul, loading: true, items: [] });

                                try {
                                  const historyItems = await loadHistory(item.id);
                                  setHistoryState({
                                    open: true,
                                    title: item.judul,
                                    loading: false,
                                    items: historyItems,
                                  });
                                } catch (errorValue) {
                                  toast.error(
                                    errorValue instanceof Error ? errorValue.message : "Gagal memuat riwayat review",
                                  );
                                  setHistoryState({
                                    open: true,
                                    title: item.judul,
                                    loading: false,
                                    items: [],
                                  });
                                }
                              }}
                            >
                              <History className="mr-2 size-4" />
                              Riwayat
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardContent>
            <TablePagination
              summary={`Halaman ${filters.page} dari ${totalPages}${meta ? ` (${meta.total} total submission)` : ""}`}
              page={filters.page}
              totalPages={totalPages}
              disabled={isLoading}
              onPageChange={(nextPage) => setFilters((previous) => ({ ...previous, page: nextPage }))}
            />
          </CardContent>
        </Card>
      </div>

      <ReviewHistoryDialog
        open={historyState.open}
        onOpenChange={(open) => setHistoryState((previous) => ({ ...previous, open }))}
        title={historyState.title}
        items={historyState.items}
        isLoading={historyState.loading}
      />
    </>
  );
}
