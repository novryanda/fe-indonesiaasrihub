"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  CalendarClock,
  Clock3,
  ExternalLink,
  FileStack,
  FolderOpen,
  History,
  ImageOff,
  Plus,
  RefreshCcw,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ReviewHistoryDialog } from "@/features/approval/components/review-history-dialog";
import type { ContentItem, ContentStatus } from "@/features/content-shared/types/content.type";
import {
  formatContentStatusLabel,
  formatDate,
  formatPlatformLabel,
  formatTimeAgo,
  formatTopikLabel,
  formatUrgensiLabel,
  getPlatformAccentClassName,
  getStatusAccentClassName,
  getUrgencyAccentClassName,
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

function getStatusHeadline(status: ContentStatus) {
  switch (status) {
    case "menunggu_final":
      return "Konten sedang menunggu keputusan final dari superadmin.";
    case "disetujui":
      return "Konten sudah disetujui dan masuk ke alur distribusi bank konten.";
    case "revisi":
      return "Konten perlu disesuaikan kembali sebelum diajukan ulang.";
    case "ditolak":
      return "Konten ditolak pada proses review terakhir.";
    default:
      return "Konten masih berada pada tahap draft.";
  }
}

function SubmissionCard({ item, onOpenHistory }: { item: ContentItem; onOpenHistory: (item: ContentItem) => void }) {
  return (
    <Card className="overflow-hidden border-foreground/10">
      <CardContent className="grid gap-5 py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border bg-linear-to-br from-emerald-50 via-amber-50 to-zinc-100">
          {item.thumbnail_url ? (
            // biome-ignore lint/performance/noImgElement: preview thumbnail comes from backend file path or remote URL
            <img src={item.thumbnail_url} alt={item.judul} className="h-full w-full object-cover" />
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {item.submission_code}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("rounded-full px-3 py-1", getStatusAccentClassName(item.status))}
                >
                  {formatContentStatusLabel(item.status)}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("rounded-full px-3 py-1", getUrgencyAccentClassName(item.urgensi))}
                >
                  {formatUrgensiLabel(item.urgensi)}
                </Badge>
              </div>

              <div className="space-y-2">
                <h2 className="font-semibold text-xl tracking-tight">{item.judul}</h2>
                <p className="max-w-3xl text-muted-foreground text-sm leading-6">{getStatusHeadline(item.status)}</p>
              </div>
            </div>

            <div className="space-y-2 text-muted-foreground text-xs">
              <p className="inline-flex items-center gap-2">
                <Clock3 className="size-3.5" />
                Disubmit {formatTimeAgo(item.created_at)}
              </p>
              <p className="inline-flex items-center gap-2">
                <CalendarClock className="size-3.5" />
                Target posting {formatDate(item.tanggal_posting)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {item.platform.map((platform) => (
              <Badge
                key={platform}
                variant="outline"
                className={cn("rounded-full px-3 py-1", getPlatformAccentClassName(platform))}
              >
                {formatPlatformLabel(platform)}
              </Badge>
            ))}
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {formatTopikLabel(item.topik)}
            </Badge>
          </div>

          <div className="rounded-3xl bg-muted/30 p-4">
            <p className="line-clamp-3 text-sm leading-6">{item.caption || "Caption belum tersedia."}</p>
          </div>

          {item.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.hashtags.slice(0, 5).map((hashtag) => (
                <Badge key={hashtag} variant="secondary" className="rounded-full px-3 py-1">
                  {hashtag}
                </Badge>
              ))}
            </div>
          )}

          {item.catatan_reviewer && (
            <div className="rounded-2xl border border-dashed bg-amber-50/50 px-4 py-3">
              <p className="font-medium text-sm">Catatan review terakhir</p>
              <p className="mt-1 text-muted-foreground text-sm leading-6">{item.catatan_reviewer}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-border/60 border-t pt-4">
            {["revisi", "ditolak"].includes(item.status) && (
              <Button asChild>
                <Link href={`/aksi/submit-konten?mode=resubmit&contentId=${item.id}`}>
                  <RefreshCcw className="mr-2 size-4" />
                  Resubmit
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href={item.drive_link} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 size-4" />
                Buka Drive
              </Link>
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenHistory(item)}>
              <History className="mr-2 size-4" />
              Riwayat Review
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
        <Card className="border-emerald-100 bg-linear-to-br from-emerald-50 via-background to-amber-50">
          <CardContent className="space-y-5 px-6 py-8 md:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-200 bg-white/70 px-3 py-1 text-emerald-700"
                >
                  WCC / Konten Saya
                </Badge>
                <div className="space-y-2">
                  <h1 className="font-semibold text-3xl tracking-tight">Daftar Submission Konten</h1>
                  <p className="max-w-2xl text-muted-foreground text-sm leading-6">
                    Pantau semua konten yang sudah Anda kirim, cek status review terbaru, dan buka ulang folder kerja
                    dari satu tempat.
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

            <div className="rounded-3xl border border-emerald-200 bg-white/80 p-4">
              <p className="font-medium text-emerald-800 text-sm">
                {meta?.total ?? items.length} submission tercatat untuk akun Anda.
              </p>
              <p className="mt-1 text-emerald-700/80 text-sm">
                Gunakan filter untuk fokus ke konten yang masih direview, perlu revisi, atau sudah lolos ke bank konten.
              </p>
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
            hint="Berdasarkan hasil filter halaman ini"
            icon={<Send className="size-5" />}
          />
          <SummaryCard
            title="Perlu Tindak Lanjut"
            value={`${summary.needsAttention}`}
            hint="Konten revisi atau ditolak"
            icon={<FileStack className="size-5" />}
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

        {error ? (
          <Card>
            <CardContent className="py-6 text-destructive">{error}</CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Spinner />
              <span>Memuat daftar submission...</span>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="space-y-4 py-14 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <FolderOpen className="size-7" />
              </div>
              <div className="space-y-2">
                <h2 className="font-semibold text-lg">Belum ada submission yang cocok</h2>
                <p className="mx-auto max-w-md text-muted-foreground text-sm leading-6">
                  Ubah filter pencarian atau kirim konten baru agar daftar submission WCC mulai terisi.
                </p>
              </div>
              <Button asChild>
                <Link href="/aksi/submit-konten">
                  <Plus className="mr-2 size-4" />
                  Submit Konten Baru
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <SubmissionCard
                key={item.id}
                item={item}
                onOpenHistory={async (selectedItem) => {
                  setHistoryState({ open: true, title: selectedItem.judul, loading: true, items: [] });

                  try {
                    const historyItems = await loadHistory(selectedItem.id);
                    setHistoryState({
                      open: true,
                      title: selectedItem.judul,
                      loading: false,
                      items: historyItems,
                    });
                  } catch (errorValue) {
                    toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat riwayat review");
                    setHistoryState({
                      open: true,
                      title: selectedItem.judul,
                      loading: false,
                      items: [],
                    });
                  }
                }}
              />
            ))}
          </div>
        )}

        <Card size="sm">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              Halaman {filters.page} dari {totalPages} {meta ? `(${meta.total} total submission)` : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters((previous) => ({ ...previous, page: Math.max(1, previous.page - 1) }))}
                disabled={filters.page <= 1 || isLoading}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters((previous) => ({ ...previous, page: previous.page + 1 }))}
                disabled={filters.page >= totalPages || isLoading}
              >
                Berikutnya
              </Button>
            </div>
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
