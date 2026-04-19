"use client";

import { useEffect, useMemo, useState } from "react";

import { CircleDollarSign, Clock3, Cpu, Filter, RefreshCw, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PLATFORM_OPTIONS } from "@/features/content-shared/constants/content-options";
import { PlatformIcon } from "@/features/content-shared/components/platform-icon";
import { formatDateTime, formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { getScraperLogDetail, listScraperLogs } from "../api/scraper-api";
import type { ScraperLogDetail, ScraperLogItem, ScraperLogsQuery, ScraperRunStatus } from "../types/scraper.type";

const INITIAL_FILTERS: ScraperLogsQuery = {
  status: "all",
  platform: "all",
  dateFrom: "",
  dateTo: "",
  page: 1,
  limit: 20,
};

function getStatusClass(status: ScraperRunStatus) {
  switch (status) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "failed":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "partial":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "running":
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
  }
}

function getTriggerLabel(triggerType: ScraperLogDetail["triggerType"]) {
  switch (triggerType) {
    case "scheduled":
      return "Terjadwal";
    case "on_register":
      return "Saat Register";
    case "manual":
      return "Manual";
    default:
      return triggerType;
  }
}

function formatDuration(durationMs: number | null) {
  if (durationMs === null) {
    return "-";
  }

  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function formatNumber(value: number | null) {
  if (value === null) {
    return "-";
  }

  return new Intl.NumberFormat("id-ID").format(value);
}

function formatDecimal(value: number | null) {
  if (value === null) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(value);
}

function formatUsd(value: number | null) {
  if (value === null) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: 6,
  }).format(value);
}

function formatUsageKey(key: string) {
  return key
    .split(/[_-]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function ScraperLogView() {
  const { isAuthorized, isPending } = useRoleGuard(["sysadmin"]);
  const [filters, setFilters] = useState<ScraperLogsQuery>(INITIAL_FILTERS);
  const [logs, setLogs] = useState<ScraperLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ScraperLogDetail | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const response = await listScraperLogs(filters);
      setLogs(response.data);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat log scraping");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending && isAuthorized) {
      void loadLogs();
    }
  }, [isAuthorized, isPending]);

  const totalRunSummary = useMemo(
    () =>
      logs.reduce(
        (summary, log) => ({
          totalAccounts: summary.totalAccounts + log.totalAccounts,
          successCount: summary.successCount + log.successCount,
          failCount: summary.failCount + log.failCount,
          totalCost:
            summary.totalCost + (typeof log.costSummary?.usageTotalUsd === "number" ? log.costSummary.usageTotalUsd : 0),
          hasCost: summary.hasCost || typeof log.costSummary?.usageTotalUsd === "number",
        }),
        { totalAccounts: 0, successCount: 0, failCount: 0, totalCost: 0, hasCost: false },
      ),
    [logs],
  );

  const handleApplyFilters = async () => {
    await loadLogs();
  };

  const handleOpenDetail = async (logId: string) => {
    setDetailLoadingId(logId);
    try {
      const response = await getScraperLogDetail(logId);
      setSelectedLog(response.data);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat detail log");
    } finally {
      setDetailLoadingId(null);
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
    <>
      <div className="space-y-6">
        <Card className="app-bg-hero app-border-soft">
          <CardContent className="space-y-4 px-6 py-8 md:px-8">
            <Badge
              variant="outline"
              className="rounded-full border-amber-200 bg-background/75 px-3 py-1 text-amber-700 dark:bg-card/75"
            >
              System / Monitoring
            </Badge>
            <div className="space-y-2">
              <h1 className="font-semibold text-3xl tracking-tight">Log Scraping</h1>
              <p className="max-w-2xl text-muted-foreground text-sm leading-6">
                Pantau hasil run Apify, termasuk jumlah akun yang berhasil diproses, kegagalan, dan detail per akun.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Total Akun Diproses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-2xl">{formatNumber(totalRunSummary.totalAccounts)}</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Total Sukses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-2xl text-emerald-700">{formatNumber(totalRunSummary.successCount)}</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Total Gagal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-2xl text-rose-700">{formatNumber(totalRunSummary.failCount)}</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Total Biaya Apify</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-2xl text-sky-700">
                {formatUsd(totalRunSummary.hasCost ? totalRunSummary.totalCost : null)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="size-4" />
              Filter Log
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-5">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={filters.status ?? "all"}
                onValueChange={(value) =>
                  setFilters((previous) => ({ ...previous, status: value as ScraperLogsQuery["status"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Platform</Label>
              <Select
                value={filters.platform ?? "all"}
                onValueChange={(value) =>
                  setFilters((previous) => ({ ...previous, platform: value as ScraperLogsQuery["platform"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua platform</SelectItem>
                  {PLATFORM_OPTIONS.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      {platform.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Tanggal Dari</Label>
              <Input
                type="date"
                value={filters.dateFrom ?? ""}
                onChange={(event) => setFilters((previous) => ({ ...previous, dateFrom: event.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label>Tanggal Sampai</Label>
              <Input
                type="date"
                value={filters.dateTo ?? ""}
                onChange={(event) => setFilters((previous) => ({ ...previous, dateTo: event.target.value }))}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button className="flex-1" onClick={() => void handleApplyFilters()} disabled={isLoading}>
                {isLoading ? <Spinner className="mr-2" /> : <Search className="mr-2 size-4" />}
                Terapkan
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFilters(INITIAL_FILTERS);
                  setIsLoading(true);
                  void listScraperLogs(INITIAL_FILTERS)
                    .then((response) => {
                      setLogs(response.data);
                    })
                    .catch((errorValue) => {
                      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat log scraping");
                    })
                    .finally(() => {
                      setIsLoading(false);
                    });
                }}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Run</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Spinner />
                <span>Memuat log scraping...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal Mulai</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total / Sukses / Gagal</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Biaya</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        Belum ada log scraping yang sesuai filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDateTime(log.startedAt)}</TableCell>
                        <TableCell>{getTriggerLabel(log.triggerType)}</TableCell>
                        <TableCell>
                          <PlatformIcon platform={log.platform} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusClass(log.status)}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.totalAccounts} / {log.successCount} / {log.failCount}
                        </TableCell>
                        <TableCell>{formatDuration(log.durationMs)}</TableCell>
                        <TableCell>{formatUsd(log.costSummary?.usageTotalUsd ?? null)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleOpenDetail(log.id)}
                              disabled={detailLoadingId === log.id}
                            >
                              {detailLoadingId === log.id && <Spinner className="mr-2" />}
                              Lihat Detail
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
      </div>

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-h-[90vh] max-w-[min(1100px,calc(100vw-2rem))] gap-0 overflow-hidden p-0">
          {selectedLog ? (
            <>
              <div className="border-b bg-slate-50/80 px-6 py-5">
                <DialogHeader className="space-y-3 text-left">
                  <div className="space-y-2">
                    <DialogTitle className="text-xl">Detail Run Scraping</DialogTitle>
                    <DialogDescription className="max-w-3xl text-sm leading-6">
                      Tinjau status run, biaya dari Apify, dan hasil per akun untuk platform{" "}
                      {formatPlatformLabel(selectedLog.platform)}.
                    </DialogDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={getStatusClass(selectedLog.status)}>
                      {selectedLog.status}
                    </Badge>
                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                      {getTriggerLabel(selectedLog.triggerType)}
                    </Badge>
                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                      {formatPlatformLabel(selectedLog.platform)}
                    </Badge>
                  </div>
                </DialogHeader>
              </div>

              <div className="max-h-[calc(90vh-96px)] space-y-5 overflow-y-auto px-6 py-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Card size="sm" className="border-slate-200 shadow-none">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.18em]">
                        <Users className="size-3.5" />
                        Total Akun
                      </div>
                      <p className="mt-3 font-semibold text-2xl">{formatNumber(selectedLog.totalAccounts)}</p>
                      <p className="mt-1 text-muted-foreground text-xs">
                        {selectedLog.successCount} sukses / {selectedLog.failCount} gagal
                      </p>
                    </CardContent>
                  </Card>
                  <Card size="sm" className="border-slate-200 shadow-none">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.18em]">
                        <Clock3 className="size-3.5" />
                        Durasi
                      </div>
                      <p className="mt-3 font-semibold text-2xl">{formatDuration(selectedLog.durationMs)}</p>
                      <p className="mt-1 text-muted-foreground text-xs">
                        Mulai {formatDateTime(selectedLog.startedAt)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card size="sm" className="border-slate-200 shadow-none">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.18em]">
                        <CircleDollarSign className="size-3.5" />
                        Total Cost
                      </div>
                      <p className="mt-3 font-semibold text-2xl text-sky-700">
                        {formatUsd(selectedLog.costSummary?.usageTotalUsd ?? null)}
                      </p>
                      <p className="mt-1 text-muted-foreground text-xs">
                        Total biaya informatif dari endpoint Apify
                      </p>
                    </CardContent>
                  </Card>
                  <Card size="sm" className="border-slate-200 shadow-none">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.18em]">
                        <Cpu className="size-3.5" />
                        Compute Units
                      </div>
                      <p className="mt-3 font-semibold text-2xl">{formatDecimal(selectedLog.costSummary?.computeUnits ?? null)}</p>
                      <p className="mt-1 text-muted-foreground text-xs">Akumulasi compute units seluruh run akun</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Apify Run ID</p>
                    <p className="mt-2 break-all font-mono text-sm">{selectedLog.apifyRunId ?? "-"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Dataset ID</p>
                    <p className="mt-2 break-all font-mono text-sm">{selectedLog.apifyDatasetId ?? "-"}</p>
                  </div>
                </div>

                {selectedLog.errorMessage ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-700 text-sm">
                    <p className="font-medium">Pesan error run</p>
                    <p className="mt-1 break-words leading-6">{selectedLog.errorMessage}</p>
                  </div>
                ) : null}

                {selectedLog.costSummary && Object.keys(selectedLog.costSummary.usageUsd).length > 0 ? (
                  <Card className="border-slate-200 shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Breakdown Biaya Apify</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {Object.entries(selectedLog.costSummary.usageUsd).map(([key, value]) => (
                        <Badge key={key} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                          {formatUsageKey(key)}: {formatUsd(value)}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}

                <Card className="border-slate-200 shadow-none">
                  <CardHeader>
                    <CardTitle>Hasil per Akun</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table className="min-w-[1080px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Apify Run</TableHead>
                            <TableHead>Followers</TableHead>
                            <TableHead>Post</TableHead>
                            <TableHead>Total Reach</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead>Compute Units</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Error</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedLog.results.map((result) => (
                            <TableRow key={result.id}>
                              <TableCell className="align-top">
                                <div>
                                  <p className="font-medium">{result.socialAccount.profileName}</p>
                                  <p className="text-muted-foreground text-xs">@{result.socialAccount.username}</p>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[180px] align-top font-mono text-xs">
                                <span className="break-all">{result.apifyRunId ?? "-"}</span>
                              </TableCell>
                              <TableCell className="align-top">{formatNumber(result.followers)}</TableCell>
                              <TableCell className="align-top">{formatNumber(result.postCount)}</TableCell>
                              <TableCell className="align-top">{formatNumber(result.totalReach)}</TableCell>
                              <TableCell className="align-top">
                                <div>
                                  <p className="font-medium text-sky-700">{formatUsd(result.cost.usageTotalUsd)}</p>
                                  <p className="text-muted-foreground text-xs">{result.cost.pricingModel ?? "-"}</p>
                                </div>
                              </TableCell>
                              <TableCell className="align-top">{formatDecimal(result.cost.computeUnits)}</TableCell>
                              <TableCell className="align-top">
                                <Badge
                                  variant="outline"
                                  className={result.success ? getStatusClass("success") : getStatusClass("failed")}
                                >
                                  {result.success ? "success" : "failed"}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[320px] align-top whitespace-normal break-words text-sm text-muted-foreground">
                                {result.errorReason ?? "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
