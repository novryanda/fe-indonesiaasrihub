"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { CalendarDays, ExternalLink, FolderOpen, LibraryBig, Search } from "lucide-react";

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
  formatDate,
  formatNumber,
  formatPlatformLabel,
  formatTopikLabel,
} from "@/features/content-shared/utils/content-formatters";
import { cn } from "@/lib/utils";
import { listWilayahOptions, type WilayahOption } from "@/shared/api/wilayah";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";
import { useSmoothTableData } from "@/shared/hooks/use-smooth-loading-state";

import { useContentLibrary } from "../hooks/use-content-library";
import type { BankContentItem } from "../types/content-library.type";

function StatsCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="border-foreground/10">
      <CardContent className="flex items-center gap-4 py-6">
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

function renderScopeBadge(label: string, tone: string) {
  return (
    <Badge variant="outline" className={cn("rounded-full px-3 py-1", tone)}>
      {label}
    </Badge>
  );
}

function getVisibilityBadge(item: BankContentItem) {
  switch (item.visibility_scope) {
    case "national":
      return renderScopeBadge("Nasional", "border-emerald-200 bg-emerald-50 text-emerald-700");
    case "targeted_regions":
      return renderScopeBadge("Wilayah Tertentu", "border-amber-200 bg-amber-50 text-amber-700");
    default:
      return renderScopeBadge("Internal", "border-zinc-200 bg-zinc-50 text-zinc-700");
  }
}

function getAssignmentBadge(item: BankContentItem) {
  switch (item.assignment_scope) {
    case "national":
      return renderScopeBadge("Nasional", "border-sky-200 bg-sky-50 text-sky-700");
    case "targeted_regions":
      return renderScopeBadge("Wilayah Tertentu", "border-violet-200 bg-violet-50 text-violet-700");
    default:
      return renderScopeBadge("Tidak Ada", "border-zinc-200 bg-zinc-50 text-zinc-700");
  }
}

export function ContentLibraryView() {
  const { accessToken, role, isAuthorized, isPending } = useRoleGuard([
    "qcc_wcc",
    "wcc",
    "pic_sosmed",
    "superadmin",
    "supervisi",
  ]);
  const { items, stats, meta, filters, setFilters, isLoading, error, availableTopics } = useContentLibrary(accessToken);
  const [wilayahOptions, setWilayahOptions] = useState<WilayahOption[]>([]);
  const tableState = useMemo(() => ({ items, stats, meta }), [items, meta, stats]);
  const { displayData, isInitialLoading, isRefreshing } = useSmoothTableData(tableState, isLoading);
  const displayedItems = displayData.items;
  const displayedStats = displayData.stats;
  const displayedMeta = displayData.meta;

  const totalPages = useMemo(() => {
    if (!displayedMeta) {
      return 1;
    }

    return Math.max(1, Math.ceil(displayedMeta.total / displayedMeta.limit));
  }, [displayedMeta]);

  const loadingLabel =
    filters.search.trim() ||
    filters.date_from ||
    filters.date_to ||
    filters.platform !== "all" ||
    filters.topik !== "all"
      ? "Memuat hasil filter..."
      : "Memuat bank konten...";

  useEffect(() => {
    void listWilayahOptions().then(setWilayahOptions);
  }, []);

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
    <div className="space-y-6">
      <Card className="app-bg-hero app-border-soft">
        <CardContent className="space-y-4 px-6 py-8 md:px-8">
          <Badge
            variant="outline"
            className="rounded-full border-emerald-200 bg-background/75 px-3 py-1 text-emerald-700 dark:bg-card/75"
          >
            {role === "superadmin" || role === "supervisi" ? "Konten / Bank Konten" : "Referensi / Bank Konten"}
          </Badge>
          <div className="space-y-2">
            <h1 className="font-semibold text-3xl tracking-tight">Bank Konten</h1>
            <p className="max-w-2xl text-muted-foreground text-sm leading-6">
              Kumpulan konten final yang sudah lolos approval, lengkap dengan rule visibility, assignment PIC, dan
              ringkasan distribusi.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Konten"
          value={formatNumber(displayedStats?.total_konten)}
          icon={<FolderOpen className="size-5" />}
        />
        <StatsCard
          title="Bulan Ini"
          value={formatNumber(displayedStats?.bulan_ini)}
          icon={<CalendarDays className="size-5" />}
        />
        <StatsCard
          title="Platform"
          value={formatNumber(displayedStats?.platform_count)}
          icon={<LibraryBig className="size-5" />}
        />
        <StatsCard
          title="Topik Aktif"
          value={formatNumber(displayedStats?.topik_aktif)}
          icon={<FolderOpen className="size-5" />}
        />
      </div>

      <Card>
        <CardContent className="grid gap-3 py-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.4fr)]">
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

          <Select
            value={filters.wilayah_id}
            onValueChange={(value) => setFilters((previous) => ({ ...previous, wilayah_id: value, page: 1 }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua Wilayah" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Wilayah</SelectItem>
              {wilayahOptions.map((wilayah) => (
                <SelectItem key={wilayah.id} value={wilayah.id}>
                  {wilayah.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

          <Input
            aria-label="Tanggal dibuat dari"
            type="date"
            value={filters.date_from ?? ""}
            onChange={(event) => setFilters((previous) => ({ ...previous, date_from: event.target.value, page: 1 }))}
          />

          <Input
            aria-label="Tanggal dibuat sampai"
            type="date"
            value={filters.date_to ?? ""}
            onChange={(event) => setFilters((previous) => ({ ...previous, date_to: event.target.value, page: 1 }))}
          />

          <div className="relative">
            <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cari nomor atau judul konten"
              value={filters.search}
              onChange={(event) => setFilters((previous) => ({ ...previous, search: event.target.value, page: 1 }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 py-6">
          {error ? (
            <div className="text-destructive text-sm">{error}</div>
          ) : isInitialLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Spinner />
              <span>Memuat bank konten...</span>
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
                    <TableHead>Nomor</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Topik</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Wilayah Asal</TableHead>
                    <TableHead>Visibilitas</TableHead>
                    <TableHead>Penugasan</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        Belum ada konten yang cocok dengan filter saat ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="align-top">
                          <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[11px]">
                            {item.submission_code ?? "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-80 align-top">
                          <div className="space-y-1">
                            <Link
                              href={`/konten/bank-konten/${item.id}`}
                              className="line-clamp-2 block whitespace-normal font-medium underline-offset-4 hover:text-primary hover:underline"
                            >
                              {item.judul}
                            </Link>
                            <p className="text-muted-foreground text-xs">Uploader: {item.uploaded_by}</p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">{formatTopikLabel(item.topik)}</TableCell>
                        <TableCell className="align-top">
                          <PlatformIconList platforms={item.platform} className="max-w-48" />
                        </TableCell>
                        <TableCell className="align-top">{item.regional_asal}</TableCell>
                        <TableCell className="align-top">{getVisibilityBadge(item)}</TableCell>
                        <TableCell className="align-top">{getAssignmentBadge(item)}</TableCell>
                        <TableCell className="align-top">{formatDate(item.created_at)}</TableCell>
                        <TableCell className="align-top">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/konten/bank-konten/${item.id}`}>Detail</Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link href={item.drive_link} target="_blank" rel="noreferrer">
                                <ExternalLink className="mr-2 size-4" />
                                Drive
                              </Link>
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

      <Card size="sm">
        <CardContent>
          <TablePagination
            summary={`Halaman ${filters.page} dari ${totalPages}${displayedMeta ? ` (${displayedMeta.total} total konten)` : ""}`}
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
