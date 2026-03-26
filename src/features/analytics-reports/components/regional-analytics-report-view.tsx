"use client";

import { useEffect, useMemo, useState } from "react";

import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { getKpiSummary, getRegionalDetail, getWccLeaderboard } from "../api/analytics-report-api";
import type { AnalyticsFilterParams, WccLeaderboardRow } from "../types/analytics-report.type";
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

type PicSortKey = "rank" | "pic_name" | "views" | "engagement_rate" | "timeliness_rate" | "score_final";

type WccSortKey =
  | "rank"
  | "wccName"
  | "totalContentCreated"
  | "totalContentApproved"
  | "totalContentUsed"
  | "adoptionRate"
  | "totalViews"
  | "totalEngagement"
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

export function RegionalAnalyticsReportView() {
  const { isAuthorized, isPending } = useRoleGuard(["qcc_wcc"]);
  const [filters, setFilters] = useState<AnalyticsFilterParams>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState<Awaited<ReturnType<typeof getKpiSummary>>["data"] | null>(null);
  const [regionalDetail, setRegionalDetail] = useState<Awaited<ReturnType<typeof getRegionalDetail>>["data"] | null>(
    null,
  );
  const [wccRows, setWccRows] = useState<WccLeaderboardRow[]>([]);
  const [picPage, setPicPage] = useState(1);
  const [wccPage, setWccPage] = useState(1);
  const [picSort, setPicSort] = useState<{
    key: PicSortKey;
    direction: "asc" | "desc";
  }>({ key: "score_final", direction: "desc" });
  const [wccSort, setWccSort] = useState<{
    key: WccSortKey;
    direction: "asc" | "desc";
  }>({ key: "scoreFinal", direction: "desc" });

  useEffect(() => {
    if (!isAuthorized || isPending) {
      return;
    }

    setLoading(true);
    setError(null);

    void Promise.all([getKpiSummary(filters), getRegionalDetail(filters), getWccLeaderboard(filters)])
      .then(([kpi, detail, wcc]) => {
        setKpiData(kpi.data);
        setRegionalDetail(detail.data);
        setWccRows(Array.isArray(wcc.data) ? wcc.data : []);
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Gagal memuat laporan regional.");
      })
      .finally(() => setLoading(false));
  }, [filters, isAuthorized, isPending]);

  const sortedPicRows = useMemo(() => {
    const source = regionalDetail?.pic_leaderboard ?? [];
    return [...source].sort((left, right) => {
      switch (picSort.key) {
        case "rank":
          return compareNumbers(left.rank, right.rank, picSort.direction);
        case "pic_name":
          return compareStrings(left.pic_name, right.pic_name, picSort.direction);
        case "views":
          return compareNumbers(left.views, right.views, picSort.direction);
        case "engagement_rate":
          return compareNumbers(left.engagement_rate, right.engagement_rate, picSort.direction);
        case "timeliness_rate":
          return compareNumbers(left.timeliness_rate, right.timeliness_rate, picSort.direction);
        default:
          return compareNumbers(left.score_final, right.score_final, picSort.direction);
      }
    });
  }, [picSort, regionalDetail?.pic_leaderboard]);

  const pagedPics = useMemo(() => {
    return sortedPicRows.slice((picPage - 1) * 10, picPage * 10);
  }, [picPage, sortedPicRows]);

  const sortedWccRows = useMemo(() => {
    return [...wccRows].sort((left, right) => {
      switch (wccSort.key) {
        case "rank":
          return compareNumbers(left.rank, right.rank, wccSort.direction);
        case "wccName":
          return compareStrings(left.wccName, right.wccName, wccSort.direction);
        case "totalContentCreated":
          return compareNumbers(left.totalContentCreated, right.totalContentCreated, wccSort.direction);
        case "totalContentApproved":
          return compareNumbers(left.totalContentApproved, right.totalContentApproved, wccSort.direction);
        case "totalContentUsed":
          return compareNumbers(left.totalContentUsed, right.totalContentUsed, wccSort.direction);
        case "adoptionRate":
          return compareNumbers(left.adoptionRate, right.adoptionRate, wccSort.direction);
        case "totalViews":
          return compareNumbers(left.totalViews, right.totalViews, wccSort.direction);
        case "totalEngagement":
          return compareNumbers(left.totalEngagement, right.totalEngagement, wccSort.direction);
        default:
          return compareNumbers(left.scoreFinal, right.scoreFinal, wccSort.direction);
      }
    });
  }, [wccRows, wccSort]);

  const pagedWcc = useMemo(() => {
    return sortedWccRows.slice((wccPage - 1) * 10, wccPage * 10);
  }, [sortedWccRows, wccPage]);

  if (isPending) {
    return <KpiCardsSkeleton />;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-6">
      <AnalyticsFiltersBar
        title="Laporan Regional"
        description="Pantau performa PIC Sosmed dan kontribusi WCC untuk regional Anda sendiri, lengkap dengan konten teratas dan ketepatan waktu posting."
        filters={filters}
        generatedAt={kpiData?.generatedAt}
        showRealtimeNote={isCurrentSelectedPeriod(filters)}
        onChange={(next) => {
          setFilters(next);
          setPicPage(1);
          setWccPage(1);
        }}
      />

      {error ? <ErrorAlert message={error} /> : null}

      {loading || !kpiData ? (
        <KpiCardsSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpiData.cards.map((card) => (
            <Card key={card.key}>
              <CardContent className="space-y-3 py-6">
                <p className="text-muted-foreground text-sm">{card.label}</p>
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

      <Card>
        <CardHeader>
          <CardTitle>PIC Sosmed Leaderboard</CardTitle>
          <CardDescription>Ranking PIC Sosmed berdasarkan performa posting dan engagement regional.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortHeader
                    label="Rank"
                    active={picSort.key === "rank"}
                    direction={picSort.direction}
                    onClick={() =>
                      setPicSort((current) => ({
                        key: "rank",
                        direction: current.key === "rank" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Nama PIC"
                    active={picSort.key === "pic_name"}
                    direction={picSort.direction}
                    onClick={() =>
                      setPicSort((current) => ({
                        key: "pic_name",
                        direction: current.key === "pic_name" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>Platform Dikelola</TableHead>
                <TableHead>Username Akun</TableHead>
                <TableHead>
                  <SortHeader
                    label="Views"
                    active={picSort.key === "views"}
                    direction={picSort.direction}
                    onClick={() =>
                      setPicSort((current) => ({
                        key: "views",
                        direction: current.key === "views" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>Likes / Comments / Shares / Reposts</TableHead>
                <TableHead>
                  <SortHeader
                    label="Engagement"
                    active={picSort.key === "engagement_rate"}
                    direction={picSort.direction}
                    onClick={() =>
                      setPicSort((current) => ({
                        key: "engagement_rate",
                        direction: current.key === "engagement_rate" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Ketepatan Waktu"
                    active={picSort.key === "timeliness_rate"}
                    direction={picSort.direction}
                    onClick={() =>
                      setPicSort((current) => ({
                        key: "timeliness_rate",
                        direction: current.key === "timeliness_rate" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Skor Final"
                    active={picSort.key === "score_final"}
                    direction={picSort.direction}
                    onClick={() =>
                      setPicSort((current) => ({
                        key: "score_final",
                        direction: current.key === "score_final" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedPics.map((row) => (
                <TableRow key={row.pic_id}>
                  <TableCell>{medalLabel(row.rank)}</TableCell>
                  <TableCell className="font-medium">{row.pic_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.platforms.map((platform) => (
                        <PlatformPill key={`${row.pic_id}-${platform}`} platform={platform} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-56 whitespace-normal">
                    <div className="flex flex-wrap gap-1">
                      {row.accounts.map((account) => (
                        <span key={account.id} className="rounded-full bg-muted px-2 py-1 text-xs">
                          {account.username}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{formatCompactNumber(row.views)}</TableCell>
                  <TableCell className="text-xs">
                    {formatCompactNumber(row.likes)} / {formatCompactNumber(row.comments)} /{" "}
                    {formatCompactNumber(row.shares)} / {formatCompactNumber(row.reposts)}
                  </TableCell>
                  <TableCell>{formatPercent(row.engagement_rate)}</TableCell>
                  <TableCell>
                    <ScoreProgress value={row.timeliness_rate} />
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${formatScoreColor(row.score_final)}`}>
                      {formatPercent(row.score_final)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Halaman {picPage} dari {Math.max(1, Math.ceil(sortedPicRows.length / 10))}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                disabled={picPage === 1}
                onClick={() => setPicPage((value) => value - 1)}
              >
                Sebelumnya
              </button>
              <button
                type="button"
                className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                disabled={picPage >= Math.ceil(sortedPicRows.length / 10)}
                onClick={() => setPicPage((value) => value + 1)}
              >
                Berikutnya
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>WCC Leaderboard</CardTitle>
          <CardDescription>
            Ranking WCC berdasarkan kontribusi konten dan adoption rate oleh PIC Sosmed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortHeader
                    label="Rank"
                    active={wccSort.key === "rank"}
                    direction={wccSort.direction}
                    onClick={() =>
                      setWccSort((current) => ({
                        key: "rank",
                        direction: current.key === "rank" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Nama WCC"
                    active={wccSort.key === "wccName"}
                    direction={wccSort.direction}
                    onClick={() =>
                      setWccSort((current) => ({
                        key: "wccName",
                        direction: current.key === "wccName" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Dibuat"
                    active={wccSort.key === "totalContentCreated"}
                    direction={wccSort.direction}
                    onClick={() =>
                      setWccSort((current) => ({
                        key: "totalContentCreated",
                        direction:
                          current.key === "totalContentCreated" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Disetujui"
                    active={wccSort.key === "totalContentApproved"}
                    direction={wccSort.direction}
                    onClick={() =>
                      setWccSort((current) => ({
                        key: "totalContentApproved",
                        direction:
                          current.key === "totalContentApproved" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Dipakai PIC"
                    active={wccSort.key === "totalContentUsed"}
                    direction={wccSort.direction}
                    onClick={() =>
                      setWccSort((current) => ({
                        key: "totalContentUsed",
                        direction: current.key === "totalContentUsed" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Adoption Rate"
                    active={wccSort.key === "adoptionRate"}
                    direction={wccSort.direction}
                    onClick={() =>
                      setWccSort((current) => ({
                        key: "adoptionRate",
                        direction: current.key === "adoptionRate" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Views"
                    active={wccSort.key === "totalViews"}
                    direction={wccSort.direction}
                    onClick={() =>
                      setWccSort((current) => ({
                        key: "totalViews",
                        direction: current.key === "totalViews" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Engagement"
                    active={wccSort.key === "totalEngagement"}
                    direction={wccSort.direction}
                    onClick={() =>
                      setWccSort((current) => ({
                        key: "totalEngagement",
                        direction: current.key === "totalEngagement" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Skor Final"
                    active={wccSort.key === "scoreFinal"}
                    direction={wccSort.direction}
                    onClick={() =>
                      setWccSort((current) => ({
                        key: "scoreFinal",
                        direction: current.key === "scoreFinal" && current.direction === "desc" ? "asc" : "desc",
                      }))
                    }
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedWcc.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{medalLabel(row.rank)}</TableCell>
                  <TableCell className="font-medium">{row.wccName}</TableCell>
                  <TableCell>{row.totalContentCreated}</TableCell>
                  <TableCell>{row.totalContentApproved}</TableCell>
                  <TableCell>{row.totalContentUsed}</TableCell>
                  <TableCell>
                    <ScoreProgress value={row.adoptionRate} />
                  </TableCell>
                  <TableCell>{formatCompactNumber(row.totalViews)}</TableCell>
                  <TableCell>{formatCompactNumber(row.totalEngagement)}</TableCell>
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
              Halaman {wccPage} dari {Math.max(1, Math.ceil(sortedWccRows.length / 10))}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                disabled={wccPage === 1}
                onClick={() => setWccPage((value) => value - 1)}
              >
                Sebelumnya
              </button>
              <button
                type="button"
                className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                disabled={wccPage >= Math.ceil(sortedWccRows.length / 10)}
                onClick={() => setWccPage((value) => value + 1)}
              >
                Berikutnya
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Content</CardTitle>
          <CardDescription>Konten terbaik dari regional ini pada periode yang dipilih.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thumbnail</TableHead>
                <TableHead>Judul Konten</TableHead>
                <TableHead>Dibuat oleh</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Diposting oleh</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Engagement Rate</TableHead>
                <TableHead>Tanggal Posting</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(regionalDetail?.top_content ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.thumbnailUrl ? (
                      <img src={row.thumbnailUrl} alt={row.title} className="h-14 w-20 rounded-md object-cover" />
                    ) : (
                      <div className="flex h-14 w-20 items-center justify-center rounded-md bg-muted text-muted-foreground text-xs">
                        No Image
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-64 whitespace-normal font-medium">{row.title}</TableCell>
                  <TableCell>{row.wccName}</TableCell>
                  <TableCell>
                    <PlatformPill platform={row.platform} />
                  </TableCell>
                  <TableCell>{row.picName}</TableCell>
                  <TableCell>{formatCompactNumber(row.views)}</TableCell>
                  <TableCell>{formatPercent(row.engagementRate)}</TableCell>
                  <TableCell>{format(new Date(row.postedAt), "dd MMM yyyy", { locale: localeId })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
