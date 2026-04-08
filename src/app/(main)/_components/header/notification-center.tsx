"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Alert, Spinner as HeroSpinner } from "@heroui/react";
import { Bell, BellRing, CheckCheck, ChevronRight, SearchX } from "lucide-react";
import { toast } from "sonner";

import type { UserRole } from "@/app/(auth)/auth/types/auth.types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/features/notifikasi/api/notifikasi-api";
import type { NotificationItem } from "@/features/notifikasi/types/notifikasi.type";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const NOTIFICATION_CENTER_ROLES: UserRole[] = ["wcc", "pic_sosmed"];
const NOTIFICATION_PAGE_URL = "/akun/notifikasi";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function NotificationCenter() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const role = ((session?.user as { role?: string } | undefined)?.role ?? "wcc") as UserRole;
  const canAccessNotificationCenter = useMemo(
    () => Boolean(session) && NOTIFICATION_CENTER_ROLES.includes(role),
    [role, session],
  );

  const loadNotifications = useCallback(async () => {
    if (!canAccessNotificationCenter) {
      return;
    }

    setLoading(true);

    try {
      const response = await getNotifications({
        page: 1,
        limit: 6,
        status: "unread",
      });

      setItems(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat notifikasi");
    } finally {
      setLoading(false);
    }
  }, [canAccessNotificationCenter]);

  useEffect(() => {
    if (!isPending && canAccessNotificationCenter) {
      void loadNotifications();
    }
  }, [canAccessNotificationCenter, isPending, loadNotifications]);

  useEffect(() => {
    if (!canAccessNotificationCenter) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [canAccessNotificationCenter, loadNotifications]);

  useEffect(() => {
    if (open && canAccessNotificationCenter) {
      void loadNotifications();
    }
  }, [canAccessNotificationCenter, loadNotifications, open]);

  async function handleMarkAllAsRead() {
    setMarkingAll(true);

    try {
      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal menandai semua notifikasi");
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleItemClick(item: NotificationItem) {
    if (!item.isRead) {
      setUpdatingId(item.id);

      try {
        await markNotificationAsRead(item.id);
      } catch {
        // Biarkan navigasi tetap berjalan walau status read gagal diperbarui.
      } finally {
        setUpdatingId(null);
      }
    }

    setOpen(false);
    router.push(NOTIFICATION_PAGE_URL);
  }

  if (isPending || !canAccessNotificationCenter) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          className="relative size-9 rounded-lg"
          aria-label={unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Buka notifikasi"}
        >
          <Bell className="size-4.5" />
          {unreadCount > 0 ? (
            <span className="absolute top-1 right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 font-semibold text-[10px] text-white leading-4 ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(26rem,calc(100vw-1rem))] gap-0 overflow-hidden p-0">
        <div className="flex items-start justify-between gap-4 border-b px-4 py-3">
          <div className="space-y-1">
            <p className="font-medium text-sm">Notifikasi</p>
            <p className="text-muted-foreground text-xs">
              {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Semua notifikasi sudah dibaca"}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={handleMarkAllAsRead}
            disabled={markingAll || unreadCount === 0}
          >
            {markingAll ? <HeroSpinner size="sm" /> : <CheckCheck className="size-4" />}
            <span className="sr-only">Tandai semua notifikasi sebagai dibaca</span>
          </Button>
        </div>

        <div className="max-h-[28rem] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-muted-foreground text-sm">
              <HeroSpinner size="sm" />
              <span>Memuat notifikasi...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center text-muted-foreground">
              <SearchX className="size-6" />
              <p className="text-sm">Belum ada notifikasi untuk ditampilkan.</p>
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="block w-full border-b last:border-b-0"
                onClick={() => void handleItemClick(item)}
              >
                <Alert
                  status={item.isRead ? "default" : "warning"}
                  className={cn(
                    "rounded-none border-0 bg-transparent px-4 py-3 text-left shadow-none transition-colors hover:bg-muted/50",
                    !item.isRead && "bg-amber-50/60 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30",
                  )}
                >
                  <Alert.Indicator className="pt-0.5">
                    {updatingId === item.id ? (
                      <HeroSpinner size="sm" />
                    ) : (
                      <BellRing className="size-4 text-amber-600" />
                    )}
                  </Alert.Indicator>
                  <Alert.Content className="min-w-0">
                    <Alert.Title className="truncate pr-3 font-medium text-sm">{item.title}</Alert.Title>
                    <Alert.Description className="mt-1 line-clamp-2 whitespace-pre-wrap text-muted-foreground text-sm leading-5">
                      {item.body}
                    </Alert.Description>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-muted-foreground text-xs">{formatDateTime(item.createdAt)}</span>
                      <span className="inline-flex items-center gap-1 text-primary text-xs">
                        Lihat detail
                        <ChevronRight className="size-3.5" />
                      </span>
                    </div>
                  </Alert.Content>
                </Alert>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-end border-t px-4 py-3">
          <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs">
            <Link href={NOTIFICATION_PAGE_URL} onClick={() => setOpen(false)}>
              Buka halaman notifikasi
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
