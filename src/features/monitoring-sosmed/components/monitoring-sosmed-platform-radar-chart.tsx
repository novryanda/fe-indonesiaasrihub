"use client";

import { useMemo } from "react";

import { CircleHelp } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  MonitoringPlatform,
  MonitoringPlatformContentRadarItem,
} from "@/features/monitoring-sosmed/types/monitoring-sosmed.type";

const PLATFORM_COLORS: Record<MonitoringPlatform, string> = {
  instagram: "#e11d48",
  tiktok: "#0891b2",
  youtube: "#dc2626",
  facebook: "#2563eb",
  x: "#334155",
};

export function MonitoringSosmedPlatformRadarChart({
  items,
  periodLabel,
}: {
  items: MonitoringPlatformContentRadarItem[];
  periodLabel: string;
}) {
  const activeItems = useMemo(
    () => items.filter((item) => item.views > 0 || item.likes > 0 || item.comments > 0),
    [items],
  );

  const chartConfig = useMemo(
    () =>
      Object.fromEntries(
        activeItems.map((item) => [
          item.platform,
          {
            label: formatPlatformLabel(item.platform),
            color: PLATFORM_COLORS[item.platform],
          },
        ]),
      ) as ChartConfig,
    [activeItems],
  );

  const radarRows = useMemo(
    () => [
      Object.assign(
        { metric: "Views" },
        ...activeItems.map((item) => ({
          [item.platform]: item.views,
        })),
      ),
      Object.assign(
        { metric: "Likes" },
        ...activeItems.map((item) => ({
          [item.platform]: item.likes,
        })),
      ),
      Object.assign(
        { metric: "Comments" },
        ...activeItems.map((item) => ({
          [item.platform]: item.comments,
        })),
      ),
    ],
    [activeItems],
  );

  const topPlatform = useMemo(
    () =>
      [...activeItems].sort((left, right) => {
        if (right.views !== left.views) {
          return right.views - left.views;
        }
        if (right.likes !== left.likes) {
          return right.likes - left.likes;
        }

        return right.comments - left.comments;
      })[0] ?? null,
    [activeItems],
  );

  return (
    <Card className="border-foreground/10">
      <CardHeader className="items-center pb-2">
        <CardTitle className="flex items-center gap-2">
          Radar Distribusi Konten per Platform
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground transition hover:text-foreground">
                  <CircleHelp className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-64 leading-5">
                Memetakan distribusi views, likes, dan comments tiap platform dalam satu radar agar mudah dibandingkan.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Satu radar chart dengan axis views, likes, dan comments. Setiap platform divisualkan sebagai satu series.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-1">
        {activeItems.length > 0 ? (
          <ChartContainer config={chartConfig} className="mx-auto h-[250px] w-full max-w-[340px] md:h-[270px]">
            <RadarChart data={radarRows} outerRadius="70%">
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <PolarAngleAxis dataKey="metric" />
              <PolarGrid />
              {activeItems.map((item) => (
                <Radar
                  key={item.platform}
                  dataKey={item.platform}
                  fill={`var(--color-${item.platform})`}
                  stroke={`var(--color-${item.platform})`}
                  fillOpacity={0.14}
                  dot={{
                    r: 4,
                    fillOpacity: 1,
                  }}
                />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </RadarChart>
          </ChartContainer>
        ) : (
          <div className="rounded-3xl border border-foreground/20 border-dashed p-8 text-center text-muted-foreground">
            Belum ada distribusi scrape per platform pada periode ini.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-1 pt-1 text-sm">
        <div className="font-medium leading-none">
          Platform dominan: {topPlatform ? formatPlatformLabel(topPlatform.platform) : "Belum ada data"}
        </div>
        <div className="text-muted-foreground leading-none">{periodLabel}</div>
      </CardFooter>
    </Card>
  );
}
