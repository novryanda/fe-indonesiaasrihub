"use client";

import { BarChart3, CircleHelp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
import type { MonitoringPlatformAverageBarItem } from "@/features/monitoring-sosmed/types/monitoring-sosmed.type";

const barChartConfig = {
  avgLikes: { label: "Avg Likes", color: "#2563eb" },
  avgComments: { label: "Avg Comments", color: "#14b8a6" },
} satisfies ChartConfig;

export function MonitoringSosmedPlatformBarChart({ items }: { items: MonitoringPlatformAverageBarItem[] }) {
  const chartData = items.map((item) => ({
    platform: formatPlatformLabel(item.platform),
    avgLikes: item.avg_likes_per_post,
    avgComments: item.avg_comments_per_post,
  }));

  const hasData = items.some((item) => item.total_posting > 0);
  const chartHeightClass = chartData.length > 2 ? "h-[250px] w-full md:h-[270px]" : "h-[220px] w-full";

  return (
    <Card className="border-foreground/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <BarChart3 className="size-5 text-blue-600" />
          Average Like dan Comment per Platform
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground transition hover:text-foreground">
                  <CircleHelp className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-64 leading-5">
                Menampilkan rata-rata likes dan comments per posting pada tiap platform untuk periode terpilih.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Rata-rata capaian likes dan comments per posting dari hasil scrape periode terpilih.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        {hasData ? (
          <ChartContainer config={barChartConfig} className={chartHeightClass}>
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{
                left: 8,
                right: 12,
              }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis dataKey="platform" type="category" tickLine={false} tickMargin={10} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="avgLikes" fill="var(--color-avgLikes)" radius={6} maxBarSize={28} />
              <Bar dataKey="avgComments" fill="var(--color-avgComments)" radius={6} maxBarSize={28} />
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="rounded-3xl border border-foreground/20 border-dashed p-8 text-center text-muted-foreground">
            Belum ada rata-rata like dan comment hasil scrape pada periode ini.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
