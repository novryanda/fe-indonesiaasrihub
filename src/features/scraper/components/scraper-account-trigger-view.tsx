"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { ExternalLink, Play, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { PlatformIcon } from "@/features/content-shared/components/platform-icon";
import { formatDateTime, formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import {
  listSocialAccounts,
  triggerManualSocialAccountFullScrape,
  triggerManualSocialAccountProfileScrape,
} from "@/features/social-accounts/api/social-accounts-api";
import type { SocialAccountItem, SocialAccountListMeta } from "@/features/social-accounts/types/social-account.type";
import { cn } from "@/lib/utils";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

const PAGE_SIZE = 20;
const INITIAL_META: SocialAccountListMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
};
const PLATFORM_FILTERS = ["all", "instagram", "tiktok", "youtube", "facebook", "x"] as const;

function getVerificationBadgeClass(status: SocialAccountItem["verification_status"]) {
  switch (status) {
    case "verified":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getDelegationBadgeClass(status: SocialAccountItem["delegation_status"]) {
  switch (status) {
    case "sudah_didelegasikan":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "delegasi_dicabut":
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
    default:
      return "border-orange-200 bg-orange-50 text-orange-700";
  }
}

function formatVerificationLabel(status: SocialAccountItem["verification_status"]) {
  switch (status) {
    case "verified":
      return "Verified";
    case "rejected":
      return "Rejected";
    default:
      return "Pending";
  }
}

function formatDelegationLabel(status: SocialAccountItem["delegation_status"]) {
  switch (status) {
    case "sudah_didelegasikan":
      return "Sudah Didelegasikan";
    case "delegasi_dicabut":
      return "Delegasi Dicabut";
    default:
      return "Belum Didelegasikan";
  }
}

export function ScraperAccountTriggerView() {
  const { isAuthorized, isPending } = useRoleGuard(["sysadmin"]);
  const [items, setItems] = useState<SocialAccountItem[]>([]);
  const [meta, setMeta] = useState<SocialAccountListMeta>(INITIAL_META);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORM_FILTERS)[number]>("all");
  const [runningAction, setRunningAction] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listSocialAccounts({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        platform,
      });
      setItems(response.data);
      setMeta(response.meta ?? { ...INITIAL_META, page, total: response.data.length });
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat daftar akun sosmed");
    } finally {
      setLoading(false);
    }
  }, [page, platform, search]);

  useEffect(() => {
    if (!isPending && isAuthorized) {
      void loadAccounts();
    }
  }, [isAuthorized, isPending, loadAccounts]);

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  const handleTriggerProfileScrape = async (item: SocialAccountItem) => {
    setRunningAction(`${item.id}:profile`);
    try {
      const response = await triggerManualSocialAccountProfileScrape(item.id);
      toast.success(response.data.message);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memicu tarik data profil");
    } finally {
      setRunningAction(null);
    }
  };

  const handleTriggerFullScrape = async (item: SocialAccountItem) => {
    setRunningAction(`${item.id}:full`);
    try {
      const response = await triggerManualSocialAccountFullScrape(item.id);
      toast.success(response.data.message);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memicu tarik data keseluruhan akun");
    } finally {
      setRunningAction(null);
    }
  };

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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="rounded-full border-sky-200 bg-background/75 px-3 py-1 text-sky-700 dark:bg-card/75"
              >
                System / Scraper
              </Badge>
              <div className="space-y-2">
                <h1 className="font-semibold text-3xl tracking-tight">Tarik Scrape Per Akun</h1>
                <p className="max-w-3xl text-muted-foreground text-sm leading-6">
                  Sysadmin dapat memicu dua jenis proses per akun: tarik data profil cepat atau tarik data keseluruhan
                  akun. Gunakan halaman ini untuk refresh akun tertentu tanpa menunggu jadwal scraping massal.
                </p>
              </div>
            </div>

            <Button asChild variant="outline">
              <Link href="/system/log-scrapping">
                <RefreshCw className="mr-2 size-4" />
                Buka Log Scraping
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Total Akun</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-2xl">{meta.summary?.total_accounts ?? meta.total}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Akun Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-2xl text-emerald-700">{meta.summary?.verified_accounts ?? 0}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Akun Delegasi Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-2xl text-sky-700">{meta.summary?.delegated_accounts ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Akun</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_auto]">
          <div className="relative">
            <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cari nama profil, username, wilayah, atau PIC"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <Select
            value={platform}
            onValueChange={(value) => {
              setPage(1);
              setPlatform(value as (typeof PLATFORM_FILTERS)[number]);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua platform</SelectItem>
              {PLATFORM_FILTERS.filter((item) => item !== "all").map((item) => (
                <SelectItem key={item} value={item}>
                  {formatPlatformLabel(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="button" variant="outline" onClick={() => void loadAccounts()} disabled={loading}>
            <RefreshCw className="mr-2 size-4" />
            Muat Ulang
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Akun Sosmed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Spinner />
              <span>Memuat akun sosmed...</span>
            </div>
          ) : (
            <Table className="min-w-[1160px] table-auto">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[22rem] px-3 py-3 whitespace-normal">Akun</TableHead>
                  <TableHead className="min-w-[10rem] px-3 py-3">Wilayah</TableHead>
                  <TableHead className="min-w-[11rem] px-3 py-3">PIC</TableHead>
                  <TableHead className="min-w-[12rem] px-3 py-3">Status</TableHead>
                  <TableHead className="min-w-[10rem] px-3 py-3 whitespace-normal">Stat Terakhir</TableHead>
                  <TableHead className="min-w-[18rem] px-3 py-3 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Tidak ada akun yang cocok dengan filter saat ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="px-3 py-4 whitespace-normal align-top">
                        <div className="max-w-[34rem] space-y-1">
                          <div className="flex items-center gap-2">
                            <PlatformIcon platform={item.platform} />
                            <p className="break-words font-medium leading-6">{item.nama_profil}</p>
                          </div>
                          <p className="break-all text-muted-foreground text-sm">{item.username}</p>
                          <p className="text-muted-foreground text-xs">{formatPlatformLabel(item.platform)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-4 whitespace-normal align-top">
                        <div className="space-y-1">
                          <p className="font-medium">{item.wilayah_name}</p>
                          <p className="text-muted-foreground text-xs">
                            {item.officer_regional ?? "Belum ada regional PIC"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-4 whitespace-normal align-top">
                        <div className="space-y-1">
                          <p className="font-medium">{item.officer_name ?? "-"}</p>
                          <p className="text-muted-foreground text-xs">
                            {item.officer_id ? "PIC terhubung" : "Belum didelegasikan"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-4 align-top">
                        <div className="flex max-w-[14rem] flex-col items-start gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full px-3 py-1",
                              getVerificationBadgeClass(item.verification_status),
                            )}
                          >
                            {formatVerificationLabel(item.verification_status)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn("rounded-full px-3 py-1", getDelegationBadgeClass(item.delegation_status))}
                          >
                            {formatDelegationLabel(item.delegation_status)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-4 whitespace-normal align-top">
                        <p className="text-sm leading-6">
                          {item.last_stat_update ? (
                            <span className="font-medium text-foreground">{formatDateTime(item.last_stat_update)}</span>
                          ) : (
                            <span className="text-muted-foreground">Belum pernah scrape</span>
                          )}
                        </p>
                      </TableCell>
                      <TableCell className="px-3 py-4 align-top">
                        <div className="grid min-w-[17rem] gap-2 sm:grid-cols-2">
                          <Button asChild variant="outline" size="sm" className="justify-center">
                            <a href={item.profile_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="mr-2 size-4" />
                              Profil
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="justify-center"
                            onClick={() => void handleTriggerProfileScrape(item)}
                            disabled={runningAction !== null}
                          >
                            {runningAction === `${item.id}:profile` ? (
                              <Spinner className="mr-2" />
                            ) : (
                              <Play className="mr-2 size-4" />
                            )}
                            Tarik Profil
                          </Button>
                          <Button
                            size="sm"
                            className="justify-center sm:col-span-2"
                            onClick={() => void handleTriggerFullScrape(item)}
                            disabled={runningAction !== null}
                          >
                            {runningAction === `${item.id}:full` ? (
                              <Spinner className="mr-2" />
                            ) : (
                              <Play className="mr-2 size-4" />
                            )}
                            Tarik Semua Data
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
            summary={`Halaman ${page} dari ${totalPages} (${meta.total} total akun)`}
            page={page}
            totalPages={totalPages}
            disabled={loading}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
