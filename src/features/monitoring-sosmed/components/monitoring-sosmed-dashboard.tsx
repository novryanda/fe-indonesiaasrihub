"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { format, subDays } from "date-fns";
import { CalendarRange, TrendingUp } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Area, AreaChart, Bar, CartesianGrid, ComposedChart, LabelList, XAxis, YAxis } from "recharts";

import { DateRangePicker } from "@/components/date-range-picker";
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
import { getMonitoringSosmedData } from "@/features/monitoring-sosmed/api/monitoring-sosmed-api";
import type {
  MonitoringPlatform,
  MonitoringSosmedData,
} from "@/features/monitoring-sosmed/types/monitoring-sosmed.type";
import { ESELON_2_OPTIONS } from "@/features/social-accounts/constants/social-account-eselon";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

const numberFormatter = new Intl.NumberFormat("id-ID");
const compactNumberFormatter = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });
const platformOptions: MonitoringPlatform[] = ["instagram", "tiktok", "youtube", "facebook", "x"];
const scoreTrendChartConfig = {
  engagement_score: {
    label: "Engagement Score",
    color: "#0f766e",
  },
} satisfies ChartConfig;
const engagementDetailChartConfig = {
  likes: {
    label: "Likes",
    color: "#0f766e",
  },
  views: {
    label: "Views",
    color: "#2563eb",
  },
  comments: {
    label: "Comments",
    color: "#f97316",
  },
} satisfies ChartConfig;
const chartSeriesColors = {
  engagementScore: "#0f766e",
  likes: "#0f766e",
  views: "#2563eb",
  comments: "#f97316",
} as const;

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatCompact(value: number) {
  return compactNumberFormatter.format(value);
}

function formatPercent(value: number, fractionDigits = 2) {
  return `${value.toFixed(fractionDigits)}%`;
}

function renderAreaValueLabel(formatter: (value: number) => string, fill: string, dy: number) {
  return function AreaValueLabel(props: { x?: number | string; y?: number | string; value?: number | string }) {
    const numericValue = Number(props.value ?? 0);
    const x = Number(props.x);
    const y = Number(props.y);

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return null;
    }

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    return (
      <text x={x} y={y + dy} fill={fill} fontSize={11} fontWeight={600} textAnchor="middle">
        {formatter(numericValue)}
      </text>
    );
  };
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Belum ada scrape";
  }

  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPlatformTone(platform: MonitoringPlatform) {
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
  }
}

function getPicTone(status: "belum_disubmit" | "menunggu" | "valid" | "ditolak") {
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

function createDefaultDateRange(): DateRange {
  const to = new Date();
  const from = subDays(to, 29);
  return { from, to };
}

export function MonitoringSosmedDashboard() {
  const { isAuthorized, isPending } = useRoleGuard(["superadmin", "qcc_wcc"]);
  const [data, setData] = useState<MonitoringSosmedData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => createDefaultDateRange());
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedEselon2, setSelectedEselon2] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

  useEffect(() => {
    if (!isAuthorized || isPending || !startDate || !endDate) {
      return;
    }

    setLoading(true);
    setError(null);

    void getMonitoringSosmedData({
      startDate,
      endDate,
      platform: selectedPlatform === "all" ? undefined : selectedPlatform,
      eselon2: selectedEselon2 === "all" ? undefined : selectedEselon2,
    })
      .then((response) => {
        setData(response.data);
      })
      .catch((caught) => {
        const message = caught instanceof Error ? caught.message : "Gagal memuat monitoring sosial media.";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [endDate, isAuthorized, isPending, selectedEselon2, selectedPlatform, startDate]);

  const scoreTrendRows = useMemo(() => data?.engagement_score_trends ?? [], [data]);
  const engagementDetailRows = useMemo(() => data?.engagement_details ?? [], [data]);

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

  if ((loading && !data) || !startDate || !endDate) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Spinner />
          <span>Memuat command center monitoring sosial media...</span>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="space-y-3 py-12 text-center">
          <p className="font-medium">Monitoring sosial media belum bisa dimuat.</p>
          <p className="text-muted-foreground text-sm">{error ?? "Terjadi kesalahan yang belum teridentifikasi."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-foreground/10">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">Dashboard Monitoring Sosmed</CardTitle>
            <CardDescription>
              Pantau engagement score, tren performa harian, dan ranking konten berdasarkan hasil scrape akun sosial
              media.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="min-w-[180px]">
                <SelectValue placeholder="Pilih platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Platform</SelectItem>
                {platformOptions.map((platform) => (
                  <SelectItem key={platform} value={platform}>
                    {formatPlatformLabel(platform)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedEselon2} onValueChange={setSelectedEselon2}>
              <SelectTrigger className="min-w-[260px]">
                <SelectValue placeholder="Pilih unit kerja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Unit Kerja</SelectItem>
                {ESELON_2_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 border-t py-4 text-muted-foreground text-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <CalendarRange className="size-4 text-[color:var(--brand-hero)]" />
            <span>
              Periode {data.selected_period.label}
              {data.filters.platform ? ` • ${formatPlatformLabel(data.filters.platform)}` : " • Semua platform"}
              {data.filters.eselon_2 ? ` • ${data.filters.eselon_2}` : " • Semua unit kerja"}
            </span>
          </div>
          <div>
            Scope {data.scope.wilayah_nama} • Update scrape terakhir {formatDateTime(data.latest_scraped_at)}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-rose-200 bg-rose-50/60">
          <CardContent className="py-4 text-rose-700 text-sm">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Card className="border-foreground/10">
          <CardHeader>
            <CardTitle className="text-xl">Avg. Engagement Score</CardTitle>
            {/* <CardDescription>
              Rumus: total likes + total comments dibagi total views, lalu dikalikan 100 pada periode terpilih.
            </CardDescription> */}
          </CardHeader>
          <CardContent className="flex min-h-[280px] flex-col justify-between">
            <div className="space-y-4">
              <div className="font-semibold text-5xl tracking-tight">
                {formatPercent(data.engagement_overview.avg_engagement_score)}
              </div>
              <div className="grid gap-3 rounded-3xl border border-foreground/10 bg-muted/15 p-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Total Views</span>
                  <span className="font-semibold text-foreground">{formatNumber(data.stats.total_views)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Total Posting</span>
                  <span className="font-semibold text-foreground">
                    {formatNumber(data.stats.total_posting_bulan_ini)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Akun Aktif Posting</span>
                  <span className="font-semibold text-foreground">{formatNumber(data.stats.akun_posting_aktif)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-foreground/10">
          <CardHeader>
            <CardTitle className="text-xl">Engagement Score Trends</CardTitle>
            <CardDescription>
              Perubahan skor engagement harian untuk periode {data.selected_period.label.toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scoreTrendRows.length > 0 ? (
              <ChartContainer config={scoreTrendChartConfig} className="h-[280px] w-full">
                <AreaChart data={scoreTrendRows}>
                  <defs>
                    <linearGradient id="scoreTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-engagement_score)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-engagement_score)" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="period_label"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tickMargin={8}
                    fontSize={11}
                  />
                  <YAxis tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} width={60} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => (
                          <div className="flex min-w-[160px] items-center justify-between gap-4">
                            <span>Engagement Score</span>
                            <span className="font-semibold text-foreground">{formatPercent(Number(value))}</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement_score"
                    name="Engagement Score"
                    stroke="var(--color-engagement_score)"
                    strokeWidth={2.5}
                    fill="url(#scoreTrendFill)"
                    fillOpacity={1}
                  >
                    <LabelList
                      content={renderAreaValueLabel(
                        (value) => formatPercent(value),
                        chartSeriesColors.engagementScore,
                        -12,
                      )}
                    />
                  </Area>
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="rounded-3xl border border-foreground/20 border-dashed py-16 text-center text-muted-foreground">
                Belum ada data tren engagement pada periode ini.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-foreground/10">
        <CardHeader>
          <CardTitle className="text-xl">Engagement Details</CardTitle>
          <CardDescription>
            Detail performa harian untuk likes, views, dan comments pada akun yang masuk filter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {engagementDetailRows.length > 0 ? (
            <ChartContainer config={engagementDetailChartConfig} className="h-[360px] w-full">
              <ComposedChart data={engagementDetailRows}>
                <defs>
                  <linearGradient id="likesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-likes)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-likes)" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="commentsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-comments)" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="var(--color-comments)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="period_label"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tickMargin={8}
                  fontSize={11}
                />
                <YAxis
                  tickFormatter={(value) => formatCompact(Number(value))}
                  tickLine={false}
                  axisLine={false}
                  width={72}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div className="flex min-w-[160px] items-center justify-between gap-4">
                          <span>{String(name)}</span>
                          <span className="font-semibold text-foreground">{formatNumber(Number(value))}</span>
                        </div>
                      )}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="comments"
                  name="Comments"
                  fill="var(--color-comments)"
                  fillOpacity={0.82}
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                >
                  <LabelList
                    content={renderAreaValueLabel((value) => formatCompact(value), chartSeriesColors.comments, -8)}
                  />
                </Bar>
                <Area
                  type="monotone"
                  dataKey="likes"
                  name="Likes"
                  stroke="var(--color-likes)"
                  strokeWidth={2}
                  fill="url(#likesFill)"
                  fillOpacity={1}
                >
                  <LabelList
                    content={renderAreaValueLabel((value) => formatCompact(value), chartSeriesColors.likes, -14)}
                  />
                </Area>
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Views"
                  stroke="var(--color-views)"
                  strokeWidth={2}
                  fill="url(#viewsFill)"
                  fillOpacity={1}
                >
                  <LabelList
                    content={renderAreaValueLabel((value) => formatCompact(value), chartSeriesColors.views, -30)}
                  />
                </Area>
              </ComposedChart>
            </ChartContainer>
          ) : (
            <div className="rounded-3xl border border-foreground/20 border-dashed py-16 text-center text-muted-foreground">
              Belum ada detail engagement pada periode ini.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
        <Card className="flex h-[720px] flex-col overflow-hidden border-foreground/10 xl:h-[760px]">
          <CardHeader className="shrink-0 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="size-5 text-rose-600" />
              Top Posts 10
            </CardTitle>
            <CardDescription>
              Posting hasil scrape terbaik pada periode terpilih dengan status PIC sebagai marker operasional.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              {data.top_posts.map((post, index) => (
                <div
                  key={post.id}
                  className="app-bg-surface space-y-4 rounded-3xl border border-foreground/10 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background">
                      <span className="font-semibold">#{index + 1}</span>
                    </div>
                    <div className="flex flex-1 flex-wrap justify-end gap-2">
                      <Badge className={getPlatformTone(post.platform)}>{formatPlatformLabel(post.platform)}</Badge>
                      <Badge className={getPicTone(post.pic_status)}>{post.pic_status.replaceAll("_", " ")}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">{post.profile_name}</p>
                    <p className="text-muted-foreground text-sm">
                      {post.username} • {post.wilayah?.nama ?? "Tanpa wilayah"}
                    </p>
                  </div>
                  <p className="line-clamp-4 text-muted-foreground text-sm">
                    {post.caption || "Posting tanpa caption."}
                  </p>
                  <div className="grid grid-cols-3 gap-3 rounded-2xl border border-foreground/10 bg-muted/20 p-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Views</p>
                      <p className="mt-1 font-semibold">{formatCompact(post.total_views)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Likes</p>
                      <p className="mt-1 font-semibold">{formatCompact(post.total_likes)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Comments</p>
                      <p className="mt-1 font-semibold">{formatCompact(post.total_comments)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={`/analitik/monitoring-sosmed/${post.social_account_id}/postingan/${post.id}`}>
                        Detail Post
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <a href={post.url} target="_blank" rel="noreferrer">
                        Buka Source
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
              {data.top_posts.length === 0 && (
                <div className="col-span-full rounded-3xl border border-foreground/20 border-dashed p-8 text-center text-muted-foreground">
                  Belum ada posting hasil scrape pada periode ini.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex h-[720px] flex-col overflow-hidden border-foreground/10 xl:h-[760px]">
          <CardHeader className="shrink-0 border-b pb-4">
            <CardTitle className="text-xl">Top Comment 10</CardTitle>
            <CardDescription>
              Komentar dengan likes terbanyak pada posting hasil scrape di periode terpilih.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
            {data.top_comments.map((comment, index) => (
              <div key={comment.id} className="app-bg-surface space-y-3 rounded-2xl border border-foreground/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      #{index + 1} {comment.owner_username ?? "Anonim"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDateTime(comment.timestamp)} • {formatPlatformLabel(comment.post.platform)}
                    </p>
                  </div>
                  <Badge variant="outline">{formatNumber(comment.likes_count)} likes</Badge>
                </div>
                <p className="line-clamp-4 text-muted-foreground text-sm">{comment.text}</p>
                <div className="rounded-2xl border border-foreground/10 bg-muted/20 p-3 text-sm">
                  <p className="font-medium">{comment.post.account_profile_name}</p>
                  <p className="mt-1 line-clamp-2 text-muted-foreground">
                    {comment.post.caption || comment.post.short_code || "Posting tanpa caption"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link
                      href={`/analitik/monitoring-sosmed/${comment.post.social_account_id}/postingan/${comment.post.id}`}
                    >
                      Detail Post
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <a href={comment.post.url} target="_blank" rel="noreferrer">
                      Buka Source
                    </a>
                  </Button>
                </div>
              </div>
            ))}
            {data.top_comments.length === 0 && (
              <div className="rounded-3xl border border-foreground/20 border-dashed p-8 text-center text-muted-foreground">
                Belum ada komentar scrape pada periode ini.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-foreground/10">
        <CardHeader>
          <CardTitle className="text-xl">Akun Top 10</CardTitle>
          <CardDescription>
            Urutan akun berdasarkan views, posting, followers, dan engagement score dari hasil scrape pada filter aktif.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
            {data.top_accounts.map((account, index) => (
              <div key={account.id} className="grid gap-4 rounded-2xl border border-foreground/10 bg-muted/15 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background">
                      <span className="font-semibold">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{account.profile_name}</p>
                      <p className="text-muted-foreground text-sm">{account.username}</p>
                    </div>
                  </div>
                  <Badge className={getPlatformTone(account.platform)}>{formatPlatformLabel(account.platform)}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Views</p>
                    <p className="mt-1 font-semibold">{formatCompact(account.total_views)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Posting</p>
                    <p className="mt-1 font-semibold">{formatNumber(account.posting_count)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Followers</p>
                    <p className="mt-1 font-semibold">{formatCompact(account.followers)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Engagement</p>
                    <p className="mt-1 font-semibold">{formatPercent(account.engagement_rate)}</p>
                  </div>
                </div>
                <Button asChild variant="outline">
                  <Link href={`/analitik/monitoring-sosmed/${account.id}`}>Buka Akun</Link>
                </Button>
              </div>
            ))}
            {data.top_accounts.length === 0 && (
              <div className="rounded-3xl border border-foreground/20 border-dashed p-8 text-center text-muted-foreground xl:col-span-2 2xl:col-span-3">
                Belum ada akun yang masuk ranking pada periode ini.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
