"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { BellRing, CheckCheck, ExternalLink, MailOpen, SearchX } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/features/notifikasi/api/notifikasi-api";
import type { NotificationItem, NotificationStatusFilter } from "@/features/notifikasi/types/notifikasi.type";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function NotifikasiView() {
  const { isAuthorized, isPending } = useRoleGuard(["wcc", "pic_sosmed"]);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<NotificationStatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(
    async (nextStatus = statusFilter) => {
      setLoading(true);

      try {
        const response = await getNotifications({
          status: nextStatus,
          page: 1,
          limit: 50,
        });

        setItems(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      } catch (errorValue) {
        toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat notifikasi");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    if (!isAuthorized || isPending) {
      return;
    }

    void loadNotifications(statusFilter);
  }, [isAuthorized, isPending, loadNotifications, statusFilter]);

  async function handleMarkAsRead(id: string) {
    setUpdatingId(id);

    try {
      await markNotificationAsRead(id);
      await loadNotifications();
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal menandai notifikasi sebagai dibaca");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleMarkAllAsRead() {
    setMarkingAll(true);

    try {
      const response = await markAllNotificationsAsRead();
      toast.success(response.message ?? "Semua notifikasi ditandai sebagai dibaca");
      await loadNotifications();
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal menandai semua notifikasi");
    } finally {
      setMarkingAll(false);
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
      <Card className="app-bg-hero app-border-soft overflow-hidden">
        <CardContent className="space-y-6 px-6 py-8 md:px-8">
          <div className="space-y-3">
            <Badge
              variant="outline"
              className="rounded-full border-amber-200 bg-background/75 px-3 py-1 text-amber-700 dark:bg-card/75"
            >
              Akun / Notifikasi
            </Badge>
            <div className="space-y-2">
              <h1 className="font-semibold text-3xl tracking-tight">Notifikasi</h1>
              <p className="max-w-3xl text-muted-foreground text-sm leading-6">
                Lihat reminder, pembaruan, dan pengingat posting yang dikirim ke akun Anda. Notifikasi overdue bank
                konten dari QCC juga akan muncul di sini.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <Card>
          <CardContent className="space-y-4 py-6">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">Belum Dibaca</p>
              <BellRing className="size-5 text-amber-600" />
            </div>
            <p className="font-semibold text-3xl tracking-tight">{unreadCount}</p>
            <Button
              className="w-full"
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={markingAll || unreadCount === 0}
            >
              <CheckCheck className="mr-2 size-4" />
              Tandai Semua Dibaca
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Inbox Notifikasi</CardTitle>
              <CardDescription>Filter notifikasi berdasarkan status baca.</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as NotificationStatusFilter)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status notifikasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua notifikasi</SelectItem>
                <SelectItem value="unread">Belum dibaca</SelectItem>
                <SelectItem value="read">Sudah dibaca</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <Spinner />
                <span>Memuat notifikasi...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-4 py-12 text-center text-muted-foreground">
                <SearchX className="size-8" />
                <p>Tidak ada notifikasi pada filter ini.</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${item.isRead ? "bg-muted/20" : "bg-amber-50/70"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{item.title}</p>
                        <Badge variant="outline">{item.isRead ? "sudah dibaca" : "baru"}</Badge>
                        {item.type === "reminder_bank_content_overdue" ? (
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                            reminder bank konten
                          </Badge>
                        ) : null}
                      </div>
                      <p className="whitespace-pre-wrap text-muted-foreground text-sm leading-6">{item.body}</p>
                      <p className="text-muted-foreground text-xs">
                        Diterima {formatDateTime(item.createdAt)}
                        {item.readAt ? ` • Dibaca ${formatDateTime(item.readAt)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.referenceType === "bank_content" && item.referenceId ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/konten/bank-konten/${item.referenceId}`}>
                            <ExternalLink className="mr-2 size-4" />
                            Buka Referensi
                          </Link>
                        </Button>
                      ) : null}
                      {!item.isRead ? (
                        <Button size="sm" onClick={() => handleMarkAsRead(item.id)} disabled={updatingId === item.id}>
                          <MailOpen className="mr-2 size-4" />
                          {updatingId === item.id ? "Memproses..." : "Tandai Dibaca"}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
