"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { BarChart3, CheckCircle2, RadioTower, ThumbsUp, TrendingUp, Users2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getMonitoringSosmedData } from "@/features/monitoring-sosmed/api/monitoring-sosmed-api";
import type { MonitoringSosmedData } from "@/features/monitoring-sosmed/types/monitoring-sosmed.type";
import { listWilayahOptions, type WilayahOption } from "@/shared/api/wilayah";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

const numberFormatter = new Intl.NumberFormat("id-ID");
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
];

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatPercent(value: number) {
  return `${value}%`;
}

function getPlatformTone(platform: string) {
  switch (platform) {
    case "instagram":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "tiktok":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "youtube":
      return "bg-red-50 text-red-700 border-red-200";
    case "facebook":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "x":
      return "bg-slate-100 text-slate-700 border-slate-300";
    default:
      return "bg-muted text-foreground border-border";
  }
}

export function MonitoringSosmedDashboard() {
  const { role, isAuthorized, isPending } = useRoleGuard(["superadmin", "qcc_wcc"]);
  const now = new Date();
  const [data, setData] = useState<MonitoringSosmedData | null>(null);
  const [wilayahOptions, setWilayahOptions] = useState<WilayahOption[]>([]);
  const [selectedWilayahId, setSelectedWilayahId] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(now.getFullYear()));
  const [loading, setLoading] = useState(true);

  const yearOptions = Array.from({ length: 5 }, (_, index) => String(now.getFullYear() - index));

  useEffect(() => {
    if (!isAuthorized || isPending || role !== "superadmin") {
      return;
    }

    void listWilayahOptions().then(setWilayahOptions);
  }, [isAuthorized, isPending, role]);

  useEffect(() => {
    if (!isAuthorized || isPending) {
      return;
    }

    setLoading(true);
    void getMonitoringSosmedData({
      wilayahId: role === "superadmin" && selectedWilayahId !== "all" ? selectedWilayahId : undefined,
      month: Number(selectedMonth),
      year: Number(selectedYear),
    })
      .then((response) => setData(response.data))
      .finally(() => setLoading(false));
  }, [isAuthorized, isPending, role, selectedMonth, selectedWilayahId, selectedYear]);

  const chartConfig = {
    views: { label: "Tayangan", color: "#0f766e" },
    post_count: { label: "Posting", color: "#2563eb" },
    followers: { label: "Pengikut", color: "#2563eb" },
    engagement: { label: "Interaksi", color: "#f59e0b" },
    posting: { label: "Posting", color: "#0f766e" },
  } as const;

  const statCards = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        label: "Total Akun",
        value: formatNumber(data.stats.total_akun_terdaftar),
        icon: Users2,
        helper: `${formatNumber(data.stats.delegated_active)} akun punya aktivitas posting`,
      },
      {
        label: "Total Postingan",
        value: formatNumber(data.stats.total_postingan),
        icon: BarChart3,
        helper: data.selected_period.label,
      },
      {
        label: "Total Tayangan",
        value: formatNumber(data.stats.total_views),
        icon: RadioTower,
        helper: `Scope ${data.scope.wilayah_nama}`,
      },
      {
        label: "Total Suka",
        value: formatNumber(data.stats.total_likes),
        icon: ThumbsUp,
        helper: `${formatNumber(data.stats.total_comments)} komentar`,
      },
      {
        label: "Akun Verified",
        value: formatNumber(data.stats.terverifikasi),
        icon: CheckCircle2,
        helper: `${formatNumber(data.stats.total_reposts)} repost • ${formatNumber(data.stats.total_share_posts)} bagikan`,
      },
    ];
  }, [data]);

  const accountAreaData = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.top_accounts.slice(0, 8).map((account) => ({
      account: account.profile_name.split(" ").slice(0, 2).join(" "),
      followers: account.followers,
      engagement: account.total_views,
    }));
  }, [data]);

  const platformPostingData = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.distribusi_platform.map((item) => ({
      platform: formatPlatformLabel(item.platform),
      posting: item.total_posting,
    }));
  }, [data]);

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
      <Card className="overflow-hidden border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.12),_transparent_40%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))]">
        <CardContent className="space-y-6 px-6 py-8 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge variant="outline" className="rounded-full border-emerald-200 bg-white/80 px-3 py-1 text-emerald-700">
                Analitik / Monitoring Sosmed
              </Badge>
              <div className="space-y-2">
                <h1 className="font-semibold text-3xl tracking-tight">Monitoring Sosmed</h1>
                <p className="max-w-3xl text-muted-foreground text-sm leading-6">
                  Dashboard performa posting dari akun sosmed yang dikelola PIC Sosmed, dengan ringkasan tayangan,
                  suka, komentar, repost, dan bagikan per wilayah serta per platform.
                </p>
              </div>
            </div>

            <div className="grid gap-2 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">Scope Dashboard</p>
              <p className="font-semibold text-lg">{data?.scope.wilayah_nama ?? "Memuat..."}</p>
              {role === "superadmin" ? (
                <Select value={selectedWilayahId} onValueChange={setSelectedWilayahId}>
                  <SelectTrigger className="min-w-56 bg-white">
                    <SelectValue placeholder="Pilih wilayah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Nasional / Semua Wilayah</SelectItem>
                    {wilayahOptions.map((wilayah) => (
                      <SelectItem key={wilayah.id} value={wilayah.id}>
                        {wilayah.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-muted-foreground text-sm">Akses regional otomatis sesuai wilayah user.</p>
              )}
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="min-w-56 bg-white">
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
                <SelectTrigger className="min-w-56 bg-white">
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

      {loading || !data ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Spinner />
            <span>Memuat data monitoring sosial media...</span>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
                  <BarChart3 className="size-5 text-emerald-600" />
                  Tren Harian Postingan dan Tayangan
                </CardTitle>
                <CardDescription>Aktivitas posting PIC di periode terpilih.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ChartContainer className="h-[340px] w-full" config={chartConfig}>
                  <BarChart data={data.tren_performa}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="period_label" tickLine={false} axisLine={false} tickMargin={10} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="views" fill="var(--color-views)" radius={6} />
                    <Bar dataKey="post_count" fill="var(--color-post_count)" radius={6} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="pt-0">
              <CardHeader className="border-b py-5">
                <div className="grid gap-1">
                  <CardTitle>Perkembangan Akun Teratas</CardTitle>
                  <CardDescription>Perbandingan pengikut dan tayangan akun teratas pada scope ini.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full">
                  <AreaChart data={accountAreaData}>
                    <defs>
                      <linearGradient id="fillFollowers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-followers)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-followers)" stopOpacity={0.12} />
                      </linearGradient>
                      <linearGradient id="fillEngagement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-engagement)" stopOpacity={0.75} />
                        <stop offset="95%" stopColor="var(--color-engagement)" stopOpacity={0.08} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="account" tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Area dataKey="followers" type="natural" fill="url(#fillFollowers)" stroke="var(--color-followers)" strokeWidth={2} />
                    <Area dataKey="engagement" type="natural" fill="url(#fillEngagement)" stroke="var(--color-engagement)" strokeWidth={2} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                  Scope {data.scope.wilayah_nama} <TrendingUp className="h-4 w-4" />
                </div>
                <div className="leading-none text-muted-foreground">
                  Nilai interaksi pada grafik ini menggunakan total tayangan akun.
                </div>
              </CardFooter>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_1.25fr]">
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Konten Per Platform</CardTitle>
                <CardDescription>Jumlah postingan yang dipublikasikan pada tiap platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[360px] w-full">
                  <BarChart accessibilityLayer data={platformPostingData} layout="vertical" margin={{ left: -12 }}>
                    <XAxis type="number" dataKey="posting" hide />
                    <YAxis
                      dataKey="platform"
                      type="category"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      width={90}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="posting" fill="var(--color-posting)" radius={6} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                  Distribusi posting aktif per platform <TrendingUp className="h-4 w-4" />
                </div>
                <div className="leading-none text-muted-foreground">
                  Berdasarkan posting yang dibuat PIC pada bulan dan tahun terpilih.
                </div>
              </CardFooter>
            </Card>

            <Card className="border-foreground/10">
              <CardHeader>
                <CardTitle className="text-xl">Distribusi Platform</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.distribusi_platform.map((item) => (
                  <div key={item.platform} className="grid gap-3 rounded-2xl border border-foreground/10 bg-muted/20 p-4 md:grid-cols-5">
                    <div className="space-y-2">
                      <Badge variant="outline" className={getPlatformTone(item.platform)}>
                        {formatPlatformLabel(item.platform)}
                      </Badge>
                      <p className="text-muted-foreground text-sm">{item.akun_count} akun</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Tayangan / Suka</p>
                      <p className="mt-2 font-semibold text-lg">{formatNumber(item.total_views)} / {formatNumber(item.total_likes)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Komentar / Posting</p>
                      <p className="mt-2 font-semibold text-lg">{formatNumber(item.total_comments)} / {formatNumber(item.total_posting)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Repost / Bagikan</p>
                      <p className="mt-2 font-semibold text-lg">{formatNumber(item.total_reposts)} / {formatNumber(item.total_share_posts)}</p>
                      <p className="text-muted-foreground text-sm">{formatPercent(item.growth_percent)} interaksi</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Coverage</p>
                      <p className="font-semibold text-lg">{formatPercent(item.kapasitas_terisi_percent)}</p>
                      <p className={`text-sm ${item.trend === "up" ? "text-emerald-600" : "text-rose-600"}`}>
                        {item.trend === "up" ? "aktif" : "rendah"}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-foreground/10">
            <CardHeader>
              <CardTitle className="text-xl">Akun Sosmed Teratas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {data.top_accounts.map((account) => (
                <div key={account.id} className="rounded-3xl border border-foreground/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))] p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="outline" className={getPlatformTone(account.platform)}>
                        {formatPlatformLabel(account.platform)}
                      </Badge>
                      <h3 className="mt-3 font-semibold text-lg leading-tight">{account.profile_name}</h3>
                      <p className="text-muted-foreground text-sm">{account.username}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium text-sm ${account.growth_percent >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {account.growth_percent >= 0 ? "+" : ""}
                        {account.growth_percent}%
                      </p>
                      <p className="text-muted-foreground text-xs">interaksi</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm">
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Tayangan</span><span className="font-medium">{formatNumber(account.total_views)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Posting</span><span className="font-medium">{formatNumber(account.posting_count)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Suka / Komentar</span><span className="font-medium">{formatNumber(account.total_likes)} / {formatNumber(account.total_comments)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Wilayah</span><span className="font-medium">{account.wilayah?.nama ?? "-"}</span></div>
                  </div>

                  <Button asChild className="mt-5 w-full" variant="outline">
                    <Link href={`/analitik/monitoring-sosmed/${account.id}`}>Lihat Detail Akun</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
