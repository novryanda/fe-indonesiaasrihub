"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";

import { Clock3, Filter, Globe2, MapPin, RefreshCw, ScrollText, Search, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { formatDateTime, formatTimeAgo } from "@/features/content-shared/utils/content-formatters";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { getActivityLogDetail, listActivityLogs } from "../api/activity-log-api";
import type { ActivityLogItem, ActivityLogStats, ActivityLogsQuery } from "../types/activity-log.type";

const INITIAL_FILTERS: ActivityLogsQuery = {
  search: "",
  entityName: "",
  action: "",
  dateFrom: "",
  dateTo: "",
  page: 1,
  limit: 20,
};

function formatLocation(item: ActivityLogItem) {
  const parts = [item.location.city, item.location.region, item.location.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Lokasi IP belum tersedia";
}

function formatGps(item: ActivityLogItem) {
  if (item.gps.latitude === null || item.gps.longitude === null) {
    return "GPS belum tersedia";
  }

  const coordinates = `${item.gps.latitude.toFixed(5)}, ${item.gps.longitude.toFixed(5)}`;
  const accuracy = item.gps.accuracy !== null ? `Akurasi ±${Math.round(item.gps.accuracy)} m` : null;

  return accuracy ? `${coordinates} · ${accuracy}` : coordinates;
}

function formatDuration(durationMs: number | null) {
  if (durationMs === null) {
    return "-";
  }

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  return `${(durationMs / 1000).toFixed(2)} dtk`;
}

function getSourceClassName(source: string) {
  return source === "request" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function getResultClassName(result: string | null) {
  if (result === "error") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (result === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function safeJsonStringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "Payload tidak dapat ditampilkan.";
  }
}

function SummaryCard({
  label,
  value,
  caption,
  icon: Icon,
  emphasis = "default",
}: {
  label: string;
  value: string;
  caption?: string | null;
  icon: typeof UserRound;
  emphasis?: "default" | "accent";
}) {
  return (
    <div
      className={[
        "rounded-3xl border px-5 py-4 shadow-sm",
        emphasis === "accent" ? "border-sky-200/80 bg-sky-50/80" : "border-border/70 bg-background/80",
      ].join(" ")}
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          className={[
            "flex size-10 shrink-0 items-center justify-center rounded-2xl border",
            emphasis === "accent"
              ? "border-sky-200 bg-white text-sky-700"
              : "border-border/70 bg-muted/50 text-muted-foreground",
          ].join(" ")}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.24em]">{label}</p>
          <p className="mt-1 font-semibold text-foreground text-sm leading-6">{value}</p>
        </div>
      </div>
      {caption ? <p className="text-muted-foreground text-sm leading-6">{caption}</p> : null}
    </div>
  );
}

function MetadataItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
      <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.2em]">{label}</p>
      <p
        className={["mt-2 break-words text-foreground text-sm leading-6", mono ? "font-mono text-[13px]" : ""].join(
          " ",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function ActivityLogView() {
  const { isAuthorized, isPending } = useRoleGuard(["sysadmin"]);
  const [filters, setFilters] = useState<ActivityLogsQuery>(INITIAL_FILTERS);
  const [stats, setStats] = useState<ActivityLogStats>({
    totalLogs: 0,
    todayLogs: 0,
    uniqueActors: 0,
    requestLogs: 0,
  });
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / (filters.limit ?? INITIAL_FILTERS.limit ?? 20))),
    [filters.limit, totalItems],
  );

  const loadLogs = useEffectEvent(async (nextFilters: ActivityLogsQuery) => {
    setIsLoading(true);
    try {
      const response = await listActivityLogs(nextFilters);
      setStats(response.data.stats);
      setLogs(response.data.items);
      setTotalItems(response.meta?.total ?? response.data.items.length);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat activity log");
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    if (!isPending && isAuthorized) {
      void loadLogs(filters);
    }
  }, [filters, isAuthorized, isPending]);

  const handleOpenDetail = async (logId: string) => {
    setDetailLoadingId(logId);
    try {
      const response = await getActivityLogDetail(logId);
      setSelectedLog(response.data);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat detail activity log");
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
              System / Audit Trail
            </Badge>
            <div className="space-y-2">
              <h1 className="font-semibold text-3xl tracking-tight">Log Activity</h1>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Total Aktivitas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-2xl">{stats.totalLogs}</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Aktivitas Hari Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-2xl text-sky-700">{stats.todayLogs}</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>User Unik</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-2xl text-emerald-700">{stats.uniqueActors}</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Request Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-2xl text-amber-700">{stats.requestLogs}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="size-4" />
              Filter Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-5">
            <div className="grid gap-2 md:col-span-2">
              <Label>Pencarian</Label>
              <div className="relative">
                <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Cari actor, action, entity, atau email"
                  value={filters.search ?? ""}
                  onChange={(event) =>
                    setFilters((previous) => ({
                      ...previous,
                      search: event.target.value,
                      page: 1,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Entity</Label>
              <Input
                placeholder="Contoh: users"
                value={filters.entityName ?? ""}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    entityName: event.target.value,
                    page: 1,
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Tanggal Dari</Label>
              <Input
                type="date"
                value={filters.dateFrom ?? ""}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    dateFrom: event.target.value,
                    page: 1,
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Tanggal Sampai</Label>
              <Input
                type="date"
                value={filters.dateTo ?? ""}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    dateTo: event.target.value,
                    page: 1,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="size-4" />
              Aktivitas Tercatat
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => void loadLogs(filters)} disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2" /> : <RefreshCw className="mr-2 size-4" />}
              Muat Ulang
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Spinner />
                <span>Memuat activity log...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Aktivitas</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>IP & Lokasi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Belum ada activity log yang cocok dengan filter saat ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="align-top">
                          <div className="space-y-1 text-sm">
                            <p>{formatDateTime(log.createdAt)}</p>
                            <p className="text-muted-foreground">{formatTimeAgo(log.createdAt)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{log.actor?.name ?? "System / Unknown"}</p>
                            <p className="text-muted-foreground text-xs">
                              {log.actor ? `${log.actor.email} · ${log.actor.role}` : "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-2">
                            <p className="font-medium text-sm">{log.action}</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className={getSourceClassName(log.source)}>
                                {log.source}
                              </Badge>
                              {log.method ? (
                                <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700">
                                  {log.method}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">{log.entityName}</p>
                            <p className="break-all text-muted-foreground text-xs">{log.entityId}</p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-1 text-sm">
                            <p>{log.ipAddress ?? "-"}</p>
                            <p className="inline-flex items-start gap-1 text-muted-foreground text-xs">
                              <MapPin className="mt-0.5 size-3.5 shrink-0" />
                              <span>{formatLocation(log)}</span>
                            </p>
                            {log.gps.latitude !== null && log.gps.longitude !== null ? (
                              <p className="text-muted-foreground text-xs">GPS: {formatGps(log)}</p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-2">
                            <Badge variant="outline" className={getResultClassName(log.result)}>
                              {log.result ?? "domain"}
                            </Badge>
                            <p className="text-muted-foreground text-xs">
                              {log.statusCode ? `HTTP ${log.statusCode}` : formatDuration(log.durationMs)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleOpenDetail(log.id)}
                              disabled={detailLoadingId === log.id}
                            >
                              {detailLoadingId === log.id ? <Spinner className="mr-2" /> : null}
                              Detail
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            <TablePagination
              summary={`Halaman ${filters.page ?? 1} dari ${totalPages}${totalItems ? ` (${totalItems} total aktivitas)` : ""}`}
              page={filters.page ?? 1}
              totalPages={totalPages}
              disabled={isLoading}
              onPageChange={(nextPage) =>
                setFilters((previous) => ({
                  ...previous,
                  page: nextPage,
                }))
              }
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="h-[min(90vh,56rem)] w-[min(72rem,calc(100vw-2rem))] max-w-none overflow-hidden p-0 sm:max-w-none">
          {selectedLog ? (
            <div className="grid max-h-[min(90vh,56rem)] grid-rows-[auto_1fr] overflow-hidden">
              <div className="border-border/60 border-b bg-linear-to-br from-sky-50 via-background to-background px-6 py-6 sm:px-8">
                <DialogHeader className="gap-4 pr-12">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full border-sky-200 bg-white/80 px-3 py-1 text-sky-700">
                      Audit Trail
                    </Badge>
                    <Badge variant="outline" className={getSourceClassName(selectedLog.source)}>
                      {selectedLog.source}
                    </Badge>
                    {selectedLog.method ? (
                      <Badge variant="outline" className="border-zinc-200 bg-white/80 text-zinc-700">
                        {selectedLog.method}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <DialogTitle className="text-2xl leading-tight">Detail Activity Log</DialogTitle>
                    <DialogDescription className="max-w-3xl text-sm leading-6">
                      Tinjau actor, metadata request, IP, lokasi, GPS, dan payload mentah aktivitas secara lebih rapi.
                    </DialogDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                    <span className="inline-flex items-center gap-2">
                      <Clock3 className="size-4" />
                      {formatDateTime(selectedLog.createdAt)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <ShieldCheck className="size-4" />
                      {selectedLog.result ?? "domain"}
                    </span>
                  </div>
                </DialogHeader>
              </div>

              <div className="overflow-y-auto px-6 py-6 sm:px-8">
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                      label="Actor"
                      value={selectedLog.actor?.name ?? "System / Unknown"}
                      caption={selectedLog.actor ? `${selectedLog.actor.email} · ${selectedLog.actor.role}` : "-"}
                      icon={UserRound}
                      emphasis="accent"
                    />
                    <SummaryCard
                      label="Aksi"
                      value={selectedLog.action}
                      caption={`${selectedLog.entityName} · ${selectedLog.entityId}`}
                      icon={ScrollText}
                    />
                    <SummaryCard
                      label="Jaringan"
                      value={selectedLog.ipAddress ?? "-"}
                      caption={formatLocation(selectedLog)}
                      icon={Globe2}
                    />
                    <SummaryCard
                      label="GPS"
                      value={formatGps(selectedLog)}
                      caption={
                        selectedLog.gps.capturedAt ? formatDateTime(selectedLog.gps.capturedAt) : "Belum tersedia"
                      }
                      icon={MapPin}
                    />
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
                    <Card className="gap-0 border border-border/70 shadow-sm">
                      <CardHeader className="space-y-1 border-border/60 border-b pb-5">
                        <CardTitle className="text-lg">Metadata</CardTitle>
                        <p className="text-muted-foreground text-sm leading-6">
                          Ringkasan identitas request dan konteks perangkat yang tercatat.
                        </p>
                      </CardHeader>
                      <CardContent className="grid gap-3 pt-5">
                        <MetadataItem label="Target" value={`${selectedLog.entityName} · ${selectedLog.entityId}`} />
                        <MetadataItem label="Path" value={selectedLog.path ?? "-"} mono />
                        <MetadataItem label="Route Pattern" value={selectedLog.route ?? "-"} mono />
                        <MetadataItem
                          label="Request"
                          value={
                            selectedLog.method
                              ? `${selectedLog.method} · ${selectedLog.statusCode ? `HTTP ${selectedLog.statusCode}` : formatDuration(selectedLog.durationMs)}`
                              : formatDuration(selectedLog.durationMs)
                          }
                        />
                        <MetadataItem label="User Agent" value={selectedLog.userAgent ?? "-"} />
                        <MetadataItem
                          label="Waktu"
                          value={`${formatDateTime(selectedLog.createdAt)} · ${formatTimeAgo(selectedLog.createdAt)}`}
                        />
                      </CardContent>
                    </Card>

                    <Card className="gap-0 border border-border/70 shadow-sm">
                      <CardHeader className="space-y-1 border-border/60 border-b pb-5">
                        <CardTitle className="text-lg">Payload</CardTitle>
                        <p className="text-muted-foreground text-sm leading-6">
                          JSON mentah audit log untuk penelusuran teknis dan verifikasi data.
                        </p>
                      </CardHeader>
                      <CardContent className="pt-5">
                        <pre className="max-h-[30rem] overflow-auto rounded-3xl border border-border/60 bg-slate-950 px-5 py-4 font-mono text-[12px] text-slate-100 leading-6 shadow-inner">
                          {safeJsonStringify(selectedLog.payload)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
