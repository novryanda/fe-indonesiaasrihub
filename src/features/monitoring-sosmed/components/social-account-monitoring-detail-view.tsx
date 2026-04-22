"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Clock3,
  ExternalLink,
  Eye,
  Layers3,
  MessageSquareText,
  ShieldCheck,
  UserSquare2,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, PolarAngleAxis, PolarGrid, Radar, RadarChart, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { getSocialAccountDetail } from "@/features/social-accounts/api/social-accounts-api";
import type { SocialAccountDetail, SocialPostPicStatus } from "@/features/social-accounts/types/social-account.type";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

const numberFormatter = new Intl.NumberFormat("id-ID");
const compactNumberFormatter = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });

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

const trendChartConfig = {
  followers: {
    label: "Followers",
    color: "#0f766e",
  },
  posting: {
    label: "Posting",
    color: "#2563eb",
  },
  views: {
    label: "Views",
    color: "#f97316",
  },
  comments: {
    label: "Comments",
    color: "#ec4899",
  },
} satisfies ChartConfig;

const healthRadarChartConfig = {
  score: {
    label: "Skor Relatif",
    color: "#0f766e",
  },
} satisfies ChartConfig;

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatCompact(value: number) {
  return compactNumberFormatter.format(value);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Belum ada data";
  }

  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
}

function toDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(
    2,
    "0",
  )}`;
}

function getPlatformTone(platform: string) {
  switch (platform) {
    case "instagram":
      return "border-rose-300 bg-rose-50 text-rose-700";
    case "tiktok":
      return "border-cyan-300 bg-cyan-50 text-cyan-700";
    case "youtube":
      return "border-red-300 bg-red-50 text-red-700";
    case "facebook":
      return "border-blue-300 bg-blue-50 text-blue-700";
    case "x":
      return "border-slate-300 bg-slate-100 text-slate-700";
    default:
      return "border-border bg-muted text-foreground";
  }
}

function getPicTone(status: SocialPostPicStatus) {
  switch (status) {
    case "valid":
      return "border-emerald-300 bg-emerald-50 text-emerald-700";
    case "ditolak":
      return "border-rose-300 bg-rose-50 text-rose-700";
    case "menunggu":
      return "border-amber-300 bg-amber-50 text-amber-700";
    default:
      return "border-slate-300 bg-slate-100 text-slate-700";
  }
}

export function SocialAccountMonitoringDetailView({ id }: { id: string }) {
  const { isAuthorized, isPending } = useRoleGuard(["superadmin", "supervisi", "qcc_wcc"]);
  const now = new Date();
  const [data, setData] = useState<SocialAccountDetail | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [trendRange, setTrendRange] = useState("period");
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

  const trendData = useMemo(() => {
    if (!data) {
      return [];
    }

    const year = Number(selectedYear);
    const month = Number(selectedMonth);
    const totalDays = new Date(year, month, 0).getDate();
    const rows = Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(year, month - 1, index + 1);

      return {
        date: toDateKey(date),
        label: formatDateLabel(date.toISOString()),
        followers: 0,
        posting: 0,
        views: 0,
        comments: 0,
      };
    });

    const rowByKey = new Map(rows.map((item) => [item.date, item]));
    const weeklyStats = [...(data.weekly_stats ?? [])].sort(
      (left, right) => new Date(left.week_date).getTime() - new Date(right.week_date).getTime(),
    );

    let latestFollowers = weeklyStats[0]?.followers ?? data.metrics.latest_followers;
    let statIndex = 0;

    for (const row of rows) {
      const rowDate = new Date(row.date);

      while (
        statIndex < weeklyStats.length &&
        new Date(weeklyStats[statIndex].week_date).getTime() <= rowDate.getTime()
      ) {
        latestFollowers = weeklyStats[statIndex].followers;
        statIndex += 1;
      }

      row.followers = latestFollowers;
    }

    for (const post of data.scraped_posts) {
      if (!post.timestamp) {
        continue;
      }

      const row = rowByKey.get(toDateKey(post.timestamp));
      if (!row) {
        continue;
      }

      row.posting += 1;
      row.views += post.video_view_count ?? post.video_play_count ?? 0;
      row.comments += post.comments_count ?? 0;
    }

    if (weeklyStats.length === 0) {
      return rows.map((row) => ({
        ...row,
        followers: data.metrics.latest_followers,
      }));
    }

    return rows;
  }, [data, selectedMonth, selectedYear]);

  const filteredTrendData = useMemo(() => {
    if (trendRange === "period" || trendData.length === 0) {
      return trendData;
    }

    const referenceDate = new Date(trendData[trendData.length - 1].date);
    const daysToSubtract = trendRange === "14d" ? 14 : 7;
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - (daysToSubtract - 1));

    return trendData.filter((item) => new Date(item.date).getTime() >= startDate.getTime());
  }, [trendData, trendRange]);

  const healthRadarData = useMemo(() => {
    if (!data) {
      return [];
    }

    const countMetrics = [
      data.metrics.latest_followers,
      data.metrics.total_posting,
      data.metrics.total_views,
      data.metrics.total_comments,
      data.metrics.total_likes,
    ];
    const maxCountMetric = Math.max(...countMetrics, 1);
    const normalizeCountMetric = (value: number) =>
      Math.round((Math.log10(value + 1) / Math.log10(maxCountMetric + 1)) * 100);

    return [
      {
        metric: "Followers",
        score: normalizeCountMetric(data.metrics.latest_followers),
        raw_value: formatCompact(data.metrics.latest_followers),
      },
      {
        metric: "Posting",
        score: normalizeCountMetric(data.metrics.total_posting),
        raw_value: formatNumber(data.metrics.total_posting),
      },
      {
        metric: "Views",
        score: normalizeCountMetric(data.metrics.total_views),
        raw_value: formatCompact(data.metrics.total_views),
      },
      {
        metric: "Comments",
        score: normalizeCountMetric(data.metrics.total_comments),
        raw_value: formatCompact(data.metrics.total_comments),
      },
      {
        metric: "Engagement",
        score: Math.min(100, Math.round(data.metrics.engagement_rate * 10)),
        raw_value: `${data.metrics.engagement_rate.toFixed(1)}%`,
      },
      {
        metric: "Like",
        score: normalizeCountMetric(data.metrics.total_likes),
        raw_value: formatCompact(data.metrics.total_likes),
      },
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
      <Card className="app-bg-hero-strong overflow-hidden border-0 text-white shadow-xl">
        <CardContent className="grid gap-6 px-6 py-8 md:px-8 xl:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">Detail Akun</Badge>
              <Badge className={getPlatformTone(data.platform)}>{formatPlatformLabel(data.platform)}</Badge>
            </div>
            <div>
              <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">{data.nama_profil}</h1>
              <p className="mt-2 text-sm text-white/75 md:text-base">
                {data.username} • {data.wilayah?.nama ?? "Tanpa wilayah"} • PIC {data.officer?.name ?? "belum ada"}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <p className="text-white/60 text-xs uppercase tracking-[0.18em]">Freshness</p>
                <p className="mt-2 font-semibold text-lg">
                  {formatDateTime(data.scrape_overview?.latest_scraped_at ?? null)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <p className="text-white/60 text-xs uppercase tracking-[0.18em]">Posting Periode</p>
                <p className="mt-2 font-semibold text-2xl">
                  {formatNumber(data.scrape_overview?.observed_posts_count ?? 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <p className="text-white/60 text-xs uppercase tracking-[0.18em]">Histori Scrape</p>
                <p className="mt-2 font-semibold text-2xl">
                  {formatNumber(data.scrape_overview?.historical_posts_count ?? 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <p className="text-white/60 text-xs uppercase tracking-[0.18em]">PIC Valid</p>
                <p className="mt-2 font-semibold text-2xl">{formatNumber(data.pic_activity_summary.valid_count)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="border-white/15 bg-black/10 text-white">
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
              <SelectTrigger className="border-white/15 bg-black/10 text-white">
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
            <Button
              asChild
              variant="outline"
              className="w-full border-white/15 bg-black/10 text-white hover:bg-black/20"
            >
              <Link href="/analitik/monitoring-sosmed">
                <ArrowLeft className="mr-2 size-4" />
                Kembali ke Dashboard
              </Link>
            </Button>
            <Button asChild className="w-full">
              <a href={data.profile_url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 size-4" />
                Buka Profil Sosmed
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Followers",
            value: formatNumber(data.metrics.latest_followers),
            icon: UserSquare2,
            helper: data.selected_period.label,
          },
          {
            label: "Posting",
            value: formatNumber(data.metrics.total_posting),
            icon: Layers3,
            helper: `${formatNumber(data.scrape_overview?.historical_posts_count ?? data.scraped_posts.length)} total histori`,
          },
          {
            label: "Views",
            value: formatCompact(data.metrics.total_views),
            icon: Eye,
            helper: `${formatCompact(data.metrics.total_likes)} likes`,
          },
          {
            label: "Comments",
            value: formatCompact(data.metrics.total_comments),
            icon: MessageSquareText,
            helper: `${formatCompact(data.metrics.total_reposts)} repost`,
          },
          {
            label: "PIC Activity",
            value: formatNumber(data.pic_activity_summary.submitted_count),
            icon: ShieldCheck,
            helper: `${formatNumber(data.pic_activity_summary.waiting_count)} menunggu`,
          },
        ].map((item) => (
          <Card key={item.label} className="border-foreground/10">
            <CardContent className="space-y-3 py-6">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">{item.label}</p>
                <item.icon className="size-5 text-emerald-600" />
              </div>
              <p className="font-semibold text-3xl tracking-tight">{item.value}</p>
              <p className="text-muted-foreground text-sm">{item.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-foreground/10 pt-0">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Tren Post Scrape</CardTitle>
              <CardDescription>
                Visualisasi followers, posting, views, dan comments berdasarkan data scrape pada periode terpilih.
              </CardDescription>
            </div>
            <Select value={trendRange} onValueChange={setTrendRange}>
              <SelectTrigger className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex" aria-label="Pilih rentang tren">
                <SelectValue placeholder="Periode aktif" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="period" className="rounded-lg">
                  Periode aktif
                </SelectItem>
                <SelectItem value="14d" className="rounded-lg">
                  14 hari
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                  7 hari
                </SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-5 px-2 pt-4 sm:px-6 sm:pt-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Followers", value: formatNumber(data.metrics.latest_followers) },
                { label: "Posting", value: formatNumber(data.metrics.total_posting) },
                { label: "Views", value: formatCompact(data.metrics.total_views) },
                { label: "Comments", value: formatCompact(data.metrics.total_comments) },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-foreground/10 bg-muted/20 px-4 py-3">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">{item.label}</p>
                  <p className="mt-2 font-semibold text-lg">{item.value}</p>
                </div>
              ))}
            </div>
            <ChartContainer config={trendChartConfig} className="aspect-auto h-[340px] w-full">
              <AreaChart data={filteredTrendData}>
                <defs>
                  <linearGradient id="detailTrendFollowers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-followers)" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="var(--color-followers)" stopOpacity={0.08} />
                  </linearGradient>
                  <linearGradient id="detailTrendPosting" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-posting)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-posting)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="detailTrendViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0.06} />
                  </linearGradient>
                  <linearGradient id="detailTrendComments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-comments)" stopOpacity={0.38} />
                    <stop offset="95%" stopColor="var(--color-comments)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={28}
                  tickFormatter={(value) => formatDateLabel(String(value))}
                />
                <YAxis
                  yAxisId="volume"
                  tickLine={false}
                  axisLine={false}
                  width={54}
                  tickFormatter={(value) => compactNumberFormatter.format(Number(value))}
                />
                <YAxis
                  yAxisId="followers"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  width={54}
                  tickFormatter={(value) => compactNumberFormatter.format(Number(value))}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => formatDateLabel(String(value))}
                      indicator="dot"
                      formatter={(value, name) => {
                        const labelMap: Record<string, string> = {
                          followers: "Followers",
                          posting: "Posting",
                          views: "Views",
                          comments: "Comments",
                        };

                        return (
                          <div className="flex w-full items-center justify-between gap-3">
                            <span className="text-muted-foreground">{labelMap[String(name)] ?? String(name)}</span>
                            <span className="font-medium font-mono text-foreground tabular-nums">
                              {Number(value).toLocaleString("id-ID")}
                            </span>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Area
                  dataKey="comments"
                  yAxisId="volume"
                  type="natural"
                  fill="url(#detailTrendComments)"
                  stroke="var(--color-comments)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="posting"
                  yAxisId="volume"
                  type="natural"
                  fill="url(#detailTrendPosting)"
                  stroke="var(--color-posting)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="views"
                  yAxisId="volume"
                  type="natural"
                  fill="url(#detailTrendViews)"
                  stroke="var(--color-views)"
                  strokeWidth={2.2}
                />
                <Area
                  dataKey="followers"
                  yAxisId="followers"
                  type="natural"
                  fill="url(#detailTrendFollowers)"
                  stroke="var(--color-followers)"
                  strokeWidth={2}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-foreground/10">
          <CardHeader className="items-center">
            <CardTitle>Statistik</CardTitle>
            <CardDescription>
              Statistik akun divisualkan dalam skor relatif untuk membaca kondisi performa saat ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <ChartContainer config={healthRadarChartConfig} className="mx-auto aspect-square max-h-[320px]">
              <RadarChart data={healthRadarData}>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value, _name, item) => {
                        const payload = item.payload as { metric: string; raw_value: string };

                        return (
                          <div className="flex w-full items-center justify-between gap-3">
                            <span className="text-muted-foreground">{payload.metric}</span>
                            <span className="font-medium font-mono text-foreground tabular-nums">
                              {payload.raw_value} ({Number(value).toLocaleString("id-ID")})
                            </span>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <PolarAngleAxis dataKey="metric" />
                <PolarGrid />
                <Radar
                  dataKey="score"
                  fill="var(--color-score)"
                  fillOpacity={0.55}
                  stroke="var(--color-score)"
                  dot={{
                    r: 4,
                    fillOpacity: 1,
                  }}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
          <div className="flex flex-col gap-2 px-6 pb-6 text-sm">
            <div className="flex items-center gap-2 font-medium leading-none">
              <Clock3 className="h-4 w-4" />
              Scrape terakhir {formatDateTime(data.scrape_overview?.latest_scraped_at ?? null)}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <span>Dataset: {data.scrape_overview?.dataset_id ?? "-"}</span>
              {data.content_mix.slice(0, 3).map((item) => (
                <Badge key={item.type} variant="secondary" className="rounded-full">
                  {item.type}: {formatNumber(item.count)}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden border-foreground/10">
          <CardHeader>
            <CardTitle>Postingan Hasil Scrape</CardTitle>
            <CardDescription>
              Data di bawah mengikuti periode {data.selected_period.label}. Total histori scrape akun ini
              {" "}{formatNumber(data.scrape_overview?.historical_posts_count ?? data.scraped_posts.length)} posting.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[920px] overflow-y-auto pr-2">
            <div className="grid gap-4 md:grid-cols-2">
              {data.scraped_posts.map((post) => (
                <div
                  key={post.id}
                  className="overflow-hidden rounded-3xl border border-foreground/10 app-bg-surface shadow-sm"
                >
                  <div className="space-y-4 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getPlatformTone(data.platform)}>{formatPlatformLabel(data.platform)}</Badge>
                      <Badge className={getPicTone(post.pic_marker.status)}>
                        {post.pic_marker.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <p className="line-clamp-3 text-muted-foreground text-sm">
                      {post.caption || "Posting tanpa caption."}
                    </p>
                    <div className="grid grid-cols-3 gap-3 rounded-2xl border border-foreground/10 bg-muted/20 p-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Views</p>
                        <p className="mt-1 font-semibold">
                          {formatCompact(post.video_view_count ?? post.video_play_count ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Likes</p>
                        <p className="mt-1 font-semibold">{formatCompact(post.likes_count ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Comments</p>
                        <p className="mt-1 font-semibold">{formatCompact(post.comments_count ?? 0)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild className="flex-1">
                        <Link href={`/analitik/monitoring-sosmed/${data.id}/postingan/${post.id}`}>Detail Post</Link>
                      </Button>
                      <Button asChild variant="outline" className="flex-1">
                        <a href={post.url} target="_blank" rel="noreferrer">
                          Buka Source
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {data.scraped_posts.length === 0 && (
                <div className="col-span-full rounded-3xl border border-foreground/20 border-dashed p-8 text-center text-muted-foreground">
                  Belum ada posting hasil scrape pada periode {data.selected_period.label}.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="overflow-hidden border-foreground/10">
            <CardHeader>
              <CardTitle>Aktivitas PIC</CardTitle>
              <CardDescription>Ringkasan workflow PIC dan distribusi status posting pada akun ini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-slate-700 text-xs uppercase tracking-[0.18em]">Submitted</p>
                  <p className="mt-2 font-semibold text-2xl text-slate-900">
                    {formatNumber(data.pic_activity_summary.submitted_count)}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-emerald-700 text-xs uppercase tracking-[0.18em]">Valid</p>
                  <p className="mt-2 font-semibold text-2xl text-emerald-900">
                    {formatNumber(data.pic_activity_summary.valid_count)}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-amber-700 text-xs uppercase tracking-[0.18em]">Menunggu</p>
                  <p className="mt-2 font-semibold text-2xl text-amber-900">
                    {formatNumber(data.pic_activity_summary.waiting_count)}
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                  <p className="text-rose-700 text-xs uppercase tracking-[0.18em]">Ditolak</p>
                  <p className="mt-2 font-semibold text-2xl text-rose-900">
                    {formatNumber(data.pic_activity_summary.rejected_count)}
                  </p>
                </div>
              </div>
              <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
                {data.posting_links.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-foreground/10 bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.bank_content.title}</p>
                        <p className="mt-1 text-muted-foreground text-xs">
                          {item.pic.name} • {formatDateTime(item.posted_at)}
                        </p>
                      </div>
                      <Badge className={getPicTone(item.validation_status)}>{item.validation_status}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Views</p>
                        <p className="mt-1 font-semibold">{formatCompact(item.views ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Likes</p>
                        <p className="mt-1 font-semibold">{formatCompact(item.likes ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Comments</p>
                        <p className="mt-1 font-semibold">{formatCompact(item.comments ?? 0)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {data.posting_links.length === 0 && (
                  <div className="rounded-2xl border border-foreground/20 border-dashed p-6 text-center text-muted-foreground">
                    Belum ada aktivitas PIC pada periode ini.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-foreground/10">
            <CardHeader>
              <CardTitle>Komentar Terbaru</CardTitle>
              <CardDescription>Umpan balik audiens terbaru dari posting hasil scrape akun ini.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {data.latest_comments_summary.map((comment) => (
                <div key={comment.id} className="rounded-2xl border border-foreground/10 bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{comment.owner_username || "Anonim"}</p>
                    <span className="text-muted-foreground text-xs">{formatDateTime(comment.timestamp)}</span>
                  </div>
                  <p className="mt-2 text-muted-foreground text-sm">{comment.text || "Komentar kosong"}</p>
                  <p className="mt-3 text-muted-foreground text-xs">
                    Post: {comment.post.short_code || comment.post.external_post_id} • replies{" "}
                    {formatNumber(comment.replies_count)}
                  </p>
                </div>
              ))}
              {data.latest_comments_summary.length === 0 && (
                <div className="rounded-2xl border border-foreground/20 border-dashed p-6 text-center text-muted-foreground">
                  Belum ada komentar terbaru untuk ditampilkan.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
