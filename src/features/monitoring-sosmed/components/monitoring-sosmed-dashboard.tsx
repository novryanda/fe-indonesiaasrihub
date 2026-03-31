"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  ArrowDownRight,
  ArrowUpRight,
  CircleHelp,
  Eye,
  Gauge,
  Layers3,
  Lightbulb,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
  UserRoundCheck,
  Users2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { getMonitoringSosmedData } from "@/features/monitoring-sosmed/api/monitoring-sosmed-api";
import { MonitoringSosmedAreaChart } from "@/features/monitoring-sosmed/components/monitoring-sosmed-area-chart";
import { MonitoringSosmedPlatformBarChart } from "@/features/monitoring-sosmed/components/monitoring-sosmed-platform-bar-chart";
import { MonitoringSosmedPlatformRadarChart } from "@/features/monitoring-sosmed/components/monitoring-sosmed-platform-radar-chart";
import type {
  MonitoringDailyPlatformAreaItem,
  MonitoringDailyPlatformMetric,
  MonitoringPlatform,
  MonitoringSosmedData,
} from "@/features/monitoring-sosmed/types/monitoring-sosmed.type";
import { cn } from "@/lib/utils";
import { listWilayahOptions, type WilayahOption } from "@/shared/api/wilayah";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

const numberFormatter = new Intl.NumberFormat("id-ID");
const compactNumberFormatter = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });
const MONITORING_PLATFORMS: MonitoringPlatform[] = ["instagram", "tiktok", "youtube", "facebook", "x"];
const KPI_DEFINITIONS = {
  total_akun_aktif: "Akun sosmed yang aktif dan masuk cakupan monitoring pada periode yang dipilih.",
  total_posting_bulan_ini: "Jumlah posting hasil scrape yang tercatat pada periode aktif dashboard.",
  total_views: "Akumulasi tayangan dari seluruh posting hasil scrape pada periode aktif.",
  total_comments: "Total komentar yang berhasil terobservasi dari posting hasil scrape pada periode aktif.",
  avg_engagement_rate: "Rata-rata ((likes + comments + reposts) / views) x 100 pada posting hasil scrape.",
  akun_posting_aktif: "Jumlah akun yang memiliki aktivitas posting hasil scrape selama periode yang dipilih.",
  target_posting_terpenuhi: "Jumlah posting yang memenuhi target waktu submit dan timestamp posting.",
  scrape_terakhir: "Waktu sinkronisasi scrape terakhir yang berhasil masuk ke dashboard ini.",
} satisfies Record<string, string>;

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

function formatCompact(value: number) {
  return compactNumberFormatter.format(value);
}

function formatSignedPercent(value: number) {
  if (value > 0) {
    return `+${value.toFixed(1)}%`;
  }

  return `${value.toFixed(1)}%`;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDeltaPercent(value: number) {
  if (value > 0) {
    return `+${value.toFixed(1)}%`;
  }

  return `${value.toFixed(1)}%`;
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

function formatDateOnly(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function safeDivide(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return numerator / denominator;
}

function calculateDeltaPercent(current: number, previous: number | null | undefined) {
  if (previous == null) {
    return null;
  }

  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
}

function getPreviousPeriod(month: number, year: number) {
  if (month === 1) {
    return { month: 12, year: year - 1 };
  }

  return { month: month - 1, year };
}

function formatComparisonPeriod(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: "short",
    year: "numeric",
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

function MetricLabel({ label, description, className }: { label: string; description?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span>{label}</span>
      {description ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center text-muted-foreground transition hover:text-foreground"
              aria-label={`Info ${label}`}
            >
              <CircleHelp className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-64 leading-5">
            {description}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </span>
  );
}

function DeltaBadge({ value, label }: { value: number | null; label: string }) {
  if (value == null) {
    return null;
  }

  const isPositive = value > 0;
  const isNegative = value < 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium text-[11px]",
        isPositive && "border-emerald-200 bg-emerald-50 text-emerald-700",
        isNegative && "border-rose-200 bg-rose-50 text-rose-700",
        !isPositive && !isNegative && "border-slate-200 bg-slate-100 text-slate-700",
      )}
    >
      {isPositive ? <ArrowUpRight className="size-3.5" /> : null}
      {isNegative ? <ArrowDownRight className="size-3.5" /> : null}
      {!isPositive && !isNegative ? <RefreshCw className="size-3.5" /> : null}
      {formatSignedPercent(value)} {label}
    </span>
  );
}

function AdditionalPanelEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-foreground/20 border-dashed px-5 py-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-2 text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

function aggregateDailyMetrics(items: MonitoringDailyPlatformAreaItem[]) {
  const totals = new Map<MonitoringPlatform, MonitoringDailyPlatformMetric>();
  const dailyTotals: Array<{
    date: string;
    periodLabel: string;
    views: number;
    likes: number;
    comments: number;
    reposts: number;
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
    const relevantMetrics = item.platform_metrics;

    dailyTotals.push({
      date: item.period_date,
      periodLabel: item.period_label,
      views: relevantMetrics.reduce((sum, metric) => sum + metric.views, 0),
      likes: relevantMetrics.reduce((sum, metric) => sum + metric.likes, 0),
      comments: relevantMetrics.reduce((sum, metric) => sum + metric.comments, 0),
      reposts: relevantMetrics.reduce((sum, metric) => sum + metric.reposts, 0),
    });

    for (const metric of relevantMetrics) {
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
    dailyTotals,
  };
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

export function MonitoringSosmedDashboard() {
  const { role, isAuthorized, isPending } = useRoleGuard(["superadmin", "qcc_wcc"]);
  const now = new Date();
  const [data, setData] = useState<MonitoringSosmedData | null>(null);
  const [previousData, setPreviousData] = useState<MonitoringSosmedData | null>(null);
  const [wilayahOptions, setWilayahOptions] = useState<WilayahOption[]>([]);
  const [selectedWilayahId, setSelectedWilayahId] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [loading, setLoading] = useState(true);

  const yearOptions = Array.from({ length: 5 }, (_, index) => String(now.getFullYear() - index));
  const comparisonPeriod = useMemo(
    () => getPreviousPeriod(Number(selectedMonth), Number(selectedYear)),
    [selectedMonth, selectedYear],
  );

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
    void Promise.all([
      getMonitoringSosmedData({
        wilayahId: role === "superadmin" && selectedWilayahId !== "all" ? selectedWilayahId : undefined,
        month: Number(selectedMonth),
        year: Number(selectedYear),
      }),
      getMonitoringSosmedData({
        wilayahId: role === "superadmin" && selectedWilayahId !== "all" ? selectedWilayahId : undefined,
        month: comparisonPeriod.month,
        year: comparisonPeriod.year,
      }).catch(() => null),
    ])
      .then(([response, previousResponse]) => {
        setData(response.data);
        setPreviousData(previousResponse?.data ?? null);
      })
      .finally(() => setLoading(false));
  }, [
    comparisonPeriod.month,
    comparisonPeriod.year,
    isAuthorized,
    isPending,
    role,
    selectedMonth,
    selectedWilayahId,
    selectedYear,
  ]);

  const { platformTotals, dailyTotals } = useMemo(() => aggregateDailyMetrics(data?.daily_platform_area ?? []), [data]);

  const totalViews = useMemo(() => platformTotals.reduce((sum, item) => sum + item.views, 0), [platformTotals]);
  const totalEngagement = useMemo(
    () => platformTotals.reduce((sum, item) => sum + item.likes + item.comments + item.reposts, 0),
    [platformTotals],
  );
  const dailyAverageViews = useMemo(
    () =>
      safeDivide(
        dailyTotals.reduce((sum, item) => sum + item.views, 0),
        dailyTotals.length,
      ),
    [dailyTotals],
  );

  const dominantPlatform = useMemo(
    () =>
      [...platformTotals].sort((left, right) => {
        if (right.views !== left.views) {
          return right.views - left.views;
        }

        return right.likes + right.comments + right.reposts - (left.likes + left.comments + left.reposts);
      })[0] ?? null,
    [platformTotals],
  );

  const dominantEngagementPlatform = useMemo(
    () =>
      [...platformTotals].sort(
        (left, right) => right.likes + right.comments + right.reposts - (left.likes + left.comments + left.reposts),
      )[0] ?? null,
    [platformTotals],
  );

  const peakDay = useMemo(
    () => [...dailyTotals].sort((left, right) => right.views - left.views)[0] ?? null,
    [dailyTotals],
  );

  const dominantAccount = useMemo(
    () => [...(data?.top_accounts ?? [])].sort((left, right) => right.total_views - left.total_views)[0] ?? null,
    [data],
  );

  const bestEngagementPost = useMemo(
    () =>
      [...(data?.top_posts ?? [])].sort((left, right) => {
        const leftRate = safeDivide(left.total_likes + left.total_comments, left.total_views) * 100;
        const rightRate = safeDivide(right.total_likes + right.total_comments, right.total_views) * 100;

        if (rightRate !== leftRate) {
          return rightRate - leftRate;
        }

        return right.total_views - left.total_views;
      })[0] ?? null,
    [data],
  );

  const topAccountShareOfViews = useMemo(() => {
    if (!dominantAccount || !data) {
      return 0;
    }

    return safeDivide(dominantAccount.total_views, data.stats.total_views) * 100;
  }, [data, dominantAccount]);

  const dominantPlatformShare = useMemo(() => {
    if (!dominantPlatform) {
      return 0;
    }

    return safeDivide(dominantPlatform.views, totalViews) * 100;
  }, [dominantPlatform, totalViews]);

  const healthSummary = useMemo(() => {
    if (!data) {
      return null;
    }

    const activePlatformCount = platformTotals.length;
    const missingPlatforms = MONITORING_PLATFORMS.filter(
      (platform) => !platformTotals.some((item) => item.platform === platform),
    );
    const scrapeDayCount = data.daily_platform_area.length;

    if (!data.latest_scraped_at || scrapeDayCount === 0) {
      return {
        tone: "warning" as const,
        title: "Data scrape belum lengkap",
        description: "Dashboard belum menerima data scrape yang memadai untuk periode ini.",
        missingPlatforms,
        activePlatformCount,
        scrapeDayCount,
      };
    }

    if (missingPlatforms.length > 0 || scrapeDayCount < 7) {
      return {
        tone: "partial" as const,
        title: "Cakupan data parsial",
        description: "Sebagian platform atau rentang harian masih terbatas pada periode aktif.",
        missingPlatforms,
        activePlatformCount,
        scrapeDayCount,
      };
    }

    return {
      tone: "healthy" as const,
      title: "Cakupan scrape stabil",
      description: "Sinkronisasi data dan observasi platform berada dalam kondisi baik.",
      missingPlatforms,
      activePlatformCount,
      scrapeDayCount,
    };
  }, [data, platformTotals]);

  const insightSummaryItems = useMemo(() => {
    const items: Array<{ title: string; description: string; tone: "default" | "warning" }> = [];

    if (dominantPlatform) {
      items.push({
        title: "Platform terkuat",
        description: `${formatPlatformLabel(dominantPlatform.platform)} menyumbang ${formatPercent(dominantPlatformShare)} views pada scope insight aktif.`,
        tone: "default",
      });
    }

    if (peakDay) {
      items.push({
        title: "Lonjakan views tertinggi",
        description: `${formatDateOnly(peakDay.date)} menghasilkan ${formatCompact(peakDay.views)} views, sekitar ${formatPercent(
          safeDivide(peakDay.views, dailyAverageViews || peakDay.views) * 100,
        )} dari rerata harian.`,
        tone: "default",
      });
    }

    if (dominantAccount) {
      items.push({
        title: "Akun dominan",
        description: `${dominantAccount.profile_name} membawa ${formatPercent(topAccountShareOfViews)} dari total views dashboard periode ini.`,
        tone: topAccountShareOfViews >= 35 ? "warning" : "default",
      });
    }

    if (bestEngagementPost) {
      const bestRate = safeDivide(
        bestEngagementPost.total_likes + bestEngagementPost.total_comments,
        bestEngagementPost.total_views,
      );

      items.push({
        title: "Posting engagement terbaik",
        description: `${bestEngagementPost.profile_name} mencatat engagement ${formatPercent(bestRate * 100)} pada ranking post aktif.`,
        tone: "default",
      });
    }

    if (dominantPlatformShare >= 55) {
      items.push({
        title: "Konsentrasi performa tinggi",
        description: dominantPlatform
          ? `Views masih bertumpu pada ${formatPlatformLabel(dominantPlatform.platform)}. Pertimbangkan pemerataan distribusi konten ke platform lain.`
          : "Views masih bertumpu pada satu platform. Pertimbangkan pemerataan distribusi konten ke platform lain.",
        tone: "warning",
      });
    }

    return items.slice(0, 5);
  }, [
    bestEngagementPost,
    dailyAverageViews,
    dominantAccount,
    dominantPlatform,
    dominantPlatformShare,
    peakDay,
    topAccountShareOfViews,
  ]);

  const operationalRecommendations = useMemo(() => {
    const items: string[] = [];

    if (dominantAccount) {
      items.push(
        `${dominantAccount.profile_name} terlihat paling konsisten dari sisi views dan frekuensi posting. Pantau pola kontennya sebagai baseline periode berikutnya.`,
      );
    }

    const lowEngagementAccount = [...(data?.top_accounts ?? [])].sort((left, right) => {
      const leftScore = left.posting_count >= 2 ? left.engagement_rate : Number.POSITIVE_INFINITY;
      const rightScore = right.posting_count >= 2 ? right.engagement_rate : Number.POSITIVE_INFINITY;

      return leftScore - rightScore;
    })[0];

    if (lowEngagementAccount && Number.isFinite(lowEngagementAccount.engagement_rate)) {
      items.push(
        `${lowEngagementAccount.profile_name} aktif posting tetapi engagement rate masih ${formatPercent(lowEngagementAccount.engagement_rate)}. Perlu evaluasi format konten dan CTA.`,
      );
    }

    const highViewsLowCommentPost = [...(data?.top_posts ?? [])].sort((left, right) => {
      const leftScore = left.total_views >= 1 ? safeDivide(left.total_comments, left.total_views) : 1;
      const rightScore = right.total_views >= 1 ? safeDivide(right.total_comments, right.total_views) : 1;

      if (leftScore !== rightScore) {
        return leftScore - rightScore;
      }

      return right.total_views - left.total_views;
    })[0];

    if (highViewsLowCommentPost) {
      items.push(
        `Post ${highViewsLowCommentPost.profile_name} punya jangkauan tinggi tetapi rasio komentar rendah. Cocok dipantau untuk optimasi interaksi audiens.`,
      );
    }

    if (dominantEngagementPlatform) {
      items.push(
        `${formatPlatformLabel(dominantEngagementPlatform.platform)} menjadi platform dengan kontribusi engagement tertinggi pada scope insight aktif.`,
      );
    }

    if (healthSummary?.missingPlatforms.length) {
      items.push(
        `Cakupan platform belum penuh. Pastikan scrape ${healthSummary.missingPlatforms
          .map((platform) => formatPlatformLabel(platform))
          .join(", ")} dipantau pada periode berikutnya.`,
      );
    }

    return items.slice(0, 5);
  }, [data, dominantAccount, dominantEngagementPlatform, healthSummary]);

  const statCards = useMemo(() => {
    if (!data) {
      return [];
    }

    const comparisonLabel = `vs ${formatComparisonPeriod(comparisonPeriod.month, comparisonPeriod.year)}`;

    return [
      {
        key: "total_akun_aktif",
        label: "Total Akun Aktif",
        value: formatNumber(data.stats.total_akun_aktif),
        helper: `${data.scope.wilayah_nama} aktif pada scope ini`,
        icon: Users2,
        tooltip: KPI_DEFINITIONS.total_akun_aktif,
        delta: calculateDeltaPercent(data.stats.total_akun_aktif, previousData?.stats.total_akun_aktif),
        deltaLabel: comparisonLabel,
      },
      {
        key: "total_posting_bulan_ini",
        label: "Total Posting Bulan Ini",
        value: formatNumber(data.stats.total_posting_bulan_ini),
        helper: `${formatDeltaPercent(data.stats.posting_mom_delta_percent)} vs bulan lalu`,
        icon: Layers3,
        tooltip: KPI_DEFINITIONS.total_posting_bulan_ini,
        delta: calculateDeltaPercent(data.stats.total_posting_bulan_ini, previousData?.stats.total_posting_bulan_ini),
        deltaLabel: comparisonLabel,
      },
      {
        key: "total_views",
        label: "Total Views",
        value: formatCompact(data.stats.total_views),
        helper: `${formatCompact(data.stats.avg_views_per_posting)} rata-rata per posting`,
        icon: Eye,
        tooltip: KPI_DEFINITIONS.total_views,
        delta: calculateDeltaPercent(data.stats.total_views, previousData?.stats.total_views),
        deltaLabel: comparisonLabel,
      },
      {
        key: "total_comments",
        label: "Total Komentar",
        value: formatCompact(data.stats.total_comments),
        helper: `${formatCompact(data.stats.avg_comments_per_posting)} rata-rata per posting`,
        icon: MessageSquareText,
        tooltip: KPI_DEFINITIONS.total_comments,
        delta: calculateDeltaPercent(data.stats.total_comments, previousData?.stats.total_comments),
        deltaLabel: comparisonLabel,
      },
      {
        key: "avg_engagement_rate",
        label: "Engagement Rate Rata-rata",
        value: formatPercent(data.stats.avg_engagement_rate),
        helper: "Rata-rata engagement per posting scrape",
        icon: Gauge,
        tooltip: KPI_DEFINITIONS.avg_engagement_rate,
        delta: calculateDeltaPercent(data.stats.avg_engagement_rate, previousData?.stats.avg_engagement_rate),
        deltaLabel: comparisonLabel,
      },
      {
        key: "akun_posting_aktif",
        label: "Akun Posting Aktif",
        value: formatNumber(data.stats.akun_posting_aktif),
        helper: "Akun sosmed yang sudah punya performa posting",
        icon: UserRoundCheck,
        tooltip: KPI_DEFINITIONS.akun_posting_aktif,
        delta: calculateDeltaPercent(data.stats.akun_posting_aktif, previousData?.stats.akun_posting_aktif),
        deltaLabel: comparisonLabel,
      },
      {
        key: "target_posting_terpenuhi",
        label: "Target Posting Terpenuhi",
        value: formatNumber(data.stats.target_posting_terpenuhi),
        helper: "Submit dan postedAt tidak melewati target",
        icon: Target,
        tooltip: KPI_DEFINITIONS.target_posting_terpenuhi,
        delta: calculateDeltaPercent(data.stats.target_posting_terpenuhi, previousData?.stats.target_posting_terpenuhi),
        deltaLabel: comparisonLabel,
      },
    ];
  }, [comparisonPeriod.month, comparisonPeriod.year, data, previousData]);

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

  if (loading || !data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Spinner />
          <span>Memuat command center monitoring sosial media...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#062f2a_0%,#0d4d43_38%,#0f2f55_100%)] text-white shadow-xl">
          <CardContent className="grid gap-6 px-6 py-8 md:px-8 xl:grid-cols-[1.35fr_0.9fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">Monitoring Sosmed</Badge>
                <Badge className="border-emerald-300/30 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/10">
                  Monthly Command Center
                </Badge>
              </div>
              <div className="space-y-3">
                <h1 className="max-w-4xl font-semibold text-3xl tracking-tight md:text-4xl">
                  Analitik performa scrape, capaian PIC, dan distribusi platform dipusatkan dalam satu panel.
                </h1>
                <p className="max-w-3xl text-sm text-white/75 leading-6 md:text-base">
                  KPI utama dashboard ini mengikuti hasil scrape bulanan agar views, comments, engagement, dan performa
                  platform yang tampil selalu konsisten dengan data observasi terbaru.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <p className="text-white/60 text-xs uppercase tracking-[0.24em]">Scope</p>
                  <p className="mt-3 font-semibold text-xl">{data.scope.wilayah_nama}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <p className="text-white/60 text-xs uppercase tracking-[0.24em]">Periode</p>
                  <p className="mt-3 font-semibold text-xl">{data.selected_period.label}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <p className="text-white/60 text-xs uppercase tracking-[0.24em]">
                    <MetricLabel
                      label="Scrape Terakhir"
                      description={KPI_DEFINITIONS.scrape_terakhir}
                      className="text-white/60"
                    />
                  </p>
                  <p className="mt-3 font-semibold text-lg">{formatDateTime(data.latest_scraped_at)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur">
              <div className="grid gap-4">
                {role === "superadmin" ? (
                  <Select value={selectedWilayahId} onValueChange={setSelectedWilayahId}>
                    <SelectTrigger className="border-white/15 bg-black/10 text-white">
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
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/70">
                    Scope regional otomatis mengikuti wilayah user.
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  <Select
                    value={selectedMonth}
                    onValueChange={(value) => {
                      setSelectedMonth(value);
                    }}
                  >
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
                  <Select
                    value={selectedYear}
                    onValueChange={(value) => {
                      setSelectedYear(value);
                    }}
                  >
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
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="text-sm text-white/70">Posting scrape bulan lalu</p>
                    <p className="mt-2 font-semibold text-3xl">{formatNumber(data.stats.posting_bulan_lalu)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="text-sm text-white/70">Momentum scrape bulanan</p>
                    <p className="mt-2 font-semibold text-3xl">
                      {formatDeltaPercent(data.stats.posting_mom_delta_percent)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item) => (
            <Card key={item.key} className="border-foreground/10 bg-[linear-gradient(180deg,#fff,#f8fafc)]">
              <CardContent className="space-y-4 py-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-muted-foreground text-sm">
                    <MetricLabel label={item.label} description={item.tooltip} />
                  </p>
                  <item.icon className="size-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-3xl tracking-tight">{item.value}</p>
                  <p className="mt-1 text-muted-foreground text-sm">{item.helper}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <DeltaBadge value={item.delta} label={item.deltaLabel} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.85fr_1fr]">
          <Card className="border-foreground/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="size-5 text-amber-500" />
                Insight Summary
              </CardTitle>
              <CardDescription>
                Ringkasan otomatis dari data periode aktif untuk membantu pembacaan cepat dan pengambilan keputusan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-foreground/10 bg-muted/15 px-4 py-3 text-sm">
                <p className="font-medium">Scope insight dashboard</p>
                <p className="mt-1 text-muted-foreground">
                  Seluruh insight tambahan mengikuti scope wilayah dan periode aktif pada dashboard ini.
                </p>
              </div>
              {insightSummaryItems.length > 0 ? (
                <div className="space-y-3">
                  {insightSummaryItems.map((item) => (
                    <div
                      key={item.title}
                      className={cn(
                        "rounded-2xl border px-4 py-3",
                        item.tone === "warning"
                          ? "border-amber-200 bg-amber-50"
                          : "border-foreground/10 bg-[linear-gradient(180deg,#fff,#f8fafc)]",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {item.tone === "warning" ? (
                          <TriangleAlert className="mt-0.5 size-4 text-amber-600" />
                        ) : (
                          <Lightbulb className="mt-0.5 size-4 text-emerald-600" />
                        )}
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 text-muted-foreground text-sm">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <AdditionalPanelEmpty
                  title="Insight belum tersedia"
                  description="Data pada periode aktif masih terlalu sedikit untuk dirangkum otomatis."
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-foreground/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="size-5 text-emerald-600" />
                Data Quality
              </CardTitle>
              <CardDescription>
                Kualitas dan cakupan scrape untuk membantu membaca tingkat kepercayaan dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {healthSummary ? (
                <>
                  <div
                    className={cn(
                      "rounded-2xl border px-4 py-3",
                      healthSummary.tone === "healthy" && "border-emerald-200 bg-emerald-50 text-emerald-800",
                      healthSummary.tone === "partial" && "border-amber-200 bg-amber-50 text-amber-800",
                      healthSummary.tone === "warning" && "border-rose-200 bg-rose-50 text-rose-800",
                    )}
                  >
                    <p className="font-medium">{healthSummary.title}</p>
                    <p className="mt-1 text-sm opacity-80">{healthSummary.description}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-foreground/10 bg-muted/15 p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Last Sync</p>
                      <p className="mt-2 font-semibold">{formatDateTime(data.latest_scraped_at)}</p>
                    </div>
                    <div className="rounded-2xl border border-foreground/10 bg-muted/15 p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Coverage</p>
                      <p className="mt-2 font-semibold">
                        {healthSummary.activePlatformCount}/{MONITORING_PLATFORMS.length} platform
                      </p>
                    </div>
                    <div className="rounded-2xl border border-foreground/10 bg-muted/15 p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Hari Scrape</p>
                      <p className="mt-2 font-semibold">{formatNumber(healthSummary.scrapeDayCount)} hari</p>
                    </div>
                    <div className="rounded-2xl border border-foreground/10 bg-muted/15 p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Sampel Ranking</p>
                      <p className="mt-2 font-semibold">
                        {data.top_posts.length} post / {data.top_comments.length} comment
                      </p>
                    </div>
                  </div>

                  {healthSummary.missingPlatforms.length > 0 ? (
                    <div className="rounded-2xl border border-foreground/20 border-dashed px-4 py-3 text-sm">
                      <p className="font-medium">Platform belum teramati penuh</p>
                      <p className="mt-1 text-muted-foreground">
                        {healthSummary.missingPlatforms.map((platform) => formatPlatformLabel(platform)).join(", ")}
                      </p>
                    </div>
                  ) : null}
                </>
              ) : (
                <AdditionalPanelEmpty
                  title="Status scrape belum tersedia"
                  description="Metadata sinkronisasi belum bisa dirangkum pada periode ini."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <MonitoringSosmedAreaChart items={data.daily_platform_area} />

        <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
          <MonitoringSosmedPlatformBarChart items={data.platform_average_bar} />
          <MonitoringSosmedPlatformRadarChart
            items={data.platform_content_radar}
            periodLabel={data.selected_period.label}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-foreground/10">
            <CardHeader>
              <CardTitle className="text-xl">Breakdown Kontribusi Performa</CardTitle>
              <CardDescription>
                Konteks tambahan untuk melihat distribusi kontribusi views, engagement, dan konsentrasi akun.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {platformTotals.length > 0 || data.top_accounts.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="space-y-3 rounded-3xl border border-foreground/10 bg-muted/10 p-4">
                    <div>
                      <p className="font-medium">Kontribusi Views per Platform</p>
                      <p className="text-muted-foreground text-sm">Berdasarkan seluruh data pada periode aktif.</p>
                    </div>
                    {platformTotals
                      .slice()
                      .sort((left, right) => right.views - left.views)
                      .slice(0, 4)
                      .map((item) => {
                        const share = safeDivide(item.views, totalViews) * 100;

                        return (
                          <div key={`views-${item.platform}`} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium">{formatPlatformLabel(item.platform)}</span>
                              <span className="text-muted-foreground">{formatPercent(share)}</span>
                            </div>
                            <Progress value={share} className="h-2" />
                            <p className="text-muted-foreground text-xs">{formatCompact(item.views)} views</p>
                          </div>
                        );
                      })}
                  </div>

                  <div className="space-y-3 rounded-3xl border border-foreground/10 bg-muted/10 p-4">
                    <div>
                      <p className="font-medium">Kontribusi Engagement per Platform</p>
                      <p className="text-muted-foreground text-sm">Likes + comments + reposts pada periode aktif.</p>
                    </div>
                    {platformTotals
                      .slice()
                      .sort(
                        (left, right) =>
                          right.likes + right.comments + right.reposts - (left.likes + left.comments + left.reposts),
                      )
                      .slice(0, 4)
                      .map((item) => {
                        const engagementTotal = item.likes + item.comments + item.reposts;
                        const share = safeDivide(engagementTotal, totalEngagement) * 100;

                        return (
                          <div key={`engagement-${item.platform}`} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium">{formatPlatformLabel(item.platform)}</span>
                              <span className="text-muted-foreground">{formatPercent(share)}</span>
                            </div>
                            <Progress value={share} className="h-2" />
                            <p className="text-muted-foreground text-xs">{formatCompact(engagementTotal)} interaksi</p>
                          </div>
                        );
                      })}
                  </div>

                  <div className="space-y-3 rounded-3xl border border-foreground/10 bg-muted/10 p-4">
                    <div>
                      <p className="font-medium">Share Top Akun terhadap Total Views</p>
                      <p className="text-muted-foreground text-sm">
                        Menggunakan total views dashboard sebagai pembanding.
                      </p>
                    </div>
                    {data.top_accounts.length > 0 ? (
                      data.top_accounts
                        .slice()
                        .sort((left, right) => right.total_views - left.total_views)
                        .slice(0, 4)
                        .map((account) => {
                          const share = safeDivide(account.total_views, data.stats.total_views) * 100;

                          return (
                            <div key={account.id} className="space-y-1.5">
                              <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="font-medium">{account.profile_name}</span>
                                <span className="text-muted-foreground">{formatPercent(share)}</span>
                              </div>
                              <Progress value={share} className="h-2" />
                              <p className="text-muted-foreground text-xs">
                                {formatCompact(account.total_views)} views
                              </p>
                            </div>
                          );
                        })
                    ) : (
                      <AdditionalPanelEmpty
                        title="Belum ada akun untuk dihitung"
                        description="Belum ada akun yang memiliki kontribusi cukup untuk diringkas pada periode aktif."
                      />
                    )}
                  </div>
                </div>
              ) : (
                <AdditionalPanelEmpty
                  title="Breakdown belum tersedia"
                  description="Data pada periode aktif belum cukup untuk menghitung kontribusi performa."
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-foreground/10">
            <CardHeader>
              <CardTitle className="text-xl">Rekomendasi Operasional</CardTitle>
              <CardDescription>
                Saran singkat berbasis data untuk membantu fokus monitoring periode berjalan dan berikutnya.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {operationalRecommendations.length > 0 ? (
                <div className="space-y-3">
                  {operationalRecommendations.map((item, index) => (
                    <div
                      key={`${index + 1}-${item}`}
                      className="flex gap-3 rounded-2xl border border-foreground/10 bg-[linear-gradient(180deg,#fff,#f8fafc)] p-4"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 font-semibold text-emerald-700">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6">{item}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <AdditionalPanelEmpty
                  title="Belum ada rekomendasi"
                  description="Dashboard membutuhkan data yang lebih kaya untuk menghasilkan rekomendasi operasional."
                />
              )}
            </CardContent>
          </Card>
        </div>

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
                    className="space-y-4 rounded-3xl border border-foreground/10 bg-[linear-gradient(180deg,#fff,#f8fafc)] p-5 shadow-sm"
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
                <div
                  key={comment.id}
                  className="space-y-3 rounded-2xl border border-foreground/10 bg-[linear-gradient(180deg,#fff,#f8fafc)] p-4"
                >
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
              Urutan akun berdasarkan views, posting, followers, dan engagement rate dari hasil scrape.
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
    </TooltipProvider>
  );
}
