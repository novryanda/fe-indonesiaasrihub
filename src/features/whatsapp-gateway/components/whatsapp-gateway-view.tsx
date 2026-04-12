"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";

import {
  KeyRound,
  LogOut,
  QrCode,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/features/content-shared/utils/content-formatters";
import { ApiError } from "@/shared/api/api-client";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import {
  buildWhatsappGatewayQrUrl,
  connectWhatsappGateway,
  getWhatsappGatewaySession,
  logoutWhatsappGateway,
  requestWhatsappGatewayCode,
  restartWhatsappGateway,
} from "../api/whatsapp-gateway-api";
import type { WhatsappGatewaySession, WhatsappGatewayStatus } from "../types/whatsapp-gateway.type";

function getStatusClasses(status: WhatsappGatewayStatus) {
  switch (status) {
    case "WORKING":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "SCAN_QR_CODE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "FAILED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "STARTING":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "STOPPED":
    case "NOT_CREATED":
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
  }
}

function getStatusCopy(status: WhatsappGatewayStatus) {
  switch (status) {
    case "NOT_CREATED":
      return "Session WAHA belum dibuat. Mulai pairing untuk membuat session default dan menampilkan QR login.";
    case "STOPPED":
      return "Session WAHA sudah ada tetapi sedang berhenti. Jalankan pairing untuk memulai ulang sesi.";
    case "STARTING":
      return "WAHA sedang menyalakan session. Tunggu beberapa detik sampai QR muncul atau session aktif.";
    case "SCAN_QR_CODE":
      return "Scan QR code ini dari aplikasi WhatsApp pada perangkat yang akan dipakai sebagai gateway.";
    case "WORKING":
      return "WhatsApp gateway aktif dan siap dipakai untuk pengiriman notifikasi dari Asrihub.";
    case "FAILED":
      return "Session WAHA gagal. Coba restart terlebih dahulu, lalu logout jika perlu pairing ulang.";
    default:
      return "Status session WAHA tidak dikenali.";
  }
}

type GatewayAlertState = {
  tone: "warning" | "error";
  title: string;
  message: string;
  isConfigurationMissing: boolean;
};

function resolveGatewayAlert(errorValue: unknown): GatewayAlertState {
  if (
    errorValue instanceof ApiError &&
    (errorValue.code === "WAHA_NOT_CONFIGURED" || errorValue.message.toLowerCase().includes("belum dikonfigurasi"))
  ) {
    return {
      tone: "warning",
      title: "Integrasi WAHA belum di-set",
      message:
        "Buka Konfigurasi Sistem lalu isi WAHA Base URL dan WAHA API Key terlebih dahulu agar halaman gateway bisa terhubung ke WAHA.",
      isConfigurationMissing: true,
    };
  }

  const fallbackMessage =
    errorValue instanceof Error ? errorValue.message : "Gagal memuat status WhatsApp gateway.";

  return {
    tone: "error",
    title: "Gagal menghubungi WAHA",
    message: fallbackMessage,
    isConfigurationMissing: false,
  };
}

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Smartphone;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start gap-3 pt-6">
        <span className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-muted/40">
          <Icon className="size-4 text-muted-foreground" />
        </span>
        <div className="space-y-1">
          <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.22em]">{label}</p>
          <p className="font-semibold text-base">{value}</p>
          <p className="text-muted-foreground text-sm leading-6">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function WhatsappGatewayView() {
  const { isAuthorized, isPending } = useRoleGuard(["sysadmin"]);
  const [session, setSession] = useState<WhatsappGatewaySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"connect" | "restart" | "logout" | "refresh" | "request-code" | null>(null);
  const [alertState, setAlertState] = useState<GatewayAlertState | null>(null);
  const [qrCacheKey, setQrCacheKey] = useState<number>(() => Date.now());
  const [pairingTab, setPairingTab] = useState<"scan-qr" | "enter-code">("scan-qr");
  const [pairingPhoneNumber, setPairingPhoneNumber] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isPairingDialogOpen, setIsPairingDialogOpen] = useState(false);

  const loadSession = useEffectEvent(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;

    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await getWhatsappGatewaySession();
      const nextSession = response.data;
      setSession((previousSession) => {
        if (
          nextSession.status === "SCAN_QR_CODE" &&
          previousSession?.status !== "SCAN_QR_CODE"
        ) {
          setQrCacheKey(Date.now());
        }

        return nextSession;
      });
      setAlertState(null);
    } catch (errorValue) {
      const nextAlertState = resolveGatewayAlert(errorValue);
      setAlertState(nextAlertState);
      if (!silent) {
        toast.error(nextAlertState.title);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  });

  useEffect(() => {
    if (!isPending && isAuthorized) {
      void loadSession();
    }

    return undefined;
  }, [isAuthorized, isPending]);

  const handleAction = async (action: "restart" | "logout" | "refresh") => {
    setActionLoading(action);
    try {
      if (action === "refresh") {
        await loadSession();
        toast.success("Status WhatsApp gateway diperbarui.");
        return;
      }

      const response = action === "restart" ? await restartWhatsappGateway() : await logoutWhatsappGateway();

      setSession(response.data);
      setAlertState(null);
      setPairingCode(null);
      if (response.data.status === "SCAN_QR_CODE") {
        setQrCacheKey(Date.now());
      }
      toast.success(response.message ?? "Aksi WhatsApp gateway berhasil dijalankan.");
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Aksi WhatsApp gateway gagal dijalankan");
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenPairingDialog = async () => {
    setActionLoading("connect");
    try {
      const response = await connectWhatsappGateway();
      setSession(response.data);
      setAlertState(null);
      setPairingCode(null);
      setPairingTab("scan-qr");
      setQrCacheKey(Date.now());
      setIsPairingDialogOpen(true);
      toast.success(response.message ?? "Pairing WhatsApp berhasil disiapkan.");
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memulai pairing WhatsApp");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestCode = async () => {
    setActionLoading("request-code");
    try {
      const response = await requestWhatsappGatewayCode(pairingPhoneNumber);
      setPairingCode(response.data.code);
      toast.success(response.message ?? "Kode pairing berhasil dibuat.");
      await loadSession({ silent: true });
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal meminta kode pairing");
    } finally {
      setActionLoading(null);
    }
  };

  const qrUrl = useMemo(() => buildWhatsappGatewayQrUrl(qrCacheKey), [qrCacheKey]);
  const accountName = session?.me?.pushName ?? session?.me?.name ?? session?.me?.shortName ?? "-";
  const accountPhone = session?.me?.phoneNumber ?? session?.me?.id ?? "-";
  const isPairingReady = session?.status === "SCAN_QR_CODE";
  const isGatewayConfigurationMissing = alertState?.isConfigurationMissing ?? false;
  const shouldSyncPairingState =
    isPairingDialogOpen &&
    (session?.status === "STARTING" || session?.status === "SCAN_QR_CODE");

  useEffect(() => {
    if (!shouldSyncPairingState) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      void loadSession({ silent: true });
    }, 1500);

    return () => window.clearInterval(interval);
  }, [loadSession, shouldSyncPairingState]);

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
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="rounded-full border-emerald-200 bg-background/75 px-3 py-1 text-emerald-700 dark:bg-card/75"
              >
                System / WhatsApp Gateway
              </Badge>
              <div className="space-y-2">
                <h1 className="font-semibold text-3xl tracking-tight">Login WhatsApp Sysadmin</h1>
                <p className="max-w-3xl text-muted-foreground text-sm leading-6">
                  Pairing QR WAHA dijalankan langsung dari Asrihub. Sysadmin bisa memulai session, melihat status login,
                  restart, dan logout tanpa membuka dashboard WAHA.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleAction("refresh")}
                disabled={isLoading || actionLoading !== null}
              >
                {actionLoading === "refresh" ? <Spinner className="mr-2" /> : <RefreshCw className="mr-2 size-4" />}
                Refresh Status
              </Button>
              <Button
                size="sm"
                onClick={() => void handleOpenPairingDialog()}
                disabled={isLoading || actionLoading !== null || isGatewayConfigurationMissing}
              >
                {actionLoading === "connect" ? <Spinner className="mr-2" /> : <QrCode className="mr-2 size-4" />}
                Login WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleAction("restart")}
                disabled={isLoading || actionLoading !== null || !session?.exists || isGatewayConfigurationMissing}
              >
                {actionLoading === "restart" ? <Spinner className="mr-2" /> : <RotateCcw className="mr-2 size-4" />}
                Restart Session
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void handleAction("logout")}
                disabled={isLoading || actionLoading !== null || !session?.exists || isGatewayConfigurationMissing}
              >
                {actionLoading === "logout" ? <Spinner className="mr-2" /> : <LogOut className="mr-2 size-4" />}
                Logout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Session"
          value={session?.sessionName ?? "default"}
          hint={session?.exists ? "Session WAHA sudah terdaftar." : "Belum dibuat di WAHA."}
          icon={Smartphone}
        />
        <SummaryCard
          label="Status"
          value={session?.status ?? "-"}
          hint={session ? getStatusCopy(session.status) : "Status akan tampil setelah data dimuat."}
          icon={session?.status === "WORKING" ? Wifi : WifiOff}
        />
        <SummaryCard
          label="Akun Terhubung"
          value={accountName}
          hint={accountPhone}
          icon={ShieldCheck}
        />
        <SummaryCard
          label="Sinkronisasi"
          value={session?.updatedAt ? formatDateTime(session.updatedAt) : "-"}
          hint="Status WAHA diperbarui saat halaman dibuka dan saat Anda menekan Refresh Status."
          icon={RefreshCw}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Session WAHA</CardTitle>
              <Badge variant="outline" className={session ? getStatusClasses(session.status) : "border-zinc-200 bg-zinc-50 text-zinc-700"}>
                {session?.status ?? "LOADING"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm leading-6">
              {session ? getStatusCopy(session.status) : "Memuat status session WhatsApp gateway..."}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {alertState ? (
              <div
                className={
                  alertState.tone === "warning"
                    ? "rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-800 text-sm leading-6"
                    : "rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-700 text-sm leading-6"
                }
              >
                <p className="font-semibold">{alertState.title}</p>
                <p className="mt-1">{alertState.message}</p>
              </div>
            ) : null}

            <div className="rounded-3xl border border-border/70 bg-muted/15 px-5 py-4">
              <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.22em]">Action Guide</p>
              <div className="mt-3 space-y-2 text-sm leading-6">
                <p>1. Klik <span className="font-semibold">Login WhatsApp</span> saat ingin membuka layar pairing.</p>
                <p>2. Di dialog pairing, pilih <span className="font-semibold">Scan QR</span> atau <span className="font-semibold">Enter Code</span>.</p>
                <p>3. Setelah proses login selesai di ponsel, klik <span className="font-semibold">Refresh Status</span>.</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-border/70 bg-background px-4 py-4">
                <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.22em]">Session Name</p>
                <p className="mt-2 font-medium text-sm">{session?.sessionName ?? "default"}</p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-background px-4 py-4">
                <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.22em]">QR Availability</p>
                <p className="mt-2 font-medium text-sm">{session?.qrAvailable ? "QR siap ditampilkan" : "QR belum tersedia"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Kontrol Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            {session?.status === "WORKING" ? (
              <div className="space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-700">
                    <ShieldCheck className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-emerald-900 text-sm">WhatsApp sudah terhubung</p>
                    <p className="text-emerald-800 text-sm">{accountName}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-200/80 bg-white/70 px-4 py-4 text-emerald-900 text-sm leading-6">
                  Session aktif dan siap dipakai untuk pengiriman notifikasi task PIC langsung melalui WAHA.
                </div>
              </div>
            ) : (
              <div className="flex min-h-[26rem] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/70 bg-muted/10 px-6 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl border border-border/70 bg-background text-muted-foreground">
                  <QrCode className="size-6" />
                </span>
                <div className="space-y-2">
                  <p className="font-semibold text-base">Login ditampilkan saat diminta</p>
                  <p className="max-w-md text-muted-foreground text-sm leading-6">
                    Klik <span className="font-medium text-foreground">Login WhatsApp</span> untuk membuka dialog pairing seperti pola dashboard WAHA.
                  </p>
                </div>
                <Button
                  onClick={() => void handleOpenPairingDialog()}
                  disabled={isLoading || actionLoading !== null || isGatewayConfigurationMissing}
                >
                  {actionLoading === "connect" ? <Spinner className="mr-2" /> : <QrCode className="mr-2 size-4" />}
                  Buka Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPairingDialogOpen} onOpenChange={setIsPairingDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <QrCode className="size-5" />
                Login WhatsApp Gateway
              </DialogTitle>
              <Badge variant="outline" className={session ? getStatusClasses(session.status) : "border-zinc-200 bg-zinc-50 text-zinc-700"}>
                {session?.status ?? "LOADING"}
              </Badge>
            </div>
            <DialogDescription>
              Tampilan pairing dibuka saat Anda memintanya, seperti alur dashboard WAHA. Pilih scan QR atau login dengan pairing code.
            </DialogDescription>
            {shouldSyncPairingState ? (
              <p className="text-emerald-700 text-sm leading-6">
                Sinkronisasi aktif sampai status session berubah menjadi WORKING.
              </p>
            ) : null}
          </DialogHeader>

          {session?.status === "SCAN_QR_CODE" ? (
            <Tabs value={pairingTab} onValueChange={(value) => setPairingTab(value as "scan-qr" | "enter-code")} className="space-y-5">
              <TabsList variant="line" className="w-full justify-start">
                <TabsTrigger value="scan-qr" className="min-w-[8rem] justify-start">
                  <QrCode className="size-4" />
                  Scan QR
                </TabsTrigger>
                <TabsTrigger value="enter-code" className="min-w-[8rem] justify-start">
                  <KeyRound className="size-4" />
                  Enter Code
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scan-qr" className="space-y-4">
                <div className="mx-auto flex max-w-md justify-center rounded-[2rem] border border-border/70 bg-white p-5 shadow-sm">
                  <img
                    key={qrCacheKey}
                    src={qrUrl}
                    alt="QR code WhatsApp gateway"
                    className="aspect-square w-full max-w-[320px] rounded-2xl object-contain"
                  />
                </div>
                <div className="space-y-2 text-center text-muted-foreground text-sm leading-6">
                  <p>Scan QR ini dari aplikasi WhatsApp pada perangkat yang akan dipakai sebagai gateway.</p>
                  <p>Jika QR berubah atau kadaluarsa, tekan <span className="font-medium text-foreground">Refresh Status</span> di halaman utama lalu buka login lagi.</p>
                </div>
              </TabsContent>

              <TabsContent value="enter-code" className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="pairing-phone-number">Nomor WhatsApp</Label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      id="pairing-phone-number"
                      placeholder="6281234567890"
                      value={pairingPhoneNumber}
                      onChange={(event) => setPairingPhoneNumber(event.target.value)}
                      disabled={actionLoading !== null}
                    />
                    <Button
                      type="button"
                      onClick={() => void handleRequestCode()}
                      disabled={actionLoading !== null || !pairingPhoneNumber.trim() || !isPairingReady}
                    >
                      {actionLoading === "request-code" ? <Spinner className="mr-2" /> : <Send className="mr-2 size-4" />}
                      Show Code
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-sm leading-6">
                    Masukkan nomor internasional tanpa spasi atau tanda hubung. Contoh: <span className="font-medium text-foreground">6281234567890</span>.
                  </p>
                </div>

                <div className="rounded-[2rem] border border-border/70 bg-muted/15 px-6 py-8 text-center">
                  <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.22em]">Pairing Code</p>
                  <p className="mt-4 font-semibold text-4xl tracking-[0.35em] sm:text-5xl">
                    {pairingCode ?? "XXXX-XXXX"}
                  </p>
                </div>

                <div className="space-y-2 text-muted-foreground text-sm leading-6">
                  <p>1. Buka WhatsApp di ponsel.</p>
                  <p>2. Masuk ke Linked Devices lalu pilih link with phone number instead.</p>
                  <p>3. Tekan <span className="font-medium text-foreground">Show Code</span> untuk mengambil kode dari WAHA.</p>
                </div>
              </TabsContent>
            </Tabs>
          ) : session?.status === "WORKING" ? (
            <div className="space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-5">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-700">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <p className="font-semibold text-emerald-900 text-sm">WhatsApp sudah terhubung</p>
                  <p className="text-emerald-800 text-sm">{accountName}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-200/80 bg-white/70 px-4 py-4 text-emerald-900 text-sm leading-6">
                Session aktif. Anda bisa menutup dialog ini dan lanjut memakai gateway untuk Asrihub.
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-border/70 bg-muted/10 px-6 py-10 text-center">
              <p className="font-semibold text-base">Pairing belum siap</p>
              <p className="mt-2 text-muted-foreground text-sm leading-6">
                {session ? getStatusCopy(session.status) : "Status session belum tersedia."}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
