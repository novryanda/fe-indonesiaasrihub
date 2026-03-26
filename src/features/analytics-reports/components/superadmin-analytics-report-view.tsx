"use client";

import { useEffect, useMemo, useState } from "react";

import { Activity, Clock3, Trophy, Users2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import {
  getKpiSummary,
  getRegionalLeaderboard,
  getRegionalTrend,
  getSocialAccountLeaderboard,
} from "../api/analytics-report-api";
import type {
  AnalyticsFilterParams,
  RegionalLeaderboardRow,
  RegionalTrendPoint,
  SocialAccountLeaderboardRow,
} from "../types/analytics-report.type";
import {
  AnalyticsFiltersBar,
  ErrorAlert,
  formatCompactNumber,
  formatPercent,
  formatScoreColor,
  KpiCardsSkeleton,
  medalLabel,
  PlatformPill,
  ScoreProgress,
  SortHeader,
  TrendBadge,
} from "./report-ui";

const REGION_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#db2777", "#7c3aed", "#0f766e", "#ea580c", "#0891b2"];

type RegionalSortKey = "rank" | "wilayah_nama" | "score_timeliness" | "score_engagement" | "score_final";

type AccountSortKey =
  | "rank"
  | "platform"
  | "username"
  | "picName"
  | "wilayahNama"
  | "views"
  | "likes"
  | "comments"
  | "shares"
  | "reposts"
  | "engagementRate"
  | "scoreFinal";

const now = new Date();

const defaultFilters: AnalyticsFilterParams = {
  month: now.getMonth() + 1,
  year: now.getFullYear(),
};

function isCurrentSelectedPeriod(filters: AnalyticsFilterParams) {
  return filters.month === now.getMonth() + 1 && filters.year === now.getFullYear();
}

function compareNumbers(left: number, right: number, direction: "asc" | "desc") {
  return direction === "asc" ? left - right : right - left;
}

function compareStrings(left: string, right: string, direction: "asc" | "desc") {
  return direction === "asc" ? left.localeCompare(right, "id") : right.localeCompare(left, "id");
}

function getKpiCardTone(key: string) {
  switch (key) {
    case "total_regional_aktif":
      return {
        icon: Users2,
        iconClassName: "text-emerald-600",
      };
    case "avg_national_score":
      return {
        icon: Activity,
        iconClassName: "text-blue-600",
      };
    case "best_regional":
      return {
        icon: Trophy,
        iconClassName: "text-amber-500",
      };
    case "national_on_time_rate":
      return {
        icon: Clock3,
        iconClassName: "text-cyan-600",
      };
    default:
      return {
        icon: Activity,
        iconClassName: "text-slate-500",
      };
  }
}

export function SuperadminAnalyticsReportView() {
  const { isAuthorized, isPending } = useRoleGuard(["superadmin"]);
  const [filters, setFilters] = useState<AnalyticsFilterParams>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState<Awaited<ReturnType<typeof getKpiSummary>>["data"] | null>(null);
  const [regionalRows, setRegionalRows] = useState<RegionalLeaderboardRow[]>([]);
  const [socialRows, setSocialRows] = useState<SocialAccountLeaderboardRow[]>([]);
  const [trendRows, setTrendRows] = useState<RegionalTrendPoint[]>([]);
  const [regionalSort, setRegionalSort] = useState<{
    key: RegionalSortKey;
    direction: "asc" | "desc";
  }>({ key: "score_final", direction: "desc" });
  const [accountSort, setAccountSort] = useState<{
    key: AccountSortKey;
    direction: "asc" | "desc";
  }>({ key: "scoreFinal", direction: "desc" });
  const [regionalPage, setRegionalPage] = useState(1);
  const [accountPage, setAccountPage] = useState(1);
  const [accountRegionFilter, setAccountRegionFilter] = useState<string>("all");
  const [accountPlatformFilter, setAccountPlatformFilter] = useState<string>("all");
  const [barVisibility, setBarVisibility] = useState({
    timeliness: true,
    engagement: true,
    final: true,
  });
  const [hiddenRegions, setHiddenRegions] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthorized || isPending) {
      return;
    }

    setLoading(true);
    setError(null);

    void Promise.all([
      getKpiSummary(filters),
      getRegionalLeaderboard(filters),
      getSocialAccountLeaderboard(filters),
      getRegionalTrend(filters),
    ])
      .then(([kpi, regional, social, trend]) => {
        setKpiData(kpi.data);
        setRegionalRows(Array.isArray(regional.data) ? regional.data : []);
        setSocialRows(Array.isArray(social.data) ? social.data : []);
        setTrendRows(Array.isArray(trend.data) ? trend.data : []);
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Gagal memuat laporan analitik.");
      })
      .finally(() => setLoading(false));
  }, [filters, isAuthorized, isPending]);

  const sortedRegionalRows = useMemo(() => {
    return [...regionalRows].sort((left, right) => {
      switch (regionalSort.key) {
        case "rank":
          return compareNumbers(left.rank, right.rank, regionalSort.direction);
        case "wilayah_nama":
          return compareStrings(left.wilayah_nama, right.wilayah_nama, regionalSort.direction);
        case "score_timeliness":
          return compareNumbers(left.score_timeliness, right.score_timeliness, regionalSort.direction);
        case "score_engagement":
          return compareNumbers(left.score_engagement, right.score_engagement, regionalSort.direction);
        default:
          return compareNumbers(left.score_final, right.score_final, regionalSort.direction);
      }
    });
  }, [regionalRows, regionalSort]);

  const pagedRegionalRows = useMemo(() => {
    return sortedRegionalRows.slice((regionalPage - 1) * 10, regionalPage * 10);
  }, [regionalPage, sortedRegionalRows]);

  const filteredSocialRows = useMemo(() => {
    return socialRows.filter((row) => {
      if (accountRegionFilter !== "all" && row.wilayahNama !== accountRegionFilter) {
        return false;
      }

      if (accountPlatformFilter !== "all" && row.platform !== accountPlatformFilter) {
        return false;
      }

      return true;
    });
  }, [accountPlatformFilter, accountRegionFilter, socialRows]);

  const sortedSocialRows = useMemo(() => {
    return [...filteredSocialRows].sort((left, right) => {
      switch (accountSort.key) {
        case "rank":
          return compareNumbers(left.rank, right.rank, accountSort.direction);
        case "platform":
          return compareStrings(left.platform, right.platform, accountSort.direction);
        case "username":
          return compareStrings(left.username, right.username, accountSort.direction);
        case "picName":
          return compareStrings(left.picName, right.picName, accountSort.direction);
        case "wilayahNama":
          return compareStrings(left.wilayahNama, right.wilayahNama, accountSort.direction);
        case "views":
          return compareNumbers(left.views, right.views, accountSort.direction);
        case "likes":
          return compareNumbers(left.likes, right.likes, accountSort.direction);
        case "comments":
          return compareNumbers(left.comments, right.comments, accountSort.direction);
        case "shares":
          return compareNumbers(left.shares, right.shares, accountSort.direction);
        case "reposts":
          return compareNumbers(left.reposts, right.reposts, accountSort.direction);
        case "engagementRate":
          return compareNumbers(left.engagementRate, right.engagementRate, accountSort.direction);
        default:
          return compareNumbers(left.scoreFinal, right.scoreFinal, accountSort.direction);
      }
    });
  }, [accountSort, filteredSocialRows]);

  const pagedSocialRows = useMemo(() => {
    return sortedSocialRows.slice((accountPage - 1) * 10, accountPage * 10);
  }, [accountPage, sortedSocialRows]);

  const barChartRows = useMemo(
    () =>
      [...regionalRows]
        .sort((left, right) => right.score_final - left.score_final)
        .map((item) => ({
          wilayah_nama: item.wilayah_nama,
          score_timeliness: item.score_timeliness,
          score_engagement: item.score_engagement,
          score_final: item.score_final,
        })),
    [regionalRows],
  );

  const nationalAverage = useMemo(() => {
    if (regionalRows.length === 0) {
      return 0;
    }

    return regionalRows.reduce((sum, item) => sum + item.score_final, 0) / regionalRows.length;
  }, [regionalRows]);

  const trendChartData = useMemo(() => {
    const regionNames = Array.from(
      new Set(trendRows.flatMap((item) => item.regions.map((region) => region.wilayah_nama))),
    );

    return trendRows.map((item) => {
      const row: Record<string, string | number> = {
        period_label: item.period_label,
      };

      for (const regionName of regionNames) {
        const found = item.regions.find((region) => region.wilayah_nama === regionName);
        row[regionName] = found?.score_final ?? 0;
      }

      return row;
    });
  }, [trendRows]);

  const trendLegendItems = useMemo(
    () => Array.from(new Set(trendRows.flatMap((item) => item.regions.map((region) => region.wilayah_nama)))),
    [trendRows],
  );

  if (isPending) {
    return <KpiCardsSkeleton />;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-6">
      <AnalyticsFiltersBar
        title="Laporan Analitik Nasional"
        description="Bandingkan performa seluruh regional, akun sosial media, dan tren skor final lintas periode dari sudut pandang superadmin."
        filters={filters}
        generatedAt={kpiData?.generatedAt}
        showRealtimeNote={isCurrentSelectedPeriod(filters)}
        onChange={(next) => {
          setFilters(next);
          setRegionalPage(1);
          setAccountPage(1);
        }}
      />

      {error ? <ErrorAlert message={error} /> : null}

      {loading || !kpiData ? (
        <KpiCardsSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpiData.cards.map((card) => (
            <Card key={card.key} className="border-foreground/10 shadow-sm">
              <CardContent className="space-y-4 py-6">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-muted-foreground text-sm">{card.label}</p>
                  {(() => {
                    const { icon: Icon, iconClassName } = getKpiCardTone(card.key);

                    return <Icon className={`size-5 ${iconClassName}`} />;
                  })()}
                </div>
                <p className="font-semibold text-3xl tracking-tight">
                  {card.label.includes("Rate") || card.label.includes("Skor")
                    ? formatPercent(card.value)
                    : formatCompactNumber(card.value)}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-muted-foreground text-sm">{card.subtitle}</p>
                  {card.trend ? <TrendBadge direction={card.trend.direction} delta={card.trend.delta} /> : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-foreground/10 shadow-sm">
        <CardHeader>
          <CardTitle>Regional Leaderboard</CardTitle>
          <CardDescription>Ranking semua regional berdasarkan skor performa pada periode terpilih.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortHeader
                    label="Rank"
                    active={regionalSort.key === "rank"}
                    direction={regionalSort.direction}
                    onClick={() =>
                      setRegionalSort((current) => ({
                        key: "rank",
                        direction: current.key === "rank" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Regional"
                    active={regionalSort.key === "wilayah_nama"}
                    direction={regionalSort.direction}
                    onClick={() =>
                      setRegionalSort((current) => ({
                        key: "wilayah_nama",
                        direction: current.key === "wilayah_nama" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Skor Waktu"
                    active={regionalSort.key === "score_timeliness"}
                    direction={regionalSort.direction}
                    onClick={() =>
                      setRegionalSort((current) => ({
                        key: "score_timeliness",
                        direction: current.key === "score_timeliness" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Skor Engagement"
                    active={regionalSort.key === "score_engagement"}
                    direction={regionalSort.direction}
                    onClick={() =>
                      setRegionalSort((current) => ({
                        key: "score_engagement",
                        direction: current.key === "score_engagement" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Skor Final"
                    active={regionalSort.key === "score_final"}
                    direction={regionalSort.direction}
                    onClick={() =>
                      setRegionalSort((current) => ({
                        key: "score_final",
                        direction: current.key === "score_final" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Total Posting</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRegionalRows.map((row) => (
                <TableRow key={row.wilayah_id}>
                  <TableCell>{medalLabel(row.rank)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{row.wilayah_nama}</p>
                      <p className="text-muted-foreground text-xs">{row.wilayah_kode}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ScoreProgress value={row.score_timeliness} />
                  </TableCell>
                  <TableCell>
                    <ScoreProgress value={row.score_engagement} />
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${formatScoreColor(row.score_final)}`}>
                      {formatPercent(row.score_final)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <TrendBadge direction={row.trend.direction} delta={row.trend.delta} />
                  </TableCell>
                  <TableCell>{row.total_posting.label}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Halaman {regionalPage} dari {Math.max(1, Math.ceil(sortedRegionalRows.length / 10))}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={regionalPage === 1}
                onClick={() => setRegionalPage((value) => value - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={regionalPage >= Math.ceil(sortedRegionalRows.length / 10)}
                onClick={() => setRegionalPage((value) => value + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-foreground/10 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Bar Chart Perbandingan Regional</CardTitle>
            <CardDescription>Bandingkan skor waktu, engagement, dan final seluruh regional.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={barVisibility.timeliness ? "default" : "outline"}
              onClick={() => setBarVisibility((current) => ({ ...current, timeliness: !current.timeliness }))}
            >
              Skor Waktu
            </Button>
            <Button
              size="sm"
              variant={barVisibility.engagement ? "default" : "outline"}
              onClick={() => setBarVisibility((current) => ({ ...current, engagement: !current.engagement }))}
            >
              Skor Engagement
            </Button>
            <Button
              size="sm"
              variant={barVisibility.final ? "default" : "outline"}
              onClick={() => setBarVisibility((current) => ({ ...current, final: !current.final }))}
            >
              Skor Final
            </Button>
          </div>
        </CardHeader>
        <CardContent className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartRows} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="wilayah_nama" type="category" width={120} />
              <Tooltip />
              <Legend />
              <ReferenceLine x={nationalAverage} stroke="#64748b" strokeDasharray="5 5" label="Rata-rata nasional" />
              {barVisibility.timeliness ? (
                <Bar dataKey="score_timeliness" name="Skor Waktu" fill="#2563eb" radius={6} />
              ) : null}
              {barVisibility.engagement ? (
                <Bar dataKey="score_engagement" name="Skor Engagement" fill="#16a34a" radius={6} />
              ) : null}
              {barVisibility.final ? <Bar dataKey="score_final" name="Skor Final" fill="#7c3aed" radius={6} /> : null}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-foreground/10 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Social Account Leaderboard</CardTitle>
            <CardDescription>
              Semua akun sosial media lintas regional dengan metrik engagement dan skor final.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select
              value={accountPlatformFilter}
              onValueChange={(value) => {
                setAccountPlatformFilter(value);
                setAccountPage(1);
              }}
            >
              <SelectTrigger className="min-w-44 bg-white">
                <SelectValue placeholder="Semua Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Platform</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="x">X</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={accountRegionFilter}
              onValueChange={(value) => {
                setAccountRegionFilter(value);
                setAccountPage(1);
              }}
            >
              <SelectTrigger className="min-w-44 bg-white">
                <SelectValue placeholder="Semua Regional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Regional</SelectItem>
                {regionalRows.map((row) => (
                  <SelectItem key={row.wilayah_id} value={row.wilayah_nama}>
                    {row.wilayah_nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortHeader
                    label="Rank"
                    active={accountSort.key === "rank"}
                    direction={accountSort.direction}
                    onClick={() =>
                      setAccountSort((current) => ({
                        key: "rank",
                        direction: current.key === "rank" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Platform"
                    active={accountSort.key === "platform"}
                    direction={accountSort.direction}
                    onClick={() =>
                      setAccountSort((current) => ({
                        key: "platform",
                        direction: current.key === "platform" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Username"
                    active={accountSort.key === "username"}
                    direction={accountSort.direction}
                    onClick={() =>
                      setAccountSort((current) => ({
                        key: "username",
                        direction: current.key === "username" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Nama PIC"
                    active={accountSort.key === "picName"}
                    direction={accountSort.direction}
                    onClick={() =>
                      setAccountSort((current) => ({
                        key: "picName",
                        direction: current.key === "picName" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Regional"
                    active={accountSort.key === "wilayahNama"}
                    direction={accountSort.direction}
                    onClick={() =>
                      setAccountSort((current) => ({
                        key: "wilayahNama",
                        direction: current.key === "wilayahNama" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>Views / Likes / Comments / Shares / Reposts</TableHead>
                <TableHead>
                  <SortHeader
                    label="Engagement"
                    active={accountSort.key === "engagementRate"}
                    direction={accountSort.direction}
                    onClick={() =>
                      setAccountSort((current) => ({
                        key: "engagementRate",
                        direction: current.key === "engagementRate" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Skor Final"
                    active={accountSort.key === "scoreFinal"}
                    direction={accountSort.direction}
                    onClick={() =>
                      setAccountSort((current) => ({
                        key: "scoreFinal",
                        direction: current.key === "scoreFinal" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedSocialRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{medalLabel(row.rank)}</TableCell>
                  <TableCell>
                    <PlatformPill platform={row.platform} />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{row.username}</p>
                      <p className="text-muted-foreground text-xs">{row.profileName}</p>
                    </div>
                  </TableCell>
                  <TableCell>{row.picName}</TableCell>
                  <TableCell>{row.wilayahNama}</TableCell>
                  <TableCell className="text-xs">
                    {formatCompactNumber(row.views)} / {formatCompactNumber(row.likes)} /{" "}
                    {formatCompactNumber(row.comments)} / {formatCompactNumber(row.shares)} /{" "}
                    {formatCompactNumber(row.reposts)}
                  </TableCell>
                  <TableCell>{formatPercent(row.engagementRate)}</TableCell>
                  <TableCell>
                    <span className={`font-semibold ${formatScoreColor(row.scoreFinal)}`}>
                      {formatPercent(row.scoreFinal)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Halaman {accountPage} dari {Math.max(1, Math.ceil(sortedSocialRows.length / 10))}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={accountPage === 1}
                onClick={() => setAccountPage((value) => value - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={accountPage >= Math.ceil(sortedSocialRows.length / 10)}
                onClick={() => setAccountPage((value) => value + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-foreground/10 shadow-sm">
        <CardHeader>
          <CardTitle>Trend Line Chart Regional</CardTitle>
          <CardDescription>Tren skor final lintas regional pada bucket periode yang dipilih.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {trendLegendItems.map((region, index) => {
              const hidden = hiddenRegions.includes(region);
              return (
                <Button
                  key={region}
                  size="sm"
                  variant={hidden ? "outline" : "default"}
                  onClick={() =>
                    setHiddenRegions((current) =>
                      hidden ? current.filter((item) => item !== region) : [...current, region],
                    )
                  }
                >
                  <span
                    className="mr-2 inline-flex size-2.5 rounded-full"
                    style={{ backgroundColor: REGION_COLORS[index % REGION_COLORS.length] }}
                  />
                  {region}
                </Button>
              );
            })}
          </div>
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period_label" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                {trendLegendItems.map((region, index) =>
                  hiddenRegions.includes(region) ? null : (
                    <Line
                      key={region}
                      type="monotone"
                      dataKey={region}
                      stroke={REGION_COLORS[index % REGION_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ),
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
