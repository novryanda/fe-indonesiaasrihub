"use client";

import { useEffect, useMemo, useState } from "react";

import { Filter, RefreshCw, Search } from "lucide-react";
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
        }),
        { totalAccounts: 0, successCount: 0, failCount: 0 },
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

        <div className="grid gap-3 sm:grid-cols-3">
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
                  void listScraperLogs(INITIAL_FILTERS)
                    .then((response) => {
                      setLogs(response.data);
                    })
                    .catch((errorValue) => {
                      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat log scraping");
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
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Detail Run Scraping</DialogTitle>
            <DialogDescription>
              Tinjau informasi umum run dan hasil per akun yang diproses oleh Apify.
            </DialogDescription>
          </DialogHeader>

          {selectedLog ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Card size="sm">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Status</p>
                    <p className="mt-2 font-medium">{selectedLog.status}</p>
                  </CardContent>
                </Card>
                <Card size="sm">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Apify Run ID</p>
                    <p className="mt-2 font-medium text-sm">{selectedLog.apifyRunId ?? "-"}</p>
                  </CardContent>
                </Card>
                <Card size="sm">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Dataset ID</p>
                    <p className="mt-2 font-medium text-sm">{selectedLog.apifyDatasetId ?? "-"}</p>
                  </CardContent>
                </Card>
                <Card size="sm">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Durasi</p>
                    <p className="mt-2 font-medium">{formatDuration(selectedLog.durationMs)}</p>
                  </CardContent>
                </Card>
              </div>

              {selectedLog.errorMessage ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 text-sm">
                  {selectedLog.errorMessage}
                </div>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>Hasil per Akun</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Followers</TableHead>
                        <TableHead>Post</TableHead>
                        <TableHead>Total Reach</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedLog.results.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{result.socialAccount.profileName}</p>
                              <p className="text-muted-foreground text-xs">@{result.socialAccount.username}</p>
                            </div>
                          </TableCell>
                          <TableCell>{formatNumber(result.followers)}</TableCell>
                          <TableCell>{formatNumber(result.postCount)}</TableCell>
                          <TableCell>{formatNumber(result.totalReach)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={result.success ? getStatusClass("success") : getStatusClass("failed")}
                            >
                              {result.success ? "success" : "failed"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[260px] text-sm text-muted-foreground">
                            {result.errorReason ?? "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
