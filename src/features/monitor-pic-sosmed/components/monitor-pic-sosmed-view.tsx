"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BellRing, CalendarClock, Eye, Search, Send, TimerReset, Users2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import {
  getMonitorPicSosmedList,
  sendMonitorPicReminder,
} from "@/features/monitor-pic-sosmed/api/monitor-pic-sosmed-api";
import type { MonitorPicListItem, PicActivityStatus } from "@/features/monitor-pic-sosmed/types/monitor-pic-sosmed.type";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

const numberFormatter = new Intl.NumberFormat("id-ID");

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getActivityBadge(status: PicActivityStatus) {
  if (status === "aktif") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "baru") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

export function MonitorPicSosmedView() {
  const { isAuthorized, isPending } = useRoleGuard(["qcc_wcc", "superadmin"]);
  const [items, setItems] = useState<MonitorPicListItem[]>([]);
  const [stats, setStats] = useState({
    total_pic: 0,
    aktif: 0,
    baru: 0,
    tidak_aktif: 0,
    total_overdue: 0,
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<PicActivityStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [selectedPic, setSelectedPic] = useState<MonitorPicListItem | null>(null);
  const [reminderMessage, setReminderMessage] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  async function loadData(nextPage = page, nextStatus = statusFilter, nextSearch = search) {
    setLoading(true);

    try {
      const response = await getMonitorPicSosmedList({
        page: nextPage,
        limit: 10,
        search: nextSearch || undefined,
        status: nextStatus === "all" ? undefined : nextStatus,
      });

      setItems(response.data.items);
      setStats(response.data.stats);
      setTotal(response.meta?.total ?? response.data.items.length);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat monitoring PIC sosmed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthorized || isPending) {
      return;
    }

    void loadData();
  }, [isAuthorized, isPending, page, search, statusFilter]);

  const totalPages = Math.max(Math.ceil(total / 10), 1);

  const summaryCards = useMemo(
    () => [
      {
        label: "Total PIC",
        value: formatNumber(stats.total_pic),
        helper: "PIC sosmed dalam scope monitoring",
        icon: Users2,
      },
      {
        label: "Aktif Minggu Ini",
        value: formatNumber(stats.aktif),
        helper: `${formatNumber(stats.baru)} PIC baru`,
        icon: CalendarClock,
      },
      {
        label: "Overdue Bank Konten",
        value: formatNumber(stats.total_overdue),
        helper: `${formatNumber(stats.tidak_aktif)} PIC belum aktif`,
        icon: TimerReset,
      },
    ],
    [stats],
  );

  async function handleSendReminder() {
    if (!selectedPic) {
      return;
    }

    setSendingReminder(true);

    try {
      const response = await sendMonitorPicReminder(selectedPic.id, {
        pesan: reminderMessage.trim() || undefined,
      });

      toast.success(response.message ?? `Pengingat berhasil dikirim ke ${selectedPic.name}`);
      setSelectedPic(null);
      setReminderMessage("");
      await loadData();
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal mengirim pengingat");
    } finally {
      setSendingReminder(false);
    }
  }

  if (isPending) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
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
      <Card className="overflow-hidden border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.1),_transparent_40%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))]">
        <CardContent className="space-y-6 px-6 py-8 md:px-8">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full border-emerald-200 bg-white/80 px-3 py-1 text-emerald-700">
              Tim / Monitor PIC Sosmed
            </Badge>
            <div className="space-y-2">
              <h1 className="font-semibold text-3xl tracking-tight">Monitor PIC Sosmed</h1>
              <p className="max-w-3xl text-muted-foreground text-sm leading-6">
                Pantau PIC sosmed sesuai wilayah Anda, lihat akun delegasi yang mereka pegang, aktivitas posting,
                serta kirim pengingat untuk bank konten yang belum diposting.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((item) => (
          <Card key={item.label}>
            <CardContent className="space-y-3 py-6">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">{item.label}</p>
                <item.icon className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-3xl tracking-tight">{item.value}</p>
                <p className="mt-1 text-muted-foreground text-sm">{item.helper}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>Daftar PIC Sosmed</CardTitle>
            <CardDescription>Tabel monitoring PIC dengan overdue bank konten dan aktivitas terbaru.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative min-w-72">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Cari nama atau email PIC"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setPage(1);
                setStatusFilter(value as PicActivityStatus | "all");
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="baru">Baru</SelectItem>
                <SelectItem value="tidak_aktif">Tidak aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Spinner />
              <span>Memuat daftar PIC sosmed...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-4 py-12 text-center text-muted-foreground">
              Belum ada PIC sosmed yang sesuai filter saat ini.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PIC Sosmed</TableHead>
                    <TableHead>Wilayah</TableHead>
                    <TableHead>Akun Delegasi</TableHead>
                    <TableHead>Overdue</TableHead>
                    <TableHead>Posting Bulan Ini</TableHead>
                    <TableHead>Update Statistik</TableHead>
                    <TableHead>Status Aktivitas</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-muted-foreground text-sm">{item.email}</p>
                          <p className="text-muted-foreground text-xs">{item.phone_number ?? "Nomor HP belum ada"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <p className="font-medium">{item.wilayah?.nama ?? "-"}</p>
                          <p className="text-muted-foreground text-xs">{item.status_user}</p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex max-w-72 flex-wrap gap-2">
                          {item.akun_sosmed.length > 0 ? (
                            item.akun_sosmed.map((account) => (
                              <Badge key={account.id} variant="outline" className="h-auto px-2 py-1 text-left leading-5 whitespace-normal">
                                <span className="font-medium">{formatPlatformLabel(account.platform)}</span>
                                <span>{account.username}</span>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">Belum ada akun delegasi</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <p className="font-medium">{formatNumber(item.overdue_bank_content_count)}</p>
                          <p className="max-w-56 text-muted-foreground text-xs leading-5 whitespace-normal">
                            {item.overdue_bank_content_count > 0
                              ? item.overdue_bank_contents
                                  .slice(0, 2)
                                  .map((content) => content.judul)
                                  .join(", ")
                              : "Tidak ada overdue"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <p className="font-medium">{formatNumber(item.posting_bulan_ini)}</p>
                          <p className="text-muted-foreground text-xs">
                            {formatNumber(item.total_posting_proofs)} total bukti posting
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-1 text-sm">
                          <p>{formatDateTime(item.last_stats_update)}</p>
                          <p className="text-muted-foreground text-xs">
                            Posting terakhir: {formatDateTime(item.last_posting_activity)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant="outline" className={getActivityBadge(item.activity_status)}>
                          {item.activity_status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/tim/pic-sosmed/${item.id}`}>
                              <Eye className="mr-2 size-4" />
                              Detail
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            disabled={item.overdue_bank_content_count === 0}
                            onClick={() => {
                              setSelectedPic(item);
                              setReminderMessage("");
                            }}
                          >
                            <BellRing className="mr-2 size-4" />
                            Ingatkan
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Menampilkan {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} dari {total} PIC
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                    Sebelumnya
                  </Button>
                  <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                    Berikutnya
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(selectedPic)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPic(null);
            setReminderMessage("");
          }
        }}
      >
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogTitle>Kirim Pengingat ke PIC</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPic
                ? `Pengingat akan dikirim ke ${selectedPic.name} untuk seluruh bank konten overdue yang masih terlihat pada wilayahnya.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedPic ? (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
                <p className="font-medium">{selectedPic.name}</p>
                <p className="text-muted-foreground">{selectedPic.wilayah?.nama ?? "-"}</p>
                <p className="mt-2 text-muted-foreground">
                  Target overdue: {formatNumber(selectedPic.overdue_bank_content_count)} bank konten
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-sm">Pesan tambahan</p>
                <Textarea
                  placeholder="Opsional. Jika dikosongkan, sistem akan memakai pesan pengingat default."
                  value={reminderMessage}
                  onChange={(event) => setReminderMessage(event.target.value)}
                />
              </div>
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendingReminder}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendReminder} disabled={sendingReminder}>
              {sendingReminder ? (
                <>
                  <Spinner />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" />
                  Kirim Pengingat
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
