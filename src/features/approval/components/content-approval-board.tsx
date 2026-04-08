"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { ExternalLink, FileText, History, Search, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { PlatformIconList } from "@/features/content-shared/components/platform-icon";
import {
  formatContentStatusLabel,
  formatDate,
  formatPlatformLabel,
  formatTimeAgo,
  formatTopikLabel,
  formatUrgensiLabel,
  getStatusAccentClassName,
  getUrgencyAccentClassName,
} from "@/features/content-shared/utils/content-formatters";
import { cn } from "@/lib/utils";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";
import { useSmoothTableData } from "@/shared/hooks/use-smooth-loading-state";

import { useContentQueue } from "../hooks/use-content-queue";
import type { ApprovalBoardMode, ReviewDecisionPayload } from "../types/content-approval.type";
import { ReviewDecisionDialog } from "./review-decision-dialog";
import { ReviewHistoryDialog } from "./review-history-dialog";

function getBoardConfig(mode: ApprovalBoardMode) {
  return mode === "regional-review"
    ? {
        title: "Review Konten",
        subtitle: "Admin Regional / Review Konten",
        description: "Backlog lama yang masih membutuhkan review regional sebelum maju ke approval final.",
        allowedRoles: ["qcc_wcc"] as const,
        primaryActionLabel: "Setujui Review",
        detailHref: (contentId: string) => `/dashboard/review-konten/${contentId}`,
      }
    : {
        title: "Approval",
        subtitle: "Superadmin & Supervisi / Approval",
        description:
          "Setujui konten WCC berdasarkan brief dan konfigurasi distribusi yang sudah ditentukan saat submit.",
        allowedRoles: ["superadmin", "supervisi"] as const,
        primaryActionLabel: "Setuju",
        detailHref: (contentId: string) => `/dashboard/approval/${contentId}`,
      };
}

export function ContentApprovalBoard({ mode }: { mode: ApprovalBoardMode }) {
  const config = getBoardConfig(mode);
  const { accessToken, isAuthorized, isPending } = useRoleGuard([...config.allowedRoles]);
  const {
    items,
    meta,
    filters,
    setFilters,
    isLoading,
    error,
    isMutatingItemId,
    availableRegionals,
    availableTopics,
    decide,
    loadHistory,
  } = useContentQueue(mode, accessToken);
  const [decisionState, setDecisionState] = useState<{
    itemId: string;
    title: string;
    action: ReviewDecisionPayload["action"];
  } | null>(null);
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
  const tableState = useMemo(() => ({ items, meta }), [items, meta]);
  const { displayData, isInitialLoading, isRefreshing } = useSmoothTableData(tableState, isLoading);
  const displayedItems = displayData.items;
  const displayedMeta = displayData.meta;

  const totalPages = useMemo(() => {
    if (!displayedMeta) {
      return 1;
    }

    return Math.max(1, Math.ceil(displayedMeta.total / displayedMeta.limit));
  }, [displayedMeta]);

  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    filters.topik !== "all" ||
    filters.platform !== "all" ||
    filters.regional !== "all" ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo);
  const loadingLabel = filters.search.trim()
    ? "Mencari konten..."
    : hasActiveFilters
      ? "Memuat hasil filter..."
      : "Memuat antrian konten...";

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
      <section className="min-w-0 space-y-6">
        <Card className="app-bg-hero app-border-soft overflow-hidden">
          <CardContent className="min-w-0 space-y-4 px-6 py-8 md:px-8">
            <Badge
              variant="outline"
              className="rounded-full border-emerald-200 bg-background/75 px-3 py-1 text-emerald-700 dark:bg-card/75"
            >
              {config.subtitle}
            </Badge>
            <div className="space-y-2">
              <h1 className="font-semibold text-3xl tracking-tight">{config.title}</h1>
              <p className="max-w-2xl text-muted-foreground text-sm leading-6">{config.description}</p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-background/75 p-4 dark:bg-card/75">
              <p className="font-medium text-emerald-800 text-sm">
                {displayedMeta?.total ?? displayedItems.length} konten menunggu{" "}
                {mode === "final-approval" ? "approval" : "review"}.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-foreground/10">
          <CardContent className="grid min-w-0 gap-3 py-6 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.8fr))_repeat(2,minmax(0,0.7fr))]">
            <div className="relative">
              <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Cari judul atau konten kreator"
                value={filters.search}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    search: event.target.value,
                    page: 1,
                  }))
                }
              />
            </div>

            <Select
              value={filters.topik}
              onValueChange={(value) => setFilters((previous) => ({ ...previous, topik: value, page: 1 }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Topik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Topik</SelectItem>
                {availableTopics.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {formatTopikLabel(topic)}
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
                    {formatPlatformLabel(platform as never)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {mode === "final-approval" ? (
              <Select
                value={filters.regional}
                onValueChange={(value) => setFilters((previous) => ({ ...previous, regional: value, page: 1 }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Wilayah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Wilayah</SelectItem>
                  {availableRegionals.map((regional) => (
                    <SelectItem key={regional.id} value={regional.id}>
                      {regional.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="hidden lg:block" />
            )}

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

        <Card className="overflow-hidden border-foreground/10">
          <CardContent className="min-w-0 space-y-4 py-6">
            {error ? (
              <div className="text-destructive text-sm">{error}</div>
            ) : isInitialLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Spinner />
                <span>Memuat antrian konten...</span>
              </div>
            ) : (
              <div className="relative">
                {isRefreshing ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
                    <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
                      <Spinner />
                      <span>{loadingLabel}</span>
                    </div>
                  </div>
                ) : null}

                <Table className={isRefreshing ? "opacity-60" : undefined}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[7.5rem]">Nomor</TableHead>
                      <TableHead className="min-w-[14rem]">Judul</TableHead>
                      <TableHead className="min-w-[9.5rem]">WCC / Wilayah</TableHead>
                      <TableHead className="min-w-[8.5rem]">Platform</TableHead>
                      <TableHead className="min-w-[6.5rem]">Topik</TableHead>
                      <TableHead className="min-w-[6.5rem]">Urgensi</TableHead>
                      <TableHead className="min-w-[6rem]">Posting</TableHead>
                      <TableHead className="min-w-[8rem]">Status</TableHead>
                      <TableHead className="min-w-[7rem]">Dibuat</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                          Tidak ada konten yang cocok dengan filter saat ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="py-3 align-top">
                            <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[11px]">
                              {item.submission_code}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-72 py-3 align-top">
                            <div className="space-y-1">
                              <Link
                                href={config.detailHref(item.id)}
                                className="line-clamp-2 block whitespace-normal font-medium underline-offset-4 hover:text-primary hover:underline"
                              >
                                {item.judul}
                              </Link>
                              {item.catatan_reviewer ? (
                                <p className="line-clamp-2 whitespace-normal text-muted-foreground text-xs">
                                  Catatan: {item.catatan_reviewer}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[9.5rem] whitespace-normal py-3 align-top">
                            <div className="space-y-1 text-sm">
                              <p>{item.officer.name}</p>
                              <p className="text-muted-foreground">{item.officer.regional ?? "-"}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 align-top">
                            <PlatformIconList platforms={item.platform} className="max-w-32" />
                          </TableCell>
                          <TableCell className="max-w-[8rem] whitespace-normal py-3 align-top">
                            {formatTopikLabel(item.topik)}
                          </TableCell>
                          <TableCell className="py-3 align-top">
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[11px]",
                                getUrgencyAccentClassName(item.urgensi),
                              )}
                            >
                              {formatUrgensiLabel(item.urgensi)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 align-top">{formatDate(item.tanggal_posting)}</TableCell>
                          <TableCell className="py-3 align-top">
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[11px]",
                                getStatusAccentClassName(item.status),
                              )}
                            >
                              {formatContentStatusLabel(item.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 align-top">
                            <div className="space-y-1 text-sm">
                              <p>{formatDate(item.created_at)}</p>
                              <p className="text-muted-foreground">{formatTimeAgo(item.created_at)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 align-top">
                            <div className="flex min-w-[13.5rem] flex-wrap justify-end gap-1.5">
                              <Button
                                type="button"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                  setDecisionState({ itemId: item.id, title: item.judul, action: "approved" })
                                }
                                disabled={isMutatingItemId === item.id}
                                aria-label={`${config.primaryActionLabel} ${item.judul}`}
                                title={config.primaryActionLabel}
                              >
                                {isMutatingItemId === item.id ? (
                                  <Spinner className="size-4" />
                                ) : (
                                  <ShieldCheck className="size-4" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                  setDecisionState({ itemId: item.id, title: item.judul, action: "rejected" })
                                }
                                disabled={isMutatingItemId === item.id}
                                aria-label={`Tolak ${item.judul}`}
                                title="Tolak"
                              >
                                <X className="size-4" />
                              </Button>
                              <Button variant="outline" size="icon" className="size-8" asChild>
                                <Link
                                  href={config.detailHref(item.id)}
                                  aria-label={`Detail ${item.judul}`}
                                  title="Detail"
                                >
                                  <FileText className="size-4" />
                                </Link>
                              </Button>
                              <Button variant="outline" size="icon" className="size-8" asChild>
                                <Link
                                  href={item.drive_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Buka drive ${item.judul}`}
                                  title="Drive"
                                >
                                  <ExternalLink className="size-4" />
                                </Link>
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-8"
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
                                    setHistoryState({ open: true, title: item.judul, loading: false, items: [] });
                                  }
                                }}
                                aria-label={`Riwayat ${item.judul}`}
                                title="Riwayat"
                              >
                                <History className="size-4" />
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
          </CardContent>
        </Card>

        <Card size="sm" className="overflow-hidden border-foreground/10">
          <CardContent className="px-6 py-4">
            <TablePagination
              summary={`Halaman ${filters.page} dari ${totalPages}${displayedMeta ? ` (${displayedMeta.total} total konten)` : ""}`}
              page={filters.page}
              totalPages={totalPages}
              disabled={isLoading}
              onPageChange={(nextPage) => setFilters((previous) => ({ ...previous, page: nextPage }))}
            />
          </CardContent>
        </Card>
      </section>

      <ReviewDecisionDialog
        open={Boolean(decisionState)}
        onOpenChange={(open) => !open && setDecisionState(null)}
        itemTitle={decisionState?.title}
        mode={mode}
        action={decisionState?.action ?? "approved"}
        isSubmitting={Boolean(isMutatingItemId)}
        onSubmit={async (payload) => {
          if (!decisionState) {
            return;
          }

          try {
            const result = await decide(decisionState.itemId, payload);
            toast.success(result.message);
            setDecisionState(null);
          } catch (errorValue) {
            toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memproses keputusan review");
          }
        }}
      />

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
