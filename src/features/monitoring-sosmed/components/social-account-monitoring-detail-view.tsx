"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Area, AreaChart, CartesianGrid, PolarAngleAxis, PolarGrid, Radar, RadarChart, XAxis } from "recharts";
import { ArrowLeft, ExternalLink, RadioTower, Share2, ThumbsUp, TrendingUp, Users2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { getSocialAccountDetail } from "@/features/social-accounts/api/social-accounts-api";
import type { SocialAccountDetail } from "@/features/social-accounts/types/social-account.type";
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
  return `${value >= 0 ? "+" : ""}${value}%`;
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

export function SocialAccountMonitoringDetailView({ id }: { id: string }) {
  const { isAuthorized, isPending } = useRoleGuard(["superadmin", "qcc_wcc"]);
  const now = new Date();
  const [data, setData] = useState<SocialAccountDetail | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(now.getFullYear()));
  const [loading, setLoading] = useState(true);

  const yearOptions = Array.from({ length: 5 }, (_, index) => String(now.getFullYear() - index));

  useEffect(() => {
    if (!isAuthorized || isPending) {
      return;
    }

    setLoading(true);
    void getSocialAccountDetail(id, {
      month: Number(selectedMonth),
      year: Number(selectedYear),
    })
      .then((response) => setData(response.data))
      .catch((errorValue) => {
        toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat detail akun sosmed");
      })
      .finally(() => setLoading(false));
  }, [id, isAuthorized, isPending, selectedMonth, selectedYear]);

  const chartConfig = {
    views: { label: "Tayangan", color: "#2563eb" },
    likes: { label: "Suka", color: "#0f766e" },
    comments: { label: "Komentar", color: "#f59e0b" },
    reposts: { label: "Repost", color: "#f97316" },
    share_posts: { label: "Bagikan", color: "#7c3aed" },
    metric: { label: "Metrik", color: "#2563eb" },
  } as const;

  const areaData = useMemo(() => {
    if (!data) {
      return [];
    }

    return [...data.posting_links]
      .reverse()
      .map((item) => ({
        date: new Date(item.posted_at).toISOString().slice(0, 10),
        views: item.views ?? 0,
        likes: item.likes ?? 0,
        comments: item.comments ?? 0,
        reposts: item.reposts ?? 0,
        share_posts: item.share_posts ?? 0,
      }));
  }, [data]);

  const radarData = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      { metricLabel: "Tayangan", metric: data.metrics.total_views },
      { metricLabel: "Suka", metric: data.metrics.total_likes },
      { metricLabel: "Komentar", metric: data.metrics.total_comments },
      { metricLabel: "Repost", metric: data.metrics.total_reposts },
      { metricLabel: "Bagikan", metric: data.metrics.total_share_posts },
    ];
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

  if (loading || !data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Spinner />
          <span>Memuat detail akun sosmed...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_45%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))]">
        <CardContent className="space-y-6 px-6 py-8 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge variant="outline" className="rounded-full border-sky-200 bg-white/80 px-3 py-1 text-sky-700">
                Analitik / Monitoring Sosmed / Detail Akun
              </Badge>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-semibold text-3xl tracking-tight">{data.nama_profil}</h1>
                  <Badge variant="outline" className={getPlatformTone(data.platform)}>
                    {formatPlatformLabel(data.platform)}
                  </Badge>
                </div>
                <p className="max-w-3xl text-muted-foreground text-sm leading-6">
                  {data.username} • {data.wilayah?.nama ?? "Tanpa wilayah"} • {data.officer?.name ?? "Belum didelegasikan"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40 bg-white">
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
                <SelectTrigger className="w-32 bg-white">
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
              <Button asChild variant="outline">
                <Link href="/analitik/monitoring-sosmed">
                  <ArrowLeft className="mr-2 size-4" />
                  Kembali
                </Link>
              </Button>
              <Button asChild>
                <a href={data.profile_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Buka Profil
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-foreground/10"><CardContent className="space-y-3 py-6"><div className="flex items-center justify-between"><p className="text-muted-foreground text-sm">Followers Terkini</p><Users2 className="size-5 text-sky-600" /></div><p className="font-semibold text-3xl tracking-tight">{formatNumber(data.metrics.latest_followers)}</p><p className="text-muted-foreground text-sm">Wilayah {data.wilayah?.nama ?? "-"}</p></CardContent></Card>
        <Card className="border-foreground/10"><CardContent className="space-y-3 py-6"><div className="flex items-center justify-between"><p className="text-muted-foreground text-sm">Total Tayangan</p><RadioTower className="size-5 text-emerald-600" /></div><p className="font-semibold text-3xl tracking-tight">{formatNumber(data.metrics.total_views)}</p><p className="text-muted-foreground text-sm">{data.selected_period.label}</p></CardContent></Card>
        <Card className="border-foreground/10"><CardContent className="space-y-3 py-6"><div className="flex items-center justify-between"><p className="text-muted-foreground text-sm">Suka / Komentar</p><ThumbsUp className="size-5 text-amber-500" /></div><p className="font-semibold text-3xl tracking-tight">{formatNumber(data.metrics.total_likes)} / {formatNumber(data.metrics.total_comments)}</p><p className="text-muted-foreground text-sm">Interaksi utama</p></CardContent></Card>
        <Card className="border-foreground/10"><CardContent className="space-y-3 py-6"><div className="flex items-center justify-between"><p className="text-muted-foreground text-sm">Repost / Bagikan</p><Share2 className="size-5 text-violet-600" /></div><p className="font-semibold text-3xl tracking-tight">{formatNumber(data.metrics.total_reposts)} / {formatNumber(data.metrics.total_share_posts)}</p><p className="text-muted-foreground text-sm">{formatPercent(data.metrics.engagement_rate)} tingkat interaksi</p></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="pt-0">
          <CardHeader className="border-b py-5">
            <div className="grid gap-1">
              <CardTitle>Tren Postingan Akun</CardTitle>
              <CardDescription>Visualisasi tayangan, suka, komentar, repost, dan bagikan dari posting akun ini.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer config={chartConfig} className="aspect-auto h-[360px] w-full">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0.08} />
                  </linearGradient>
                  <linearGradient id="fillLikes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-likes)" stopOpacity={0.75} />
                    <stop offset="95%" stopColor="var(--color-likes)" stopOpacity={0.08} />
                  </linearGradient>
                  <linearGradient id="fillComments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-comments)" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="var(--color-comments)" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("id-ID", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString("id-ID", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                      indicator="dot"
                    />
                  }
                />
                <Area dataKey="views" type="natural" fill="url(#fillViews)" stroke="var(--color-views)" strokeWidth={2} />
                <Area dataKey="likes" type="natural" fill="url(#fillLikes)" stroke="var(--color-likes)" strokeWidth={2} />
                <Area dataKey="comments" type="natural" fill="url(#fillComments)" stroke="var(--color-comments)" strokeWidth={2} />
                <Area dataKey="reposts" type="natural" stroke="var(--color-reposts)" strokeWidth={2} fillOpacity={0} />
                <Area dataKey="share_posts" type="natural" stroke="var(--color-share_posts)" strokeWidth={2} fillOpacity={0} />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="items-center">
            <CardTitle>Radar Statistik Postingan</CardTitle>
            <CardDescription>Melihat kecenderungan metrik performa posting akun pada periode terpilih.</CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[320px]">
              <RadarChart data={radarData}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <PolarAngleAxis dataKey="metricLabel" />
                <PolarGrid />
                <Radar
                  dataKey="metric"
                  fill="var(--color-metric)"
                  fillOpacity={0.6}
                  dot={{
                    r: 4,
                    fillOpacity: 1,
                  }}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 leading-none font-medium">
              Tingkat interaksi {formatPercent(data.metrics.engagement_rate)} <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {data.selected_period.label}
            </div>
          </CardFooter>
        </Card>
      </div>

      <Card className="border-foreground/10">
        <CardHeader>
          <CardTitle>Postingan Dari Akun Ini</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.posting_links.map((item) => (
            <div key={item.id} className="rounded-2xl border bg-muted/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={getPlatformTone(item.platform)}>
                      {formatPlatformLabel(item.platform)}
                    </Badge>
                    <Badge variant="outline">{item.validation_status}</Badge>
                  </div>
                  <p className="font-medium text-base">{item.bank_content.title}</p>
                  <p className="text-muted-foreground text-sm">PIC: {item.pic.name}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <a href={item.post_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 size-4" />
                    Buka Postingan
                  </a>
                </Button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-5">
                <div className="rounded-xl border bg-white p-3"><p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Tayangan</p><p className="mt-2 font-semibold">{formatNumber(item.views ?? 0)}</p></div>
                <div className="rounded-xl border bg-white p-3"><p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Suka</p><p className="mt-2 font-semibold">{formatNumber(item.likes ?? 0)}</p></div>
                <div className="rounded-xl border bg-white p-3"><p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Komentar</p><p className="mt-2 font-semibold">{formatNumber(item.comments ?? 0)}</p></div>
                <div className="rounded-xl border bg-white p-3"><p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Repost</p><p className="mt-2 font-semibold">{formatNumber(item.reposts ?? 0)}</p></div>
                <div className="rounded-xl border bg-white p-3"><p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Bagikan</p><p className="mt-2 font-semibold">{formatNumber(item.share_posts ?? 0)}</p></div>
              </div>
            </div>
          ))}

          {data.posting_links.length === 0 && (
            <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              Belum ada postingan dari akun ini pada periode {data.selected_period.label}.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
