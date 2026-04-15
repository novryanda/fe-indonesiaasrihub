"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { Activity, BellRing, Eye, Globe2, MapPinned, MessageCircleHeart, UsersRound } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { IndonesiaMap } from "@/components/shadcnmaps/maps/indonesia";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { getNationalDashboard } from "@/features/dashboard/api/dashboard-api";
import {
  INDONESIA_CHOROPLETH_BUCKETS,
  INDONESIA_REGION_MAP,
} from "@/features/dashboard/constants/indonesia-region-map";
import type { DashboardMapRegionItem, NationalDashboardData } from "@/features/dashboard/types/dashboard.type";
import { getMonitoringSosmedData } from "@/features/monitoring-sosmed/api/monitoring-sosmed-api";
import type {
  MonitoringDailyPlatformAreaItem,
  MonitoringDailyPlatformMetric,
  MonitoringPlatform,
  MonitoringSosmedData,
} from "@/features/monitoring-sosmed/types/monitoring-sosmed.type";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

const numberFormatter = new Intl.NumberFormat("id-ID");
const compactFormatter = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });
const MONITORING_PLATFORMS: MonitoringPlatform[] = ["instagram", "tiktok", "youtube", "facebook", "x"];
const monthOptions = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
] as const;

const platformColors: Record<string, string> = {
  instagram: "#db2777",
  tiktok: "#0891b2",
  youtube: "#dc2626",
  facebook: "#2563eb",
  x: "#334155",
};

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatCompact(value: number) {
  return compactFormatter.format(value);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Belum ada sinkronisasi";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function aggregateMonitoringDailyMetrics(items: MonitoringDailyPlatformAreaItem[]) {
  const totals = new Map<MonitoringPlatform, MonitoringDailyPlatformMetric>();
  const dailyTotals: Array<{
    period_date: string;
    period_label: string;
    total_views: number;
    total_interactions: number;
    engagement_rate: number;
  }> = [];

  for (const platform of MONITORING_PLATFORMS) {
    totals.set(platform, {
      platform,
      views: 0,
      likes: 0,
      comments: 0,
      reposts: 0,
      engagement_rate: 0,
    });
  }

  for (const item of items) {
    dailyTotals.push({
      period_date: item.period_date,
      period_label: item.period_label,
      total_views: item.platform_metrics.reduce((sum, metric) => sum + metric.views, 0),
      total_interactions: item.platform_metrics.reduce(
        (sum, metric) => sum + metric.likes + metric.comments + metric.reposts,
        0,
      ),
      engagement_rate: 0,
    });

    for (const metric of item.platform_metrics) {
      const current = totals.get(metric.platform);

      if (!current) {
        continue;
      }

      current.views += metric.views;
      current.likes += metric.likes;
      current.comments += metric.comments;
      current.reposts += metric.reposts;
    }
  }

  return {
    platformTotals: MONITORING_PLATFORMS.map((platform) => totals.get(platform))
      .filter((item): item is MonitoringDailyPlatformMetric => Boolean(item))
      .filter((item) => item.views > 0 || item.likes > 0 || item.comments > 0 || item.reposts > 0),
    dailyTotals: dailyTotals.map((item) => ({
      ...item,
      engagement_rate:
        item.total_views > 0 ? Number(((item.total_interactions / item.total_views) * 100).toFixed(1)) : 0,
    })),
  };
}

function findSelectedRegion(data: NationalDashboardData | null, regionId: string | null) {
  if (!data || !regionId) {
    return null;
  }

  if (regionId === "ID") {
    return {
      region_id: "ID",
      wilayah_id: data.scope.wilayah_id,
      wilayah_kode: data.scope.wilayah_kode,
      wilayah_nama: data.scope.wilayah_nama,
      account_count: data.stats.total_akun_sosmed,
      pic_count: 0,
      valid_post_count: data.stats.total_posting_valid,
      total_views: data.stats.total_tayangan,
      choropleth_bucket: 0,
    };
  }

  return data.map_regions.find((item) => item.region_id === regionId) ?? null;
}

export function NationalDashboardView() {
  const { isAuthorized, isPending } = useRoleGuard(["superadmin"]);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [data, setData] = useState<NationalDashboardData | null>(null);
  const [monitoringData, setMonitoringData] = useState<MonitoringSosmedData | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const yearOptions = Array.from({ length: 5 }, (_, index) => String(now.getFullYear() - index));

  useEffect(() => {
    if (!isAuthorized || isPending) {
      return;
    }

    setLoading(true);
    setError(null);
    setMonitoringData(null);

    void Promise.all([
      getNationalDashboard({
        month: Number(selectedMonth),
        year: Number(selectedYear),
      }),
      getMonitoringSosmedData({
        month: Number(selectedMonth),
        year: Number(selectedYear),
      }).catch(() => null),
    ])
      .then(([dashboardResponse, monitoringResponse]) => {
        setData(dashboardResponse.data);
        setMonitoringData(monitoringResponse?.data ?? null);
      })
      .catch((caught) => {
        const message = caught instanceof Error ? caught.message : "Gagal memuat dashboard nasional.";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [isAuthorized, isPending, selectedMonth, selectedYear]);

  const selectedRegion = useMemo(() => findSelectedRegion(data, selectedRegionId), [data, selectedRegionId]);

  const { platformTotals: monitoringPlatformTotals, dailyTotals: monitoringDailyTotals } = useMemo(
    () => aggregateMonitoringDailyMetrics(monitoringData?.daily_platform_area ?? []),
    [monitoringData],
  );

  const trendChartData = useMemo(() => {
    if (!data) {
      return [];
    }

    const merged = new Map(
      data.trend.map((item) => [
        item.period_date,
        {
          period_date: item.period_date,
          period_label: item.period_label,
          valid_post_count: item.valid_post_count,
          total_views: item.total_views,
          total_interactions: item.total_interactions,
          engagement_rate:
            item.total_views > 0 ? Number(((item.total_interactions / item.total_views) * 100).toFixed(1)) : 0,
        },
      ]),
    );

    for (const item of monitoringDailyTotals) {
      const current = merged.get(item.period_date);

      merged.set(item.period_date, {
        period_date: item.period_date,
        period_label: current?.period_label ?? item.period_label,
        valid_post_count: current?.valid_post_count ?? 0,
        total_views: item.total_views,
        total_interactions: item.total_interactions,
        engagement_rate: item.engagement_rate,
      });
    }

    return [...merged.values()].sort((left, right) => left.period_date.localeCompare(right.period_date));
  }, [data, monitoringDailyTotals]);

  const platformDistributionItems = useMemo(() => {
    const dashboardItems = new Map((data?.platform_distribution ?? []).map((item) => [item.platform, item]));
    const monitoringItems = new Map(monitoringPlatformTotals.map((item) => [item.platform, item]));

    return MONITORING_PLATFORMS.map((platform) => {
      const dashboardItem = dashboardItems.get(platform);
      const monitoringItem = monitoringItems.get(platform);
      const totalViews = monitoringItem?.views ?? dashboardItem?.total_views ?? 0;
      const totalInteractions =
        monitoringItem != null
          ? monitoringItem.likes + monitoringItem.comments + monitoringItem.reposts
          : (dashboardItem?.total_interactions ?? 0);
      const postCount = dashboardItem?.post_count ?? 0;

      return {
        platform,
        account_count: dashboardItem?.account_count ?? 0,
        post_count: postCount,
        total_views: totalViews,
        total_interactions: totalInteractions,
        share_value: totalViews > 0 ? totalViews : postCount,
      };
    }).filter(
      (item) => item.account_count > 0 || item.post_count > 0 || item.total_views > 0 || item.total_interactions > 0,
    );
  }, [data, monitoringPlatformTotals]);

  const topNationalAccounts = useMemo(() => {
    if (monitoringData?.top_accounts.length) {
      const sorted = [...monitoringData.top_accounts].sort((left, right) => right.total_views - left.total_views);
      const highlightedAccounts = sorted.slice(0, 5).map((account, index) => ({
        id: account.id,
        rank: index + 1,
        platform: account.platform,
        profile_name: account.profile_name,
        username: account.username,
        total_views: account.total_views,
        metric_label: "Engagement",
        metric_value: `${account.engagement_rate.toFixed(1)}%`,
        posting_label: "Posting",
        posting_value: formatNumber(account.posting_count),
        wilayah_label: account.wilayah?.nama ?? "Indonesia",
        highlight_label: null as string | null,
      }));

      const indonesiaAccount = sorted.find((account) => {
        const wilayahLabel = account.wilayah?.nama?.toLowerCase();
        return wilayahLabel === "indonesia" || wilayahLabel === "nasional" || account.wilayah == null;
      });

      if (indonesiaAccount && !highlightedAccounts.some((account) => account.id === indonesiaAccount.id)) {
        highlightedAccounts.push({
          id: indonesiaAccount.id,
          rank: sorted.findIndex((account) => account.id === indonesiaAccount.id) + 1,
          platform: indonesiaAccount.platform,
          profile_name: indonesiaAccount.profile_name,
          username: indonesiaAccount.username,
          total_views: indonesiaAccount.total_views,
          metric_label: "Engagement",
          metric_value: `${indonesiaAccount.engagement_rate.toFixed(1)}%`,
          posting_label: "Posting",
          posting_value: formatNumber(indonesiaAccount.posting_count),
          wilayah_label: indonesiaAccount.wilayah?.nama ?? "Indonesia",
          highlight_label: "Akun Indonesia",
        });
      }

      return highlightedAccounts;
    }

    return (data?.top_accounts ?? []).slice(0, 5).map((account, index) => ({
      id: account.id,
      rank: index + 1,
      platform: account.platform,
      profile_name: account.profile_name,
      username: account.username,
      total_views: account.total_views,
      metric_label: "Interaksi",
      metric_value: formatNumber(account.total_interactions),
      posting_label: "Posting valid",
      posting_value: formatNumber(account.valid_post_count),
      wilayah_label: account.wilayah?.nama ?? "Indonesia",
      highlight_label: null as string | null,
    }));
  }, [data, monitoringData]);

  const topRegionsWithIndonesia = useMemo(() => {
    if (!data) {
      return [];
    }

    if (data.top_regions.some((region) => region.region_id === "ID")) {
      return data.top_regions.slice(0, 5);
    }

    const indonesiaRegion: DashboardMapRegionItem = {
      region_id: "ID",
      wilayah_id: data.scope.wilayah_id,
      wilayah_kode: data.scope.wilayah_kode,
      wilayah_nama: data.scope.wilayah_nama,
      account_count: data.stats.total_akun_sosmed,
      pic_count: 0,
      valid_post_count: data.stats.total_posting_valid,
      total_views: data.stats.total_tayangan,
      choropleth_bucket: 0,
    };

    return [indonesiaRegion, ...data.top_regions.filter((region) => region.region_id !== "ID").slice(0, 4)];
  }, [data]);

  const trendDescription = monitoringData?.latest_scraped_at
    ? `Pergerakan posting valid harian dan tayangan/engagement dari hasil scraping. Sinkronisasi terakhir ${formatDateTime(
        monitoringData.latest_scraped_at,
      )}.`
    : "Pergerakan posting valid, tayangan, dan engagement harian.";

  const platformDescription = monitoringData?.latest_scraped_at
    ? `Kontribusi tayangan hasil scraping per platform, dilengkapi jumlah akun dan posting valid. Sinkronisasi terakhir ${formatDateTime(
        monitoringData.latest_scraped_at,
      )}.`
    : "Porsi posting valid berdasarkan platform pada periode terpilih.";

  const topAccountsDescription = monitoringData?.latest_scraped_at
    ? `Peringkat akun berdasarkan tayangan hasil scraping nasional. Akun Indonesia ikut ditampilkan bila tersedia pada periode ini.`
    : "Peringkat akun berdasarkan tayangan pada periode yang dipilih.";

  function handleMapContainerClick(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as Element;

    if (target.closest("[data-slot='map-region']")) {
      return;
    }

    if (target.closest("[data-slot='map']") || target.closest("[data-slot='map-zoom-layer']")) {
      setSelectedRegionId((current) => (current === "ID" ? null : "ID"));
    }
  }

  const statCards = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        label: "User Aktif",
        value: formatNumber(data.stats.total_user_aktif),
        helper: "Total PIC sosmed aktif",
        icon: UsersRound,
      },
      {
        label: "Akun Sosmed",
        value: formatNumber(data.stats.total_akun_sosmed),
        helper: "Semua akun terdaftar",
        icon: Globe2,
      },
      {
        label: "Posting Valid",
        value: formatNumber(data.stats.total_posting_valid),
        helper: data.selected_period.label,
        icon: Activity,
      },
      {
        label: "Menunggu Validasi",
        value: formatNumber(data.stats.bukti_menunggu_validasi),
        helper: "Queue validasi berjalan",
        icon: BellRing,
      },
      {
        label: "Tayangan",
        value: formatCompact(data.stats.total_tayangan),
        helper: "Akumulasi bulan terpilih",
        icon: Eye,
      },
      {
        label: "Engagement",
        value: `${data.stats.avg_engagement_rate.toFixed(1)}%`,
        helper: "Rata-rata ((like + komentar + repost) / views) x 100 dari hasil scraping",
        icon: MessageCircleHeart,
      },
    ];
  }, [data]);

  const mapOverrides = useMemo(() => {
    const regionsById = new Map((data?.map_regions ?? []).map((item) => [item.region_id, item]));

    return INDONESIA_REGION_MAP.map((region) => {
      const stats = regionsById.get(region.regionId);
      const bucket = INDONESIA_CHOROPLETH_BUCKETS[stats?.choropleth_bucket ?? 0];

      return {
        id: region.regionId,
        className: bucket.className,
        tooltipContent: (
          <div className="space-y-1">
            <p className="font-medium">{stats?.wilayah_nama ?? region.label}</p>
            <p className="text-muted-foreground text-xs">{stats?.wilayah_kode ?? region.wilayahKode}</p>
            <p className="text-muted-foreground">Akun sosmed: {formatNumber(stats?.account_count ?? 0)}</p>
            <p className="text-muted-foreground">PIC aktif: {formatNumber(stats?.pic_count ?? 0)}</p>
            <p className="text-muted-foreground">Posting valid: {formatNumber(stats?.valid_post_count ?? 0)}</p>
            <p className="text-muted-foreground">Tayangan: {formatCompact(stats?.total_views ?? 0)}</p>
          </div>
        ),
      };
    });
  }, [data]);

  const areaChartConfig = {
    total_views: { label: "Tayangan", color: "#0f766e" },
    engagement_rate: { label: "Engagement", color: "#f59e0b" },
    valid_post_count: { label: "Posting Valid", color: "#2563eb" },
  } as const;

  const pieChartConfig = {
    instagram: { label: "Instagram", color: platformColors.instagram },
    tiktok: { label: "TikTok", color: platformColors.tiktok },
    youtube: { label: "YouTube", color: platformColors.youtube },
    facebook: { label: "Facebook", color: platformColors.facebook },
    x: { label: "X", color: platformColors.x },
  } as const;

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
      <Dialog
        open={Boolean(selectedRegionId)}
        onOpenChange={(open) => setSelectedRegionId(open ? selectedRegionId : null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedRegion?.wilayah_nama ?? "Detail Wilayah"}</DialogTitle>
            <DialogDescription>
              Ringkasan operasional wilayah berdasarkan akun sosmed dan posting valid.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 rounded-2xl border border-foreground/10 bg-muted/20 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Akun sosmed</span>
              <span className="font-medium">{formatNumber(selectedRegion?.account_count ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">PIC aktif</span>
              <span className="font-medium">{formatNumber(selectedRegion?.pic_count ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Posting valid</span>
              <span className="font-medium">{formatNumber(selectedRegion?.valid_post_count ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total tayangan</span>
              <span className="font-medium">{formatNumber(selectedRegion?.total_views ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Kode wilayah</span>
              <span className="font-medium">{selectedRegion?.wilayah_kode ?? "-"}</span>
            </div>
          </div>
          <div className="flex justify-end">
            <Button asChild>
              <Link href="/analitik/monitoring-sosmed">Buka Monitoring Sosmed</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="app-bg-hero app-border-soft overflow-hidden">
        <CardContent className="space-y-6 px-6 py-8 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="rounded-full border-emerald-200 bg-background/75 px-3 py-1 text-emerald-700 dark:bg-card/75"
              >
                Dashboard / Nasional
              </Badge>
              <div className="space-y-2">
                <h1 className="font-semibold text-3xl tracking-tight">Dashboard Nasional</h1>
                <p className="max-w-3xl text-muted-foreground text-sm leading-6">
                  Ringkasan operasional dan performa nasional: peta sebaran akun, tren posting valid dengan tayangan
                  hasil scraping, distribusi platform, dan wilayah dengan tayangan tertinggi.
                </p>
              </div>
            </div>
            <div className="app-panel-glass grid gap-2 rounded-2xl border p-4 shadow-sm backdrop-blur">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">Periode</p>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="app-control-surface min-w-52">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="app-control-surface min-w-52">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Spinner />
            <span>Memuat data dashboard nasional...</span>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-rose-600 text-sm">{error}</CardContent>
        </Card>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {statCards.map((item) => (
              <Card key={item.label} className="border-foreground/10">
                <CardContent className="space-y-4 py-6">
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

          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
            <Card className="border-foreground/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MapPinned className="size-5 text-emerald-600" />
                  Peta Sebaran Akun Sosmed
                </CardTitle>
                <CardDescription>
                  Klik provinsi untuk detail wilayah. Klik area kosong peta untuk melihat ringkasan Indonesia.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                  <button
                    type="button"
                    className="rounded-3xl border border-transparent"
                    onClick={handleMapContainerClick}
                    aria-label="Lihat ringkasan wilayah pada peta Indonesia"
                  >
                    <IndonesiaMap
                      regions={mapOverrides}
                      onRegionClick={({ region }) =>
                        setSelectedRegionId((current) => (current === region.id ? null : region.id))
                      }
                    />
                  </button>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="font-medium">Kepadatan Akun</p>
                      <div className="space-y-1.5 text-sm">
                        {INDONESIA_CHOROPLETH_BUCKETS.map((bucket) => (
                          <div key={bucket.label} className="flex items-center gap-2">
                            <span className={`inline-flex h-3 w-3 rounded-sm ${bucket.swatchClassName}`} />
                            <span className="text-muted-foreground">{bucket.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="max-w-48 text-muted-foreground text-sm leading-6">
                      Warna provinsi menunjukkan kepadatan akun sosmed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="pt-0">
              <CardHeader className="border-b py-5">
                <div className="grid gap-1">
                  <CardTitle>Tren Nasional</CardTitle>
                  <CardDescription>{trendDescription}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer config={areaChartConfig} className="aspect-auto h-[340px] w-full">
                  <AreaChart data={trendChartData}>
                    <defs>
                      <linearGradient id="fillNationalViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-total_views)" stopOpacity={0.75} />
                        <stop offset="95%" stopColor="var(--color-total_views)" stopOpacity={0.08} />
                      </linearGradient>
                      <linearGradient id="fillNationalEngagement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-engagement_rate)" stopOpacity={0.65} />
                        <stop offset="95%" stopColor="var(--color-engagement_rate)" stopOpacity={0.08} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="period_label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={18} />
                    <YAxis
                      yAxisId="views"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => compactFormatter.format(Number(value))}
                      width={52}
                    />
                    <YAxis
                      yAxisId="engagement"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
                      domain={[0, (dataMax: number) => Math.max(5, Math.ceil(dataMax + 1))]}
                      width={48}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          indicator="dot"
                          formatter={(value, name) => {
                            const label =
                              name === "engagement_rate"
                                ? "Engagement"
                                : name === "valid_post_count"
                                  ? "Posting Valid"
                                  : "Tayangan";
                            const formattedValue =
                              name === "engagement_rate"
                                ? `${Number(value).toFixed(1)}%`
                                : Number(value).toLocaleString("id-ID");

                            return (
                              <div className="flex w-full items-center justify-between gap-3">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-medium font-mono text-foreground tabular-nums">
                                  {formattedValue}
                                </span>
                              </div>
                            );
                          }}
                        />
                      }
                    />
                    <Area
                      dataKey="total_views"
                      yAxisId="views"
                      type="natural"
                      fill="url(#fillNationalViews)"
                      stroke="var(--color-total_views)"
                      strokeWidth={2}
                    />
                    <Area
                      dataKey="engagement_rate"
                      yAxisId="engagement"
                      type="natural"
                      fill="url(#fillNationalEngagement)"
                      stroke="var(--color-engagement_rate)"
                      strokeWidth={2}
                    />
                    <Area
                      dataKey="valid_post_count"
                      yAxisId="views"
                      type="natural"
                      stroke="var(--color-valid_post_count)"
                      strokeWidth={2}
                      fillOpacity={0}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-foreground/10">
              <CardHeader>
                <CardTitle>Distribusi Per Platform</CardTitle>
                <CardDescription>{platformDescription}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <ChartContainer config={pieChartConfig} className="mx-auto h-[280px] w-full max-w-[360px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="platform" hideLabel />} />
                    <Pie
                      data={platformDistributionItems}
                      dataKey="share_value"
                      nameKey="platform"
                      innerRadius={72}
                      outerRadius={110}
                      strokeWidth={4}
                    >
                      {platformDistributionItems.map((item) => (
                        <Cell key={item.platform} fill={platformColors[item.platform]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="space-y-3">
                  {platformDistributionItems.map((item) => (
                    <div
                      key={item.platform}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-foreground/10 bg-muted/20 px-4 py-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex h-3 w-3 rounded-full"
                          style={{ backgroundColor: platformColors[item.platform] }}
                        />
                        <div>
                          <p className="font-medium">{formatPlatformLabel(item.platform)}</p>
                          <p className="text-muted-foreground">{formatNumber(item.account_count)} akun</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {item.total_views > 0 ? formatCompact(item.total_views) : formatNumber(item.post_count)}
                        </p>
                        <p className="text-muted-foreground">{item.total_views > 0 ? "tayangan" : "posting"}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatNumber(item.post_count)} posting • {formatCompact(item.total_interactions)} interaksi
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-foreground/10">
              <CardHeader>
                <CardTitle>Wilayah Teratas Berdasarkan Tayangan</CardTitle>
                <CardDescription>
                  Wilayah dengan performa tayangan tertinggi pada bulan yang dipilih, termasuk agregasi Indonesia.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topRegionsWithIndonesia.map((region, index) => (
                  <div
                    key={region.region_id}
                    className="grid gap-3 rounded-2xl border border-foreground/10 bg-muted/20 p-4 md:grid-cols-[auto_1fr_auto_auto] md:items-center"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 font-semibold text-emerald-700">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{region.wilayah_nama}</p>
                        {region.region_id === "ID" ? (
                          <Badge variant="secondary" className="rounded-full">
                            Nasional
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {formatNumber(region.account_count)} akun • {formatNumber(region.pic_count)} PIC
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCompact(region.total_views)}</p>
                      <p className="text-muted-foreground text-sm">tayangan</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatNumber(region.valid_post_count)}</p>
                      <p className="text-muted-foreground text-sm">posting valid</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-foreground/10">
            <CardHeader>
              <CardTitle>Akun Sosmed Nasional Teratas</CardTitle>
              <CardDescription>{topAccountsDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {topNationalAccounts.map((account) => (
                <div key={account.id} className="rounded-3xl border border-foreground/10 app-bg-surface p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <Badge variant="outline" className="border-foreground/10">
                      {formatPlatformLabel(account.platform)}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {account.highlight_label ? (
                        <Badge variant="secondary" className="rounded-full">
                          {account.highlight_label}
                        </Badge>
                      ) : null}
                      <span className="font-medium text-muted-foreground text-xs">#{account.rank}</span>
                    </div>
                  </div>
                  <h3 className="mt-3 font-semibold text-lg leading-tight">{account.profile_name}</h3>
                  <p className="text-muted-foreground text-sm">{account.username}</p>
                  <div className="mt-5 grid gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tayangan</span>
                      <span className="font-medium">{formatNumber(account.total_views)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{account.metric_label}</span>
                      <span className="font-medium">{account.metric_value}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{account.posting_label}</span>
                      <span className="font-medium">{account.posting_value}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Wilayah</span>
                      <span className="font-medium">{account.wilayah_label}</span>
                    </div>
                  </div>
                  <Button asChild className="mt-5 w-full" variant="outline">
                    <Link href="/analitik/monitoring-sosmed">Buka Monitoring</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
