"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from "recharts";
import { Activity, BellRing, Eye, Globe2, MapPinned, MessageCircleHeart, UsersRound } from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getNationalDashboard } from "@/features/dashboard/api/dashboard-api";
import {
  INDONESIA_CHOROPLETH_BUCKETS,
  INDONESIA_REGION_MAP,
} from "@/features/dashboard/constants/indonesia-region-map";
import type { NationalDashboardData } from "@/features/dashboard/types/dashboard.type";
import { formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

const numberFormatter = new Intl.NumberFormat("id-ID");
const compactFormatter = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });
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

    void getNationalDashboard({
      month: Number(selectedMonth),
      year: Number(selectedYear),
    })
      .then((response) => setData(response.data))
      .catch((caught) => {
        const message = caught instanceof Error ? caught.message : "Gagal memuat dashboard nasional.";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [isAuthorized, isPending, selectedMonth, selectedYear]);

  const selectedRegion = useMemo(
    () => findSelectedRegion(data, selectedRegionId),
    [data, selectedRegionId],
  );

  function handleMapContainerClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as Element;

    if (target.closest("[data-slot='map-region']")) {
      return;
    }

    if (
      target.closest("[data-slot='map']") ||
      target.closest("[data-slot='map-zoom-layer']")
    ) {
      setSelectedRegionId((current) => (current === "ID" ? null : "ID"));
    }
  }

  const statCards = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      { label: "User Aktif", value: formatNumber(data.stats.total_user_aktif), helper: "Seluruh role aktif", icon: UsersRound },
      { label: "Akun Sosmed", value: formatNumber(data.stats.total_akun_sosmed), helper: "Semua akun terdaftar", icon: Globe2 },
      { label: "Posting Valid", value: formatNumber(data.stats.total_posting_valid), helper: data.selected_period.label, icon: Activity },
      { label: "Menunggu Validasi", value: formatNumber(data.stats.bukti_menunggu_validasi), helper: "Queue validasi berjalan", icon: BellRing },
      { label: "Tayangan", value: formatCompact(data.stats.total_tayangan), helper: "Akumulasi bulan terpilih", icon: Eye },
      { label: "Interaksi", value: formatCompact(data.stats.total_interaksi), helper: "Like + komentar + repost + bagikan", icon: MessageCircleHeart },
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
    total_interactions: { label: "Interaksi", color: "#f59e0b" },
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
      <Dialog open={Boolean(selectedRegionId)} onOpenChange={(open) => setSelectedRegionId(open ? selectedRegionId : null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedRegion?.wilayah_nama ?? "Detail Wilayah"}</DialogTitle>
            <DialogDescription>Ringkasan operasional wilayah berdasarkan akun sosmed dan posting valid.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 rounded-2xl border border-foreground/10 bg-muted/20 p-4 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Akun sosmed</span><span className="font-medium">{formatNumber(selectedRegion?.account_count ?? 0)}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">PIC aktif</span><span className="font-medium">{formatNumber(selectedRegion?.pic_count ?? 0)}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Posting valid</span><span className="font-medium">{formatNumber(selectedRegion?.valid_post_count ?? 0)}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Total tayangan</span><span className="font-medium">{formatNumber(selectedRegion?.total_views ?? 0)}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Kode wilayah</span><span className="font-medium">{selectedRegion?.wilayah_kode ?? "-"}</span></div>
          </div>
          <div className="flex justify-end">
            <Button asChild>
              <Link href="/analitik/monitoring-sosmed">Buka Monitoring Sosmed</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))]">
        <CardContent className="space-y-6 px-6 py-8 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge variant="outline" className="rounded-full border-emerald-200 bg-white/80 px-3 py-1 text-emerald-700">
                Dashboard / Nasional
              </Badge>
              <div className="space-y-2">
                <h1 className="font-semibold text-3xl tracking-tight">Dashboard Nasional</h1>
                <p className="max-w-3xl text-muted-foreground text-sm leading-6">
                  Ringkasan operasional dan performa nasional: peta sebaran akun, tren posting valid, distribusi platform,
                  dan wilayah dengan tayangan tertinggi.
                </p>
              </div>
            </div>
            <div className="grid gap-2 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">Periode</p>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="min-w-52 bg-white">
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
                <SelectTrigger className="min-w-52 bg-white">
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
          <CardContent className="py-10 text-sm text-rose-600">{error}</CardContent>
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
                  <div
                    className="rounded-3xl border border-transparent"
                    onClick={handleMapContainerClick}
                    role="presentation"
                  >
                    <IndonesiaMap
                      regions={mapOverrides}
                      onRegionClick={({ region }) => setSelectedRegionId((current) => (current === region.id ? null : region.id))}
                    />
                  </div>
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
                  <CardDescription>Pergerakan posting valid, tayangan, dan interaksi harian.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer config={areaChartConfig} className="aspect-auto h-[340px] w-full">
                  <AreaChart data={data.trend}>
                    <defs>
                      <linearGradient id="fillNationalViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-total_views)" stopOpacity={0.75} />
                        <stop offset="95%" stopColor="var(--color-total_views)" stopOpacity={0.08} />
                      </linearGradient>
                      <linearGradient id="fillNationalInteractions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-total_interactions)" stopOpacity={0.65} />
                        <stop offset="95%" stopColor="var(--color-total_interactions)" stopOpacity={0.08} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="period_label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={18} />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Area dataKey="total_views" type="natural" fill="url(#fillNationalViews)" stroke="var(--color-total_views)" strokeWidth={2} />
                    <Area dataKey="total_interactions" type="natural" fill="url(#fillNationalInteractions)" stroke="var(--color-total_interactions)" strokeWidth={2} />
                    <Area dataKey="valid_post_count" type="natural" stroke="var(--color-valid_post_count)" strokeWidth={2} fillOpacity={0} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-foreground/10">
              <CardHeader>
                <CardTitle>Distribusi Posting Per Platform</CardTitle>
                <CardDescription>Porsi posting valid berdasarkan platform pada periode terpilih.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <ChartContainer config={pieChartConfig} className="mx-auto h-[280px] w-full max-w-[360px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="platform" hideLabel />} />
                    <Pie data={data.platform_distribution} dataKey="post_count" nameKey="platform" innerRadius={72} outerRadius={110} strokeWidth={4}>
                      {data.platform_distribution.map((item) => (
                        <Cell key={item.platform} fill={platformColors[item.platform]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="space-y-3">
                  {data.platform_distribution.map((item) => (
                    <div key={item.platform} className="flex items-center justify-between gap-4 rounded-2xl border border-foreground/10 bg-muted/20 px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: platformColors[item.platform] }} />
                        <div>
                          <p className="font-medium">{formatPlatformLabel(item.platform)}</p>
                          <p className="text-muted-foreground">{formatNumber(item.account_count)} akun</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatNumber(item.post_count)}</p>
                        <p className="text-muted-foreground">posting</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-foreground/10">
              <CardHeader>
                <CardTitle>Provinsi Teratas Berdasarkan Tayangan</CardTitle>
                <CardDescription>Wilayah dengan performa tayangan tertinggi pada bulan yang dipilih.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.top_regions.map((region, index) => (
                  <div key={region.region_id} className="grid gap-3 rounded-2xl border border-foreground/10 bg-muted/20 p-4 md:grid-cols-[auto_1fr_auto_auto] md:items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 font-semibold text-emerald-700">{index + 1}</div>
                    <div>
                      <p className="font-medium">{region.wilayah_nama}</p>
                      <p className="text-muted-foreground text-sm">{formatNumber(region.account_count)} akun • {formatNumber(region.pic_count)} PIC</p>
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
              <CardDescription>Peringkat akun berdasarkan tayangan pada periode yang dipilih.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {data.top_accounts.map((account) => (
                <div key={account.id} className="rounded-3xl border border-foreground/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))] p-5 shadow-sm">
                  <Badge variant="outline" className="border-foreground/10">
                    {formatPlatformLabel(account.platform)}
                  </Badge>
                  <h3 className="mt-3 font-semibold text-lg leading-tight">{account.profile_name}</h3>
                  <p className="text-muted-foreground text-sm">{account.username}</p>
                  <div className="mt-5 grid gap-3 text-sm">
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Tayangan</span><span className="font-medium">{formatNumber(account.total_views)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Interaksi</span><span className="font-medium">{formatNumber(account.total_interactions)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Posting valid</span><span className="font-medium">{formatNumber(account.valid_post_count)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Wilayah</span><span className="font-medium">{account.wilayah?.nama ?? "-"}</span></div>
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
