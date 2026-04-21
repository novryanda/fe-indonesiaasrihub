"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { BriefcaseBusiness, Eye, FileText, MessageCircleHeart, MonitorPlay, UsersRound } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from "recharts";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { getRegionalDashboard } from "@/features/dashboard/api/dashboard-api";
import type { RegionalDashboardData } from "@/features/dashboard/types/dashboard.type";
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

export function RegionalDashboardView() {
  const { isAuthorized, isPending } = useRoleGuard(["qcc_wcc"]);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [data, setData] = useState<RegionalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const yearOptions = Array.from({ length: 5 }, (_, index) => String(now.getFullYear() - index));

  useEffect(() => {
    if (!isAuthorized || isPending) {
      return;
    }

    setLoading(true);
    setError(null);

    void getRegionalDashboard({
      month: Number(selectedMonth),
      year: Number(selectedYear),
    })
      .then((response) => setData(response.data))
      .catch((caught) => {
        const message = caught instanceof Error ? caught.message : "Gagal memuat dashboard regional.";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [isAuthorized, isPending, selectedMonth, selectedYear]);

  const statCards = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        label: "WCC Wilayah",
        value: formatNumber(data.stats.total_wcc_wilayah),
        helper: "Tim pembuat konten aktif",
        icon: UsersRound,
      },
      {
        label: "PIC Wilayah",
        value: formatNumber(data.stats.total_pic_wilayah),
        helper: "PIC yang dipantau QCC",
        icon: BriefcaseBusiness,
      },
      {
        label: "Jumlah Akun Sosmed Terdaftar",
        value: formatNumber(data.stats.total_akun_sosmed),
        helper: "Akun sosmed regional terdaftar",
        icon: MonitorPlay,
      },
      {
        label: "Total Posting Bulan Ini",
        value: formatNumber(data.stats.total_posting_valid),
        helper: data.selected_period.label,
        icon: Eye,
      },
      {
        label: "Jumlah Bank Konten Bulan Ini",
        value: formatNumber(data.stats.total_bank_konten_bulan_ini),
        helper: data.selected_period.label,
        icon: FileText,
      },
      {
        label: "Overdue PIC",
        value: formatNumber(data.alerts.overdue_pic_count),
        helper: `${formatNumber(data.stats.overdue_bank_content_pic)} target bank konten`,
        icon: MessageCircleHeart,
      },
    ];
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
      <Card className="app-bg-hero app-border-soft overflow-hidden">
        <CardContent className="space-y-6 px-6 py-8 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="rounded-full border-sky-200 bg-background/75 px-3 py-1 text-sky-700 dark:bg-card/75"
              >
                Dashboard / Regional
              </Badge>
              <div className="space-y-2">
                <h1 className="font-semibold text-3xl tracking-tight">Dashboard Regional</h1>
                <p className="max-w-3xl text-muted-foreground text-sm leading-6">
                  Ringkasan performa wilayah {data?.scope.wilayah_nama ?? "-"}: aktivitas posting valid, distribusi
                  platform, PIC teratas, akun regional terkuat, serta alert operasional yang perlu ditindaklanjuti.
                </p>
              </div>
            </div>
            <div className="app-panel-glass grid gap-2 rounded-2xl border p-4 shadow-sm backdrop-blur">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">Periode</p>
              <p className="font-semibold text-lg">{data?.scope.wilayah_nama ?? "Wilayah Regional"}</p>
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
            <span>Memuat data dashboard regional...</span>
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
                    <item.icon className="size-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-3xl tracking-tight">{item.value}</p>
                    <p className="mt-1 text-muted-foreground text-sm">{item.helper}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
            <Card className="pt-0">
              <CardHeader className="border-b py-5">
                <div className="grid gap-1">
                  <CardTitle>Tren Performa Wilayah</CardTitle>
                  <CardDescription>Tayangan, interaksi, dan posting valid harian dalam wilayah ini.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer config={areaChartConfig} className="aspect-auto h-[340px] w-full">
                  <AreaChart data={data.trend}>
                    <defs>
                      <linearGradient id="fillRegionalViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-total_views)" stopOpacity={0.75} />
                        <stop offset="95%" stopColor="var(--color-total_views)" stopOpacity={0.08} />
                      </linearGradient>
                      <linearGradient id="fillRegionalInteractions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-total_interactions)" stopOpacity={0.65} />
                        <stop offset="95%" stopColor="var(--color-total_interactions)" stopOpacity={0.08} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="period_label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={18} />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Area
                      dataKey="total_views"
                      type="natural"
                      fill="url(#fillRegionalViews)"
                      stroke="var(--color-total_views)"
                      strokeWidth={2}
                    />
                    <Area
                      dataKey="total_interactions"
                      type="natural"
                      fill="url(#fillRegionalInteractions)"
                      stroke="var(--color-total_interactions)"
                      strokeWidth={2}
                    />
                    <Area
                      dataKey="valid_post_count"
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

            <Card className="border-foreground/10">
              <CardHeader>
                <CardTitle>Distribusi Posting Platform</CardTitle>
                <CardDescription>Porsi posting valid akun regional per platform.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <ChartContainer config={pieChartConfig} className="mx-auto h-[280px] w-full max-w-[360px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="platform" hideLabel />} />
                    <Pie
                      data={data.platform_distribution}
                      dataKey="post_count"
                      nameKey="platform"
                      innerRadius={72}
                      outerRadius={110}
                      strokeWidth={4}
                    >
                      {data.platform_distribution.map((item) => (
                        <Cell key={item.platform} fill={platformColors[item.platform]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="space-y-3">
                  {data.platform_distribution.map((item) => (
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
                        <p className="font-semibold">{formatNumber(item.post_count)}</p>
                        <p className="text-muted-foreground">posting</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="border-foreground/10">
              <CardHeader>
                <CardTitle>Alert Operasional Regional</CardTitle>
                <CardDescription>Prioritas tindak lanjut QCC untuk wilayah ini.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">PIC Overdue</p>
                  <p className="mt-2 font-semibold text-3xl text-amber-700">
                    {formatNumber(data.alerts.overdue_pic_count)}
                  </p>
                  <p className="mt-1 text-sm text-amber-700/90">
                    {formatNumber(data.stats.overdue_bank_content_pic)} target bank konten belum dikerjakan
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                    Bukti Posting Menunggu Validasi
                  </p>
                  <p className="mt-2 font-semibold text-3xl text-sky-700">
                    {formatNumber(data.alerts.bukti_menunggu_validasi)}
                  </p>
                  <p className="mt-1 text-sm text-sky-700/90">
                    Bank konten dengan bukti posting menunggu pengecekan QCC
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Reminder Bulan Ini</p>
                  <p className="mt-2 font-semibold text-3xl text-emerald-700">
                    {formatNumber(data.alerts.reminder_sent_bulan_ini)}
                  </p>
                  <p className="mt-1 text-sm text-emerald-700/90">Jumlah pengingat yang sudah dikirim ke PIC</p>
                </div>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/tim/pic-sosmed">Buka Monitor PIC Sosmed</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-foreground/10">
              <CardHeader>
                <CardTitle>PIC Sosmed Teratas</CardTitle>
                <CardDescription>PIC dengan kontribusi posting valid tertinggi pada wilayah ini.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.top_pics.map((pic, index) => (
                  <div
                    key={pic.id}
                    className="grid gap-3 rounded-2xl border border-foreground/10 bg-muted/20 p-4 md:grid-cols-[auto_1fr_auto_auto] md:items-center"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 font-semibold text-sky-700">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{pic.name}</p>
                      <p className="text-muted-foreground text-sm">{pic.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatNumber(pic.valid_post_count)}</p>
                      <p className="text-muted-foreground text-sm">posting valid</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCompact(pic.total_views)}</p>
                      <p className="text-muted-foreground text-sm">tayangan</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-foreground/10">
            <CardHeader>
              <CardTitle>Akun Sosmed Regional Teratas</CardTitle>
              <CardDescription>Akun dengan tayangan tertinggi di wilayah {data.scope.wilayah_nama}.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {data.top_accounts.map((account) => (
                <div key={account.id} className="rounded-3xl border border-foreground/10 app-bg-surface p-5 shadow-sm">
                  <Badge variant="outline" className="border-foreground/10">
                    {formatPlatformLabel(account.platform)}
                  </Badge>
                  <h3 className="mt-3 font-semibold text-lg leading-tight">{account.profile_name}</h3>
                  <p className="text-muted-foreground text-sm">{account.username}</p>
                  <div className="mt-5 grid gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tayangan</span>
                      <span className="font-medium">{formatNumber(account.total_views)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Interaksi</span>
                      <span className="font-medium">{formatNumber(account.total_interactions)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Posting valid</span>
                      <span className="font-medium">{formatNumber(account.valid_post_count)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Update terakhir</span>
                      <span className="font-medium">{formatDateTime(account.last_stat_update)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
