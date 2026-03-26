"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ArrowLeft, BellRing, Clock3, ExternalLink, Mail, Phone, Send, UserRound } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import {
  getMonitorPicSosmedDetail,
  sendMonitorPicReminder,
} from "@/features/monitor-pic-sosmed/api/monitor-pic-sosmed-api";
import type { MonitorPicDetailData } from "@/features/monitor-pic-sosmed/types/monitor-pic-sosmed.type";
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

function getTimelineTone(type: MonitorPicDetailData["activity_timeline"][number]["type"]) {
  switch (type) {
    case "posting_proof_submitted":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "posting_stats_updated":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "reminder_sent":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-border bg-background text-foreground";
  }
}

export function PicSosmedDetailView({ id }: { id: string }) {
  const { isAuthorized, isPending } = useRoleGuard(["qcc_wcc", "superadmin"]);
  const [data, setData] = useState<MonitorPicDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reminderMessage, setReminderMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  async function loadDetail() {
    setLoading(true);

    try {
      const response = await getMonitorPicSosmedDetail(id);
      setData(response.data);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat detail PIC sosmed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthorized || isPending) {
      return;
    }

    void loadDetail();
  }, [id, isAuthorized, isPending]);

  const statCards = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        label: "Akun Delegasi",
        value: formatNumber(data.summary.delegated_account_count),
      },
      {
        label: "Posting Bulan Ini",
        value: formatNumber(data.summary.posting_bulan_ini),
      },
      {
        label: "Link Statistik",
        value: formatNumber(data.summary.total_posting_links_with_stats),
      },
      {
        label: "Overdue",
        value: formatNumber(data.summary.overdue_bank_content_count),
      },
    ];
  }, [data]);

  async function handleSendReminder() {
    if (!data) {
      return;
    }

    setSendingReminder(true);

    try {
      const response = await sendMonitorPicReminder(data.pic.id, {
        pesan: reminderMessage.trim() || undefined,
      });

      toast.success(response.message ?? "Pengingat berhasil dikirim");
      setDialogOpen(false);
      setReminderMessage("");
      await loadDetail();
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal mengirim pengingat");
    } finally {
      setSendingReminder(false);
    }
  }

  if (isPending || loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Spinner />
          <span>{isPending ? "Memuat session..." : "Memuat detail PIC sosmed..."}</span>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthorized || !data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.1),_transparent_40%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))]">
        <CardContent className="space-y-6 px-6 py-8 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge variant="outline" className="rounded-full border-emerald-200 bg-white/80 px-3 py-1 text-emerald-700">
                Tim / Monitor PIC Sosmed / Detail
              </Badge>
              <div className="space-y-2">
                <h1 className="font-semibold text-3xl tracking-tight">{data.pic.name}</h1>
                <p className="max-w-3xl text-muted-foreground text-sm leading-6">
                  {data.pic.wilayah?.nama ?? "-"} • Joined {formatDateTime(data.pic.joined_at)} • Status aktivitas{" "}
                  {data.pic.activity_status.replace("_", " ")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/tim/pic-sosmed">
                  <ArrowLeft className="mr-2 size-4" />
                  Kembali
                </Link>
              </Button>
              <Button disabled={data.summary.overdue_bank_content_count === 0} onClick={() => setDialogOpen(true)}>
                <BellRing className="mr-2 size-4" />
                Kirim Pengingat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <Card key={item.label}>
            <CardContent className="space-y-2 py-6">
              <p className="text-muted-foreground text-sm">{item.label}</p>
              <p className="font-semibold text-3xl tracking-tight">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan PIC</CardTitle>
            <CardDescription>Informasi kontak dan aktivitas terbaru PIC sosmed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
              <UserRound className="mt-0.5 size-4 text-emerald-700" />
              <div>
                <p className="font-medium">{data.pic.name}</p>
                <p className="text-muted-foreground text-sm">{data.pic.wilayah?.nama ?? "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
              <Mail className="mt-0.5 size-4 text-emerald-700" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-muted-foreground text-sm">{data.pic.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
              <Phone className="mt-0.5 size-4 text-emerald-700" />
              <div>
                <p className="font-medium">Nomor HP</p>
                <p className="text-muted-foreground text-sm">{data.pic.phone_number ?? "Belum tersedia"}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Posting Terakhir</p>
                <p className="mt-2 font-medium">{formatDateTime(data.summary.last_posting_activity)}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Statistik Terakhir</p>
                <p className="mt-2 font-medium">{formatDateTime(data.summary.last_stats_update)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Akun Sosmed Delegasi</CardTitle>
            <CardDescription>Akun yang saat ini dikelola PIC sosmed ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.delegated_accounts.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground">
                Belum ada akun sosmed yang didelegasikan.
              </div>
            ) : (
              data.delegated_accounts.map((account) => (
                <div key={account.id} className="rounded-2xl border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{formatPlatformLabel(account.platform)}</Badge>
                        <Badge variant="outline">
                          {account.is_verified ? "verified" : account.verification_status}
                        </Badge>
                      </div>
                      <p className="font-medium">{account.nama_profil}</p>
                      <p className="text-muted-foreground text-sm">{account.username}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{formatNumber(account.followers)} followers</p>
                      <p className="text-muted-foreground">{formatDateTime(account.last_stat_update)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Bank Konten Overdue</CardTitle>
            <CardDescription>Konten aktif yang masih terlihat untuk PIC ini tetapi belum dikirim sebagai bukti posting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.overdue_bank_contents.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground">
                Tidak ada bank konten overdue.
              </div>
            ) : (
              data.overdue_bank_contents.map((item) => (
                <div key={item.id} className="rounded-2xl border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="font-medium">{item.judul}</p>
                      <div className="flex flex-wrap gap-2">
                        {item.platform.map((platform) => (
                          <Badge key={`${item.id}-${platform}`} variant="outline">
                            {formatPlatformLabel(platform)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/konten/bank-konten/${item.id}`}>
                        <ExternalLink className="mr-2 size-4" />
                        Lihat
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline Aktivitas PIC</CardTitle>
            <CardDescription>Posting, pembaruan statistik, dan reminder yang terkait PIC ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.activity_timeline.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground">
                Belum ada aktivitas yang tercatat.
              </div>
            ) : (
              data.activity_timeline.map((event) => (
                <div key={event.id} className="rounded-2xl border bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full border bg-white p-2">
                      <Clock3 className="size-4 text-emerald-700" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={getTimelineTone(event.type)}>
                          {event.type === "posting_proof_submitted"
                            ? "Posting"
                            : event.type === "posting_stats_updated"
                              ? "Statistik"
                              : "Reminder"}
                        </Badge>
                        <p className="text-muted-foreground text-sm">{formatDateTime(event.timestamp)}</p>
                      </div>
                      <p className="font-medium text-sm leading-6">{event.label}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Reminder QCC</CardTitle>
          <CardDescription>Notifikasi reminder yang pernah dikirim ke PIC ini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.reminder_history.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground">
              Belum ada reminder yang dikirim.
            </div>
          ) : (
            data.reminder_history.map((item) => (
              <div key={item.id} className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="font-medium">{item.bank_content_title ?? "Bank konten"}</p>
                    <p className="text-muted-foreground text-sm">{item.message || "Tanpa pesan tambahan"}</p>
                    <p className="text-muted-foreground text-xs">
                      Dikirim oleh {item.sender?.name ?? "Sistem"} • {formatDateTime(item.sent_at)}
                    </p>
                  </div>
                  {item.bank_content_id ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/konten/bank-konten/${item.bank_content_id}`}>
                        <ExternalLink className="mr-2 size-4" />
                        Buka Bank Konten
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogTitle>Kirim Pengingat ke PIC</AlertDialogTitle>
            <AlertDialogDescription>
              Pengingat akan dikirim per bank konten overdue yang masih terlihat oleh PIC ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
              <p className="font-medium">{data.pic.name}</p>
              <p className="text-muted-foreground">{data.pic.wilayah?.nama ?? "-"}</p>
              <p className="mt-2 text-muted-foreground">
                Target overdue: {formatNumber(data.summary.overdue_bank_content_count)} bank konten
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-sm">Pesan tambahan</p>
              <Textarea
                placeholder="Opsional. Sistem tetap akan membuat satu notifikasi per bank konten overdue."
                value={reminderMessage}
                onChange={(event) => setReminderMessage(event.target.value)}
              />
            </div>
          </div>
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
