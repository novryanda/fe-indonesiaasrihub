"use client";

import { useMemo } from "react";

import { CircleHelp, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceDot, ReferenceLine, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import type {
  MonitoringDailyPlatformAreaItem,
  MonitoringPlatform,
} from "@/features/monitoring-sosmed/types/monitoring-sosmed.type";

const compactNumberFormatter = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });
const PLATFORMS: MonitoringPlatform[] = ["instagram", "tiktok", "youtube", "facebook", "x"];

const PLATFORM_COLORS: Record<MonitoringPlatform, string> = {
  instagram: "#e11d48",
  tiktok: "#0891b2",
  youtube: "#dc2626",
  facebook: "#2563eb",
  x: "#334155",
};

const areaChartConfig = {
  instagram: { label: "Instagram", color: PLATFORM_COLORS.instagram },
  tiktok: { label: "TikTok", color: PLATFORM_COLORS.tiktok },
  youtube: { label: "YouTube", color: PLATFORM_COLORS.youtube },
  facebook: { label: "Facebook", color: PLATFORM_COLORS.facebook },
  x: { label: "X", color: PLATFORM_COLORS.x },
} satisfies ChartConfig;

function formatCompact(value: number) {
  return compactNumberFormatter.format(value);
}

function buildAreaRows(items: MonitoringDailyPlatformAreaItem[]) {
  return items.map((item) => {
    const row: Record<string, string | number> = {
      date: item.period_date,
    };

    for (const platform of PLATFORMS) {
      row[platform] = 0;
    }

    for (const metric of item.platform_metrics) {
      row[metric.platform] = metric.views;
    }

    return row;
  });
}

export function MonitoringSosmedAreaChart({ items }: { items: MonitoringDailyPlatformAreaItem[] }) {
  const rows = useMemo(() => buildAreaRows(items), [items]);

  const platformSummary = useMemo(
    () =>
      PLATFORMS.map((platform) => {
        const totals = items.reduce(
          (sum, item) => {
            const metric = item.platform_metrics.find((entry) => entry.platform === platform);

            return {
              views: sum.views + (metric?.views ?? 0),
              likes: sum.likes + (metric?.likes ?? 0),
              comments: sum.comments + (metric?.comments ?? 0),
            };
          },
          { views: 0, likes: 0, comments: 0 },
        );

        return {
          platform,
          ...totals,
        };
      }).filter((item) => item.views > 0 || item.likes > 0 || item.comments > 0),
    [items],
  );

  const hasData = platformSummary.length > 0;
  const peakViewsDay = useMemo(
    () =>
      items
        .map((item) => ({
          date: item.period_date,
          totalViews: item.platform_metrics.reduce((sum, metric) => sum + metric.views, 0),
          totalComments: item.platform_metrics.reduce((sum, metric) => sum + metric.comments, 0),
          peakMetric: [...item.platform_metrics].sort((left, right) => right.views - left.views)[0] ?? null,
        }))
        .sort((left, right) => right.totalViews - left.totalViews)[0] ?? null,
    [items],
  );
  const peakCommentsDay = useMemo(
    () =>
      items
        .map((item) => ({
          date: item.period_date,
          totalComments: item.platform_metrics.reduce((sum, metric) => sum + metric.comments, 0),
        }))
        .sort((left, right) => right.totalComments - left.totalComments)[0] ?? null,
    [items],
  );

  return (
    <Card className="border-foreground/10 pt-0">
      <CardHeader className="border-b py-4">
        <div className="grid gap-1">
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="size-5 text-emerald-600" />
            Area Views per Platform
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground transition hover:text-foreground">
                    <CircleHelp className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-64 leading-5">
                  Menampilkan tren views per platform berdasarkan tanggal scrape. Garis putus-putus menandai hari dengan
                  total views tertinggi.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Tren total views per tanggal scrape. Ringkasan views, likes, dan comments tiap platform ditampilkan di atas
            chart.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-3 py-4 sm:px-5 sm:py-5">
        {hasData ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {platformSummary.map((item) => (
                <div key={item.platform} className="rounded-2xl border border-foreground/10 bg-muted/15 p-3.5">
                  <p className="font-medium" style={{ color: PLATFORM_COLORS[item.platform] }}>
                    {formatPlatformLabel(item.platform)}
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      Views: <span className="font-semibold text-foreground">{formatCompact(item.views)}</span>
                    </p>
                    <p>
                      Likes: <span className="font-semibold text-foreground">{formatCompact(item.likes)}</span>
                    </p>
                    <p>
                      Comments: <span className="font-semibold text-foreground">{formatCompact(item.comments)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {peakViewsDay ? (
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700 text-sm">
                  Peak views:{" "}
                  {new Date(peakViewsDay.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} •{" "}
                  {formatCompact(peakViewsDay.totalViews)}
                </div>
              ) : null}
              {peakCommentsDay ? (
                <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700 text-sm">
                  Peak comments:{" "}
                  {new Date(peakCommentsDay.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} •{" "}
                  {formatCompact(peakCommentsDay.totalComments)}
                </div>
              ) : null}
            </div>

            <ChartContainer config={areaChartConfig} className="h-[260px] w-full md:h-[300px] xl:h-[320px]">
              <AreaChart data={rows}>
                <defs>
                  {PLATFORMS.map((platform) => (
                    <linearGradient key={platform} id={`fill-${platform}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={`var(--color-${platform})`} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={`var(--color-${platform})`} stopOpacity={0.08} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} />
                <YAxis tickLine={false} axisLine={false} width={56} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                  tickFormatter={(value) =>
                    new Date(String(value)).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={(value) =>
                        new Date(String(value)).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      }
                    />
                  }
                />
                {peakViewsDay ? (
                  <ReferenceLine
                    x={peakViewsDay.date}
                    stroke="#059669"
                    strokeDasharray="4 4"
                    label={{ value: "Peak Views", position: "insideTopRight", fill: "#059669", fontSize: 12 }}
                  />
                ) : null}
                {peakViewsDay?.peakMetric ? (
                  <ReferenceDot
                    x={peakViewsDay.date}
                    y={peakViewsDay.peakMetric.views}
                    r={5}
                    fill={PLATFORM_COLORS[peakViewsDay.peakMetric.platform]}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ) : null}
                {PLATFORMS.map((platform) => (
                  <Area
                    key={platform}
                    dataKey={platform}
                    type="natural"
                    fill={`url(#fill-${platform})`}
                    stroke={`var(--color-${platform})`}
                    strokeWidth={2}
                    fillOpacity={1}
                    connectNulls
                  />
                ))}
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="rounded-3xl border border-foreground/20 border-dashed p-8 text-center text-muted-foreground">
            Belum ada data scrape harian pada periode ini.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
