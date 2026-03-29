"use client";

import { useEffect, useState } from "react";

import { CheckCircle2, KeyRound, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { PLATFORM_OPTIONS } from "@/features/content-shared/constants/content-options";
import { formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { testScraperConnection } from "../api/scraper-api";
import type { ScraperConnectionStatus } from "../types/scraper.type";

function getConnectionBadge(status: ScraperConnectionStatus | null) {
  if (!status) {
    return { label: "Belum dicek", className: "border-zinc-200 bg-zinc-50 text-zinc-700" };
  }

  if (status.connected) {
    return { label: "Terkoneksi", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }

  if (status.configured) {
    return { label: "Konfigurasi bermasalah", className: "border-amber-200 bg-amber-50 text-amber-700" };
  }

  return { label: "Belum dikonfigurasi", className: "border-rose-200 bg-rose-50 text-rose-700" };
}

export function ScraperConfigurationView() {
  const { isAuthorized, isPending } = useRoleGuard(["sysadmin"]);
  const [connectionStatus, setConnectionStatus] = useState<ScraperConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const response = await testScraperConnection();
      setConnectionStatus(response.data);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal mengecek koneksi Apify");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending && isAuthorized) {
      void loadStatus();
    }
  }, [isAuthorized, isPending]);

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

  const badge = getConnectionBadge(connectionStatus);

  return (
    <div className="space-y-6">
      <Card className="border-emerald-100 bg-linear-to-br from-emerald-50 via-background to-sky-50">
        <CardContent className="space-y-4 px-6 py-8 md:px-8">
          <Badge variant="outline" className="rounded-full border-emerald-200 bg-white/80 px-3 py-1 text-emerald-700">
            System / Konfigurasi
          </Badge>
          <div className="space-y-2">
            <h1 className="font-semibold text-3xl tracking-tight">Konfigurasi Sistem</h1>
            <p className="max-w-2xl text-muted-foreground text-sm leading-6">
              Halaman ini memverifikasi token Apify dan actor scraper yang aktif untuk setiap platform di environment server.
            </p>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <ShieldAlert className="size-4" />
        <AlertTitle>Secret tidak disimpan di database</AlertTitle>
        <AlertDescription>
          API Token Apify dibaca langsung dari environment variable server. UI ini hanya menampilkan status koneksi dan actor yang aktif per platform.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Status Koneksi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner />
                <span>Mengecek koneksi...</span>
              </div>
            ) : (
              <>
                <Badge variant="outline" className={badge.className}>
                  {badge.label}
                </Badge>
                <p className="text-sm text-muted-foreground">{connectionStatus?.message ?? "Belum ada data koneksi."}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Aktif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {connectionStatus?.configuredPlatforms?.length ? (
              <div className="flex flex-wrap gap-2">
                {connectionStatus.configuredPlatforms.map((platform) => (
                  <Badge key={platform} variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    {formatPlatformLabel(platform)}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-700" />
                <span>Belum ada actor platform yang dikonfigurasi.</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Public URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <KeyRound className="size-4 text-sky-700" />
              <span className="break-all">{connectionStatus?.appPublicUrl ?? "-"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actor per Platform</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PLATFORM_OPTIONS.map((platform) => {
            const actorId = connectionStatus?.actorIds?.[platform.value] ?? null;
            const isConfigured = Boolean(actorId);

            return (
              <div key={platform.value} className="space-y-2 rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-sm">{platform.label}</p>
                  <Badge
                    variant="outline"
                    className={
                      isConfigured
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }
                  >
                    {isConfigured ? "Siap" : "Belum di-set"}
                  </Badge>
                </div>
                <p className="break-all text-muted-foreground text-sm">{actorId ?? "-"}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verifikasi Manual</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="font-medium text-sm">Test koneksi Apify sekarang</p>
            <p className="text-muted-foreground text-sm">
              Gunakan tombol ini untuk memeriksa apakah token server masih valid dan actor Apify tiap platform sudah terbaca.
            </p>
          </div>
          <Button onClick={() => void loadStatus()} disabled={isLoading}>
            {isLoading ? <Spinner className="mr-2" /> : <RefreshCw className="mr-2 size-4" />}
            Test Koneksi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
