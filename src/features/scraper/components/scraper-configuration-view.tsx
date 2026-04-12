"use client";

import { useEffect, useState } from "react";

import { CheckCircle2, ExternalLink, Eye, EyeOff, KeyRound, RefreshCw, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { PLATFORM_OPTIONS } from "@/features/content-shared/constants/content-options";
import { formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { testScraperConnection } from "../api/scraper-api";
import {
  getApifyIntegrationSettings,
  getWhatsappIntegrationSettings,
  resetApifyIntegrationSettings,
  resetWhatsappIntegrationSettings,
  updateApifyIntegrationSettings,
  updateWhatsappIntegrationSettings,
} from "../api/system-settings-api";
import type { ScraperConnectionStatus } from "../types/scraper.type";
import type {
  ApifyIntegrationSettingKey,
  ApifyIntegrationSettings,
  SystemSettingSource,
  WhatsappIntegrationSettingKey,
  WhatsappIntegrationSettings,
} from "../types/system-settings.type";

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

function getSourceBadge(source: SystemSettingSource) {
  switch (source) {
    case "database":
      return {
        label: "Panel Sysadmin",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "environment":
      return {
        label: "Env Deploy",
        className: "border-sky-200 bg-sky-50 text-sky-700",
      };
    default:
      return {
        label: "Default App",
        className: "border-zinc-200 bg-zinc-50 text-zinc-700",
      };
  }
}

type IntegrationFormState = {
  wahaApiBaseUrl: string;
  wahaSessionName: string;
  wahaApiKey: string;
};

type ApifyPlatform = keyof ApifyIntegrationSettings["actorIds"];

type ApifyIntegrationFormState = {
  apifyApiToken: string;
  apifyWebhookSecret: string;
  actorIds: Record<ApifyPlatform, string>;
};

const INITIAL_INTEGRATION_FORM: IntegrationFormState = {
  wahaApiBaseUrl: "",
  wahaSessionName: "",
  wahaApiKey: "",
};

const INITIAL_APIFY_FORM: ApifyIntegrationFormState = {
  apifyApiToken: "",
  apifyWebhookSecret: "",
  actorIds: {
    instagram: "",
    tiktok: "",
    youtube: "",
    facebook: "",
    x: "",
  },
};

export function ScraperConfigurationView() {
  const { isAuthorized, isPending } = useRoleGuard(["sysadmin"]);
  const [connectionStatus, setConnectionStatus] = useState<ScraperConnectionStatus | null>(null);
  const [apifySettings, setApifySettings] = useState<ApifyIntegrationSettings | null>(null);
  const [integrationSettings, setIntegrationSettings] = useState<WhatsappIntegrationSettings | null>(null);
  const [apifyForm, setApifyForm] = useState<ApifyIntegrationFormState>(INITIAL_APIFY_FORM);
  const [integrationForm, setIntegrationForm] = useState<IntegrationFormState>(INITIAL_INTEGRATION_FORM);
  const [initialApifyActorValues, setInitialApifyActorValues] = useState<Record<ApifyPlatform, string>>({
    instagram: "",
    tiktok: "",
    youtube: "",
    facebook: "",
    x: "",
  });
  const [initialNonSecretValues, setInitialNonSecretValues] = useState({
    wahaApiBaseUrl: "",
    wahaSessionName: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingScraper, setIsRefreshingScraper] = useState(false);
  const [isRefreshingApifyIntegration, setIsRefreshingApifyIntegration] = useState(false);
  const [isRefreshingIntegration, setIsRefreshingIntegration] = useState(false);
  const [isSavingApifyIntegration, setIsSavingApifyIntegration] = useState(false);
  const [isSavingIntegration, setIsSavingIntegration] = useState(false);
  const [resettingApifyKey, setResettingApifyKey] = useState<ApifyIntegrationSettingKey | null>(null);
  const [resettingKey, setResettingKey] = useState<WhatsappIntegrationSettingKey | null>(null);
  const [visibleSecretPreviews, setVisibleSecretPreviews] = useState<
    Partial<Record<"wahaApiKey" | "apifyApiToken" | "apifyWebhookSecret", boolean>>
  >({});
  const redisDashboardUrl = process.env.NEXT_PUBLIC_REDIS_DASHBOARD_URL?.trim() ?? "";
  const bullBoardUrl = process.env.NEXT_PUBLIC_BULL_BOARD_URL?.trim() ?? "";

  const applyApifySettings = (settings: ApifyIntegrationSettings) => {
    setApifySettings(settings);
    setApifyForm({
      apifyApiToken: "",
      apifyWebhookSecret: "",
      actorIds: {
        instagram: settings.actorIds.instagram.value ?? "",
        tiktok: settings.actorIds.tiktok.value ?? "",
        youtube: settings.actorIds.youtube.value ?? "",
        facebook: settings.actorIds.facebook.value ?? "",
        x: settings.actorIds.x.value ?? "",
      },
    });
    setInitialApifyActorValues({
      instagram: settings.actorIds.instagram.value ?? "",
      tiktok: settings.actorIds.tiktok.value ?? "",
      youtube: settings.actorIds.youtube.value ?? "",
      facebook: settings.actorIds.facebook.value ?? "",
      x: settings.actorIds.x.value ?? "",
    });
  };

  const applyIntegrationSettings = (settings: WhatsappIntegrationSettings) => {
    setIntegrationSettings(settings);
    setIntegrationForm({
      wahaApiBaseUrl: settings.wahaApiBaseUrl.value ?? "",
      wahaSessionName: settings.wahaSessionName.value ?? "",
      wahaApiKey: "",
    });
    setInitialNonSecretValues({
      wahaApiBaseUrl: settings.wahaApiBaseUrl.value ?? "",
      wahaSessionName: settings.wahaSessionName.value ?? "",
    });
  };

  const loadApifyIntegrationStatus = async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setIsRefreshingApifyIntegration(true);
    }

    try {
      const response = await getApifyIntegrationSettings();
      applyApifySettings(response.data);
      return response.data;
    } finally {
      if (!silent) {
        setIsRefreshingApifyIntegration(false);
      }
    }
  };

  const loadScraperStatus = async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setIsRefreshingScraper(true);
    }

    try {
      const response = await testScraperConnection();
      setConnectionStatus(response.data);
      return response.data;
    } finally {
      if (!silent) {
        setIsRefreshingScraper(false);
      }
    }
  };

  const loadIntegrationStatus = async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setIsRefreshingIntegration(true);
    }

    try {
      const response = await getWhatsappIntegrationSettings();
      applyIntegrationSettings(response.data);
      return response.data;
    } finally {
      if (!silent) {
        setIsRefreshingIntegration(false);
      }
    }
  };

  useEffect(() => {
    if (isPending || !isAuthorized) {
      return;
    }

    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [scraperResponse, apifyResponse, integrationResponse] = await Promise.all([
          testScraperConnection(),
          getApifyIntegrationSettings(),
          getWhatsappIntegrationSettings(),
        ]);

        setConnectionStatus(scraperResponse.data);
        setApifySettings(apifyResponse.data);
        setApifyForm({
          apifyApiToken: "",
          apifyWebhookSecret: "",
          actorIds: {
            instagram: apifyResponse.data.actorIds.instagram.value ?? "",
            tiktok: apifyResponse.data.actorIds.tiktok.value ?? "",
            youtube: apifyResponse.data.actorIds.youtube.value ?? "",
            facebook: apifyResponse.data.actorIds.facebook.value ?? "",
            x: apifyResponse.data.actorIds.x.value ?? "",
          },
        });
        setInitialApifyActorValues({
          instagram: apifyResponse.data.actorIds.instagram.value ?? "",
          tiktok: apifyResponse.data.actorIds.tiktok.value ?? "",
          youtube: apifyResponse.data.actorIds.youtube.value ?? "",
          facebook: apifyResponse.data.actorIds.facebook.value ?? "",
          x: apifyResponse.data.actorIds.x.value ?? "",
        });
        setIntegrationSettings(integrationResponse.data);
        setIntegrationForm({
          wahaApiBaseUrl: integrationResponse.data.wahaApiBaseUrl.value ?? "",
          wahaSessionName: integrationResponse.data.wahaSessionName.value ?? "",
          wahaApiKey: "",
        });
        setInitialNonSecretValues({
          wahaApiBaseUrl: integrationResponse.data.wahaApiBaseUrl.value ?? "",
          wahaSessionName: integrationResponse.data.wahaSessionName.value ?? "",
        });
      } catch (errorValue) {
        toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat konfigurasi sistem");
      } finally {
        setIsLoading(false);
        setIsRefreshingScraper(false);
        setIsRefreshingApifyIntegration(false);
        setIsRefreshingIntegration(false);
      }
    };

    void loadInitialData();
  }, [isAuthorized, isPending]);

  const handleIntegrationFormChange = (field: keyof IntegrationFormState, value: string) => {
    setIntegrationForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleApifyActorChange = (platform: ApifyPlatform, value: string) => {
    setApifyForm((previous) => ({
      ...previous,
      actorIds: {
        ...previous.actorIds,
        [platform]: value,
      },
    }));
  };

  const handleApifyFormChange = (
    field: keyof Pick<ApifyIntegrationFormState, "apifyApiToken" | "apifyWebhookSecret">,
    value: string,
  ) => {
    setApifyForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const hasNonSecretChanges =
    integrationForm.wahaApiBaseUrl.trim() !== initialNonSecretValues.wahaApiBaseUrl ||
    integrationForm.wahaSessionName.trim() !== initialNonSecretValues.wahaSessionName;
  const hasSecretChanges = integrationForm.wahaApiKey.trim().length > 0;
  const canSubmitIntegration = hasNonSecretChanges || hasSecretChanges;
  const hasApifyActorChanges = (Object.keys(apifyForm.actorIds) as ApifyPlatform[]).some(
    (platform) => apifyForm.actorIds[platform].trim() !== initialApifyActorValues[platform],
  );
  const hasApifySecretChanges =
    apifyForm.apifyApiToken.trim().length > 0 || apifyForm.apifyWebhookSecret.trim().length > 0;
  const canSubmitApify = hasApifyActorChanges || hasApifySecretChanges;

  const handleSaveApifyIntegration = async () => {
    if (!apifySettings) {
      return;
    }

    const payload: {
      apifyApiToken?: string;
      apifyWebhookSecret?: string;
      actorIds?: Partial<Record<ApifyPlatform, string>>;
    } = {};

    if (apifyForm.apifyApiToken.trim().length > 0) {
      payload.apifyApiToken = apifyForm.apifyApiToken.trim();
    }

    if (apifyForm.apifyWebhookSecret.trim().length > 0) {
      payload.apifyWebhookSecret = apifyForm.apifyWebhookSecret.trim();
    }

    const actorIds = (Object.keys(apifyForm.actorIds) as ApifyPlatform[]).reduce(
      (result, platform) => {
        const nextValue = apifyForm.actorIds[platform].trim();
        if (nextValue !== initialApifyActorValues[platform]) {
          result[platform] = nextValue;
        }
        return result;
      },
      {} as Partial<Record<ApifyPlatform, string>>,
    );

    if (Object.keys(actorIds).length > 0) {
      payload.actorIds = actorIds;
    }

    if (!payload.apifyApiToken && !payload.apifyWebhookSecret && !payload.actorIds) {
      toast.error("Belum ada perubahan konfigurasi Apify yang bisa disimpan.");
      return;
    }

    setIsSavingApifyIntegration(true);
    try {
      const response = await updateApifyIntegrationSettings(payload);
      applyApifySettings(response.data);
      await loadScraperStatus({ silent: true });
      toast.success(response.message ?? "Konfigurasi integrasi Apify berhasil diperbarui.");
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal menyimpan konfigurasi integrasi Apify");
    } finally {
      setIsSavingApifyIntegration(false);
    }
  };

  const handleSaveIntegration = async () => {
    if (!integrationSettings) {
      return;
    }

    const nextWahaApiBaseUrl = integrationForm.wahaApiBaseUrl.trim();
    const nextWahaSessionName = integrationForm.wahaSessionName.trim();

    if (
      (integrationForm.wahaApiBaseUrl !== initialNonSecretValues.wahaApiBaseUrl && nextWahaApiBaseUrl.length === 0) ||
      (integrationForm.wahaSessionName !== initialNonSecretValues.wahaSessionName && nextWahaSessionName.length === 0)
    ) {
      toast.error("Untuk menghapus override field non-secret, gunakan tombol Reset Override.");
      return;
    }

    const payload: {
      wahaApiBaseUrl?: string;
      wahaApiKey?: string;
      wahaSessionName?: string;
    } = {};

    if (nextWahaApiBaseUrl !== initialNonSecretValues.wahaApiBaseUrl) {
      payload.wahaApiBaseUrl = nextWahaApiBaseUrl;
    }

    if (nextWahaSessionName !== initialNonSecretValues.wahaSessionName) {
      payload.wahaSessionName = nextWahaSessionName;
    }

    if (integrationForm.wahaApiKey.trim().length > 0) {
      payload.wahaApiKey = integrationForm.wahaApiKey.trim();
    }

    if (Object.keys(payload).length === 0) {
      toast.error("Belum ada perubahan konfigurasi yang bisa disimpan.");
      return;
    }

    setIsSavingIntegration(true);
    try {
      const response = await updateWhatsappIntegrationSettings(payload);
      applyIntegrationSettings(response.data);
      toast.success(response.message ?? "Konfigurasi integrasi WhatsApp berhasil diperbarui.");
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal menyimpan konfigurasi integrasi WhatsApp");
    } finally {
      setIsSavingIntegration(false);
    }
  };

  const handleResetIntegrationField = async (key: WhatsappIntegrationSettingKey) => {
    setResettingKey(key);
    try {
      const response = await resetWhatsappIntegrationSettings([key]);
      applyIntegrationSettings(response.data);
      toast.success(response.message ?? "Override konfigurasi berhasil direset.");
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal mereset override konfigurasi");
    } finally {
      setResettingKey(null);
    }
  };

  const handleResetApifyIntegrationField = async (key: ApifyIntegrationSettingKey) => {
    setResettingApifyKey(key);
    try {
      const response = await resetApifyIntegrationSettings([key]);
      applyApifySettings(response.data);
      await loadScraperStatus({ silent: true });
      toast.success(response.message ?? "Override konfigurasi Apify berhasil direset.");
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal mereset override konfigurasi Apify");
    } finally {
      setResettingApifyKey(null);
    }
  };

  const toggleSecretPreview = (key: "wahaApiKey" | "apifyApiToken" | "apifyWebhookSecret") => {
    setVisibleSecretPreviews((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
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

  const badge = getConnectionBadge(connectionStatus);
  const apifyReady = Boolean(apifySettings?.apifyApiToken.hasValue && apifySettings?.apifyWebhookSecret.hasValue);
  const wahaReady = Boolean(integrationSettings?.wahaApiBaseUrl.hasValue && integrationSettings?.wahaApiKey.hasValue);

  const apifyTokenBadge = apifySettings ? getSourceBadge(apifySettings.apifyApiToken.source) : null;
  const apifyWebhookBadge = apifySettings ? getSourceBadge(apifySettings.apifyWebhookSecret.source) : null;
  const wahaBaseUrlBadge = integrationSettings ? getSourceBadge(integrationSettings.wahaApiBaseUrl.source) : null;
  const wahaSessionBadge = integrationSettings ? getSourceBadge(integrationSettings.wahaSessionName.source) : null;
  const wahaApiKeyBadge = integrationSettings ? getSourceBadge(integrationSettings.wahaApiKey.source) : null;

  return (
    <div className="space-y-6">
      <Card className="app-bg-hero app-border-soft">
        <CardContent className="space-y-4 px-6 py-8 md:px-8">
          <Badge
            variant="outline"
            className="rounded-full border-emerald-200 bg-background/75 px-3 py-1 text-emerald-700 dark:bg-card/75"
          >
            System / Konfigurasi
          </Badge>
          <div className="space-y-2">
            <h1 className="font-semibold text-3xl tracking-tight">Konfigurasi Sistem</h1>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70 shadow-none">
        <CardHeader className="gap-4 border-b bg-muted/25">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    apifyReady
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }
                >
                  {apifyReady ? "Apify siap" : "Apify belum lengkap"}
                </Badge>
              </div>
              <p className="max-w-2xl text-muted-foreground text-sm">
                Token, webhook secret, dan actor per platform bisa dioverride dari panel sysadmin. Nilai database akan
                menang terhadap env deploy, sehingga perubahan bisa dilakukan tanpa redeploy.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void loadApifyIntegrationStatus()}
                disabled={isRefreshingApifyIntegration || isLoading}
              >
                {isRefreshingApifyIntegration ? <Spinner className="mr-2" /> : <RefreshCw className="mr-2 size-4" />}
                Refresh Apify
              </Button>
              <Button
                onClick={() => void handleSaveApifyIntegration()}
                disabled={!canSubmitApify || isSavingApifyIntegration || isLoading}
              >
                {isSavingApifyIntegration ? <Spinner className="mr-2" /> : <Save className="mr-2 size-4" />}
                Simpan Apify
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-sm">APIFY API Token</p>
                <div className="flex items-center gap-2">
                  {apifyTokenBadge ? (
                    <Badge variant="outline" className={apifyTokenBadge.className}>
                      {apifyTokenBadge.label}
                    </Badge>
                  ) : null}
                  <Badge
                    variant="outline"
                    className={
                      apifySettings?.apifyApiToken.hasValue
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }
                  >
                    {apifySettings?.apifyApiToken.hasValue ? "Stored" : "Missing"}
                  </Badge>
                </div>
              </div>
              <Input
                type="password"
                placeholder="Tempel token baru hanya jika ingin mengganti"
                value={apifyForm.apifyApiToken}
                onChange={(event) => handleApifyFormChange("apifyApiToken", event.target.value)}
                disabled={isLoading || isSavingApifyIntegration}
                className="font-mono text-sm"
              />
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                {apifySettings?.apifyApiToken.hasValue ? (
                  <>
                    <span>
                      {visibleSecretPreviews.apifyApiToken
                        ? (apifySettings.apifyApiToken.maskedPreview ?? "Preview tidak tersedia.")
                        : "Secret aktif tersimpan aman."}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => toggleSecretPreview("apifyApiToken")}
                    >
                      {visibleSecretPreviews.apifyApiToken ? (
                        <EyeOff className="mr-1 size-3.5" />
                      ) : (
                        <Eye className="mr-1 size-3.5" />
                      )}
                      {visibleSecretPreviews.apifyApiToken ? "Sembunyikan" : "Lihat preview"}
                    </Button>
                  </>
                ) : (
                  <span>Belum ada token aktif.</span>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleResetApifyIntegrationField("apify_api_token")}
                  disabled={
                    apifySettings?.apifyApiToken.source !== "database" || resettingApifyKey === "apify_api_token"
                  }
                >
                  {resettingApifyKey === "apify_api_token" ? (
                    <Spinner className="mr-2" />
                  ) : (
                    <RotateCcw className="mr-2 size-4" />
                  )}
                  Reset
                </Button>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-sm">APIFY Webhook Secret</p>
                <div className="flex items-center gap-2">
                  {apifyWebhookBadge ? (
                    <Badge variant="outline" className={apifyWebhookBadge.className}>
                      {apifyWebhookBadge.label}
                    </Badge>
                  ) : null}
                  <Badge
                    variant="outline"
                    className={
                      apifySettings?.apifyWebhookSecret.hasValue
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }
                  >
                    {apifySettings?.apifyWebhookSecret.hasValue ? "Stored" : "Missing"}
                  </Badge>
                </div>
              </div>
              <Input
                type="password"
                placeholder="Minimal 32 karakter"
                value={apifyForm.apifyWebhookSecret}
                onChange={(event) => handleApifyFormChange("apifyWebhookSecret", event.target.value)}
                disabled={isLoading || isSavingApifyIntegration}
                className="font-mono text-sm"
              />
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                {apifySettings?.apifyWebhookSecret.hasValue ? (
                  <>
                    <span>
                      {visibleSecretPreviews.apifyWebhookSecret
                        ? (apifySettings.apifyWebhookSecret.maskedPreview ?? "Preview tidak tersedia.")
                        : "Secret aktif tersimpan aman."}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => toggleSecretPreview("apifyWebhookSecret")}
                    >
                      {visibleSecretPreviews.apifyWebhookSecret ? (
                        <EyeOff className="mr-1 size-3.5" />
                      ) : (
                        <Eye className="mr-1 size-3.5" />
                      )}
                      {visibleSecretPreviews.apifyWebhookSecret ? "Sembunyikan" : "Lihat preview"}
                    </Button>
                  </>
                ) : (
                  <span>Belum ada webhook secret aktif.</span>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                Input ini sengaja selalu kosong saat halaman dibuka. Secret aktif tetap dibaca dari sumber saat ini
                ({apifySettings ? getSourceBadge(apifySettings.apifyWebhookSecret.source).label : "runtime app"}) dan
                hanya perlu diisi jika ingin override dari panel.
              </p>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleResetApifyIntegrationField("apify_webhook_secret")}
                  disabled={
                    apifySettings?.apifyWebhookSecret.source !== "database" ||
                    resettingApifyKey === "apify_webhook_secret"
                  }
                >
                  {resettingApifyKey === "apify_webhook_secret" ? (
                    <Spinner className="mr-2" />
                  ) : (
                    <RotateCcw className="mr-2 size-4" />
                  )}
                  Reset
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-sm">Actor per Platform</p>
              {apifySettings?.configuredPlatforms.length ? (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  {apifySettings.configuredPlatforms.length} platform siap
                </Badge>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {PLATFORM_OPTIONS.map((platform) => {
                const actorField = apifySettings?.actorIds[platform.value as ApifyPlatform];
                const actorBadge = actorField ? getSourceBadge(actorField.source) : null;
                const resetKey = `apify_${platform.value}_actor_id` as ApifyIntegrationSettingKey;

                return (
                  <div key={platform.value} className="space-y-3 rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-sm">{platform.label}</p>
                      <Badge
                        variant="outline"
                        className={
                          actorField?.hasValue
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }
                      >
                        {actorField?.hasValue ? "Siap" : "Belum di-set"}
                      </Badge>
                    </div>
                    <Input
                      value={apifyForm.actorIds[platform.value as ApifyPlatform]}
                      onChange={(event) => handleApifyActorChange(platform.value as ApifyPlatform, event.target.value)}
                      placeholder={`Actor ${platform.label}`}
                      disabled={isLoading || isSavingApifyIntegration}
                      className="font-mono text-sm"
                    />
                    <div className="flex items-center justify-between gap-3">
                      {actorBadge ? (
                        <Badge variant="outline" className={actorBadge.className}>
                          {actorBadge.label}
                        </Badge>
                      ) : (
                        <span />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleResetApifyIntegrationField(resetKey)}
                        disabled={actorField?.source !== "database" || resettingApifyKey === resetKey}
                      >
                        {resettingApifyKey === resetKey ? (
                          <Spinner className="mr-2" />
                        ) : (
                          <RotateCcw className="mr-2 size-4" />
                        )}
                        Reset
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70 shadow-none">
        <CardHeader className="gap-4 border-b bg-muted/25">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    wahaReady
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }
                >
                  {wahaReady ? "WAHA siap" : "WAHA belum lengkap"}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="max-w-2xl text-muted-foreground text-sm">
                  Konfigurasi WAHA tetap dipisahkan di panel ini agar alur notifikasi dan sinkronisasi WhatsApp bisa
                  diubah tanpa menyentuh env deploy.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void loadIntegrationStatus()}
                disabled={isRefreshingIntegration || isLoading}
              >
                {isRefreshingIntegration ? <Spinner className="mr-2" /> : <RefreshCw className="mr-2 size-4" />}
                Refresh Integrasi
              </Button>
              <Button
                onClick={() => void handleSaveIntegration()}
                disabled={!canSubmitIntegration || isSavingIntegration || isLoading}
              >
                {isSavingIntegration ? <Spinner className="mr-2" /> : <Save className="mr-2 size-4" />}
                Simpan Override
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden grid-cols-[240px_minmax(0,1fr)_180px_150px] border-b bg-muted/20 px-5 py-3 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.22em] lg:grid">
            <span>Variable</span>
            <span>Value</span>
            <span>Runtime Source</span>
            <span className="text-right">Action</span>
          </div>

          <div className="divide-y">
            <div className="grid gap-4 px-5 py-5 lg:grid-cols-[240px_minmax(0,1fr)_180px_150px] lg:items-start">
              <div className="space-y-2">
                <p className="font-medium text-sm">WAHA Base URL</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="waha-api-base-url" className="sr-only">
                  WAHA Base URL
                </Label>
                <Input
                  id="waha-api-base-url"
                  placeholder="https://waha.example.com"
                  value={integrationForm.wahaApiBaseUrl}
                  onChange={(event) => handleIntegrationFormChange("wahaApiBaseUrl", event.target.value)}
                  disabled={isLoading || isSavingIntegration}
                  className="font-mono text-sm"
                />
                <p className="text-muted-foreground text-xs">
                  Aktif sekarang: {integrationSettings?.wahaApiBaseUrl.value ?? "-"}
                </p>
              </div>
              <div className="space-y-2">
                {wahaBaseUrlBadge ? (
                  <Badge variant="outline" className={wahaBaseUrlBadge.className}>
                    {wahaBaseUrlBadge.label}
                  </Badge>
                ) : null}
              </div>
              <div className="flex justify-start lg:justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleResetIntegrationField("waha_api_base_url")}
                  disabled={
                    integrationSettings?.wahaApiBaseUrl.source !== "database" || resettingKey === "waha_api_base_url"
                  }
                >
                  {resettingKey === "waha_api_base_url" ? (
                    <Spinner className="mr-2" />
                  ) : (
                    <RotateCcw className="mr-2 size-4" />
                  )}
                  Reset
                </Button>
              </div>
            </div>

            <div className="grid gap-4 px-5 py-5 lg:grid-cols-[240px_minmax(0,1fr)_180px_150px] lg:items-start">
              <div className="space-y-2">
                <p className="font-medium text-sm">WAHA Session Name</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="waha-session-name" className="sr-only">
                  WAHA Session Name
                </Label>
                <Input
                  id="waha-session-name"
                  placeholder="default"
                  value={integrationForm.wahaSessionName}
                  onChange={(event) => handleIntegrationFormChange("wahaSessionName", event.target.value)}
                  disabled={isLoading || isSavingIntegration}
                  className="font-mono text-sm"
                />
                <p className="text-muted-foreground text-xs">
                  Aktif sekarang: {integrationSettings?.wahaSessionName.value ?? "-"}
                </p>
              </div>
              <div className="space-y-2">
                {wahaSessionBadge ? (
                  <Badge variant="outline" className={wahaSessionBadge.className}>
                    {wahaSessionBadge.label}
                  </Badge>
                ) : null}
                <p className="text-muted-foreground text-xs">Default aplikasi tetap `default` jika source kosong.</p>
              </div>
              <div className="flex justify-start lg:justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleResetIntegrationField("waha_session_name")}
                  disabled={
                    integrationSettings?.wahaSessionName.source !== "database" || resettingKey === "waha_session_name"
                  }
                >
                  {resettingKey === "waha_session_name" ? (
                    <Spinner className="mr-2" />
                  ) : (
                    <RotateCcw className="mr-2 size-4" />
                  )}
                  Reset
                </Button>
              </div>
            </div>

            <div className="grid gap-4 px-5 py-5 lg:grid-cols-[240px_minmax(0,1fr)_180px_150px] lg:items-start">
              <div className="space-y-2">
                <p className="font-medium text-sm">WAHA API Key</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="waha-api-key" className="sr-only">
                  WAHA API Key
                </Label>
                <Input
                  id="waha-api-key"
                  type="password"
                  placeholder="Tempel nilai baru hanya jika ingin mengganti"
                  value={integrationForm.wahaApiKey}
                  onChange={(event) => handleIntegrationFormChange("wahaApiKey", event.target.value)}
                  disabled={isLoading || isSavingIntegration}
                  className="font-mono text-sm"
                />
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                  {integrationSettings?.wahaApiKey.hasValue ? (
                    <>
                      <span>
                        {visibleSecretPreviews.wahaApiKey
                          ? (integrationSettings.wahaApiKey.maskedPreview ?? "Preview tidak tersedia.")
                          : "Secret aktif tersimpan aman."}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => toggleSecretPreview("wahaApiKey")}
                      >
                        {visibleSecretPreviews.wahaApiKey ? (
                          <EyeOff className="mr-1 size-3.5" />
                        ) : (
                          <Eye className="mr-1 size-3.5" />
                        )}
                        {visibleSecretPreviews.wahaApiKey ? "Sembunyikan" : "Lihat preview"}
                      </Button>
                    </>
                  ) : (
                    <span>Belum ada secret aktif.</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {wahaApiKeyBadge ? (
                  <Badge variant="outline" className={wahaApiKeyBadge.className}>
                    {wahaApiKeyBadge.label}
                  </Badge>
                ) : null}
                <Badge
                  variant="outline"
                  className={
                    integrationSettings?.wahaApiKey.hasValue
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }
                >
                  {integrationSettings?.wahaApiKey.hasValue ? "Stored" : "Missing"}
                </Badge>
              </div>
              <div className="flex justify-start lg:justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleResetIntegrationField("waha_api_key")}
                  disabled={integrationSettings?.wahaApiKey.source !== "database" || resettingKey === "waha_api_key"}
                >
                  {resettingKey === "waha_api_key" ? (
                    <Spinner className="mr-2" />
                  ) : (
                    <RotateCcw className="mr-2 size-4" />
                  )}
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <KeyRound className="size-4" />
        <AlertTitle>Secret bersifat replace-only</AlertTitle>
        <AlertDescription>
          Token Apify, webhook secret, dan API key WAHA tidak akan pernah ditampilkan ulang dari server. Isi field
          secret hanya saat ingin mengganti nilainya.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Status Koneksi Scraper</CardTitle>
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
                <p className="text-muted-foreground text-sm">
                  {connectionStatus?.message ?? "Belum ada data koneksi."}
                </p>
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
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
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
          <CardTitle>Actor Runtime Aktif</CardTitle>
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
          <CardTitle>Verifikasi Manual Scraper</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-medium text-sm">Test koneksi Apify sekarang</p>
              <p className="text-muted-foreground text-sm">
                Gunakan tombol ini untuk memeriksa apakah token server masih valid dan actor Apify tiap platform sudah
                terbaca.
              </p>
            </div>
            <Button
              onClick={async () => {
                try {
                  await loadScraperStatus();
                  toast.success("Koneksi scraper berhasil diperbarui.");
                } catch (errorValue) {
                  toast.error(errorValue instanceof Error ? errorValue.message : "Gagal mengecek koneksi Apify");
                }
              }}
              disabled={isRefreshingScraper || isLoading}
            >
              {isRefreshingScraper ? <Spinner className="mr-2" /> : <RefreshCw className="mr-2 size-4" />}
              Test Koneksi
            </Button>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-medium text-sm">Dashboard Redis Queue</p>
              <p className="text-muted-foreground text-sm">
                Pantau antrean, retry, dan beban worker untuk memastikan jadwal scraper berjalan stabil.
              </p>
            </div>
            <Button asChild variant="outline" disabled={!redisDashboardUrl}>
              <a href={redisDashboardUrl || "#"} target="_blank" rel="noreferrer noopener">
                <ExternalLink className="mr-2 size-4" />
                Buka Redis Dashboard
              </a>
            </Button>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-medium text-sm">BullMQ Queue Monitor</p>
              <p className="text-muted-foreground text-sm">
                Gunakan saat perlu audit job backlog, stuck run, atau job yang gagal diproses oleh worker scraper.
              </p>
            </div>
            <Button asChild variant="outline" disabled={!bullBoardUrl}>
              <a href={bullBoardUrl || "#"} target="_blank" rel="noreferrer noopener">
                <ExternalLink className="mr-2 size-4" />
                Buka Bull Board
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
