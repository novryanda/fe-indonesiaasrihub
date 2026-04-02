"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Clock3, ExternalLink, FileText, History, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
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

import { useContentQueue } from "../hooks/use-content-queue";
import type { ApprovalBoardMode, ReviewDecisionPayload } from "../types/content-approval.type";
import { ReviewDecisionDialog } from "./review-decision-dialog";
import { ReviewHistoryDialog } from "./review-history-dialog";

function getBoardConfig(mode: ApprovalBoardMode) {
  return mode === "regional-review"
    ? {
        title: "Review Konten",
        subtitle: "Admin Regional / Review Konten",
        description: "Halaman ini hanya dipakai untuk backlog lama yang masih berada di tahap review regional.",
        allowedRoles: ["qcc_wcc"] as const,
        primaryActionLabel: "Setujui Review",
        detailHref: (contentId: string) => `/dashboard/review-konten/${contentId}`,
      }
    : {
        title: "Final Approval",
        subtitle: "Superadmin / Final Approval",
        description: "Setujui konten yang diajukan oleh WCC.",
        allowedRoles: ["superadmin"] as const,
        primaryActionLabel: "Setujui Final",
        detailHref: (contentId: string) => `/dashboard/approval/${contentId}`,
      };
}

function StageBadges({ mode }: { mode: ApprovalBoardMode }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white">WCC</Badge>
      {mode === "regional-review" && (
        <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white">QCC/WCC</Badge>
      )}
      <Badge
        className={
          mode === "final-approval"
            ? "rounded-full bg-emerald-600 px-3 py-1 text-white"
            : "rounded-full border border-border px-3 py-1"
        }
      >
        Superadmin
      </Badge>
      <Badge variant="outline" className="rounded-full px-3 py-1">
        Bank Konten
      </Badge>
    </div>
  );
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

  const totalPages = useMemo(() => {
    if (!meta) {
      return 1;
    }

    return Math.max(1, Math.ceil(meta.total / meta.limit));
  }, [meta]);

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
          <CardContent className="space-y-4 px-6 py-8 md:px-8">
            <Badge variant="outline" className="rounded-full border-emerald-200 bg-background/75 dark:bg-card/75 px-3 py-1 text-emerald-700">
              {config.subtitle}
            </Badge>
            <div className="space-y-2">
              <h1 className="font-semibold text-3xl tracking-tight">{config.title}</h1>
              <p className="max-w-2xl text-muted-foreground text-sm leading-6">{config.description}</p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-background/75 p-4 dark:bg-card/75">
              <p className="font-medium text-emerald-800 text-sm">
                {meta?.total ?? items.length} konten menunggu{" "}
                {mode === "final-approval" ? "final approval" : "final approval"}.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-3 py-6 lg:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.8fr))_repeat(2,minmax(0,0.7fr))]">
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
                  <SelectValue placeholder="Semua Regional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Regional</SelectItem>
                  {availableRegionals.map((regional) => (
                    <SelectItem key={regional} value={regional}>
                      {regional}
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

        {error ? (
          <Card>
            <CardContent className="py-6 text-destructive">{error}</CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Spinner />
              <span>Memuat antrian konten...</span>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              Tidak ada konten yang cocok dengan filter saat ini.
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="overflow-hidden border-foreground/10">
              <CardContent className="space-y-5 py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-xl">{item.judul}</h2>
                      {item.platform.map((platform) => (
                        <Badge
                          key={platform}
                          variant="outline"
                          className={cn("rounded-full px-3 py-1", getPlatformAccentClassName(platform))}
                        >
                          {formatPlatformLabel(platform)}
                        </Badge>
                      ))}
                      <Badge
                        variant="outline"
                        className={cn("rounded-full px-3 py-1", getStatusAccentClassName(item.status))}
                      >
                        {formatContentStatusLabel(item.status)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {item.officer.name} • {item.officer.regional ?? "Regional belum tersedia"} •{" "}
                      {formatTimeAgo(item.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Clock3 className="size-3.5" />
                    {formatDate(item.created_at)}
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/30 p-4 text-sm leading-6">
                  {item.caption || "Caption belum tersedia."}
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {formatTopikLabel(item.topik)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("rounded-full px-3 py-1", getUrgencyAccentClassName(item.urgensi))}
                  >
                    {formatUrgensiLabel(item.urgensi)}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    Posting {formatDate(item.tanggal_posting)}
                  </Badge>
                </div>

                {item.catatan_reviewer && (
                  <div className="rounded-2xl border border-dashed px-4 py-3 text-sm">
                    <p className="font-medium">Catatan WCC</p>
                    <p className="mt-1 text-muted-foreground">{item.catatan_reviewer}</p>
                  </div>
                )}

                <StageBadges mode={mode} />

                <div className="flex flex-wrap gap-2 border-border/60 border-t pt-4">
                  <Button
                    type="button"
                    onClick={() => setDecisionState({ itemId: item.id, title: item.judul, action: "approved" })}
                    disabled={isMutatingItemId === item.id}
                  >
                    {isMutatingItemId === item.id && <Spinner className="mr-2" />}
                    <ShieldCheck className="mr-2 size-4" />
                    {config.primaryActionLabel}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDecisionState({ itemId: item.id, title: item.judul, action: "rejected" })}
                    disabled={isMutatingItemId === item.id}
                  >
                    Tolak
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={config.detailHref(item.id)}>
                      <FileText className="mr-2 size-4" />
                      Detail
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={item.drive_link} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 size-4" />
                      Buka Drive
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      setHistoryState({ open: true, title: item.judul, loading: true, items: [] });
                      try {
                        const historyItems = await loadHistory(item.id);
                        setHistoryState({ open: true, title: item.judul, loading: false, items: historyItems });
                      } catch (errorValue) {
                        toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat riwayat review");
                        setHistoryState({ open: true, title: item.judul, loading: false, items: [] });
                      }
                    }}
                  >
                    <History className="mr-2 size-4" />
                    Riwayat Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        <Card size="sm">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              Halaman {filters.page} dari {totalPages} {meta ? `(${meta.total} total konten)` : ""}
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
