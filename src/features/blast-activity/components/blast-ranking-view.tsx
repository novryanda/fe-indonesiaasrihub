"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";


import { Crown, ExternalLink, Eye, Heart, Medal, MessageCircle, Repeat2, Search, Share2, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { PlatformIcon } from "@/features/content-shared/components/platform-icon";
import { formatDateTime, formatNumber, formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { listSocialAccounts } from "@/features/social-accounts/api/social-accounts-api";
import type { SocialAccountItem } from "@/features/social-accounts/types/social-account.type";
import { cn } from "@/lib/utils";
import { ApiError } from "@/shared/api/api-client";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { getBlastRanking } from "../api/get-blast-ranking";
import type {
  BlastActivityItem,
  BlastMeta,
  BlastRankingData,
  BlastRankingFilters,
  BlastRankingItem,
} from "../types/blast-activity.type";

const INITIAL_FILTERS: BlastRankingFilters = {
  platform: "all",
  social_account_id: "all",
  date_from: "",
  date_to: "",
  search: "",
  blast_user_id: "all",
  page: 1,
  limit: 20,
};

function RankingStat({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-foreground/10">
      <CardContent className="py-5">
        <div>
          <p className="font-semibold text-2xl">{value}</p>
          <p className="text-muted-foreground text-sm">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PodiumCard({
  item,
  tone,
  featured = false,
}: {
  item: BlastRankingItem;
  tone: "gold" | "green" | "blue";
  featured?: boolean;
}) {
  const toneClassName = {
    gold: "border-amber-200 bg-amber-50/80 text-amber-950",
    green: "border-emerald-200 bg-emerald-50/80 text-emerald-950",
    blue: "border-sky-200 bg-sky-50/80 text-sky-950",
  }[tone];
  const iconClassName = {
    gold: "bg-amber-500 text-white",
    green: "bg-emerald-600 text-white",
    blue: "bg-sky-600 text-white",
  }[tone];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 shadow-sm",
        toneClassName,
        featured ? "lg:-mt-4 min-h-56" : "min-h-48",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={cn("flex size-12 items-center justify-center rounded-xl", iconClassName)}>
          {featured ? <Crown className="size-6" /> : <Medal className="size-6" />}
        </div>
        <span className="font-black text-5xl leading-none opacity-15">#{item.rank}</span>
      </div>
      <div className="mt-6 space-y-2">
        <p className="line-clamp-1 font-semibold text-xl">{item.user.name}</p>
        <p className="text-sm opacity-75">{item.user.wilayah?.nama ?? "Tanpa wilayah"}</p>
      </div>
      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <p className="font-black text-4xl leading-none">{formatNumber(item.total_postingan)}</p>
          <p className="mt-1 text-sm opacity-75">postingan diblast</p>
        </div>
      </div>
    </div>
  );
}

function RankTrophy({ rank }: { rank: number }) {
  const isChampion = rank === 1;
  const className =
    rank === 1
      ? "border-amber-300 bg-amber-50 text-amber-700"
      : rank === 2
        ? "border-slate-300 bg-slate-50 text-slate-600"
        : rank === 3
          ? "border-orange-300 bg-orange-50 text-orange-700"
          : "border-foreground/10 bg-muted text-muted-foreground";

  return (
    <div className={cn("relative flex size-12 shrink-0 items-center justify-center rounded-xl border", className)}>
      {isChampion ? <Trophy className="size-6" /> : <Medal className="size-6" />}
      <span className="-right-1.5 -bottom-1.5 absolute flex size-6 items-center justify-center rounded-full bg-background font-semibold text-[11px] shadow-sm ring-1 ring-foreground/10">
        {rank}
      </span>
    </div>
  );
}

function LeaderboardRow({ item, maxPosting }: { item: BlastRankingItem; maxPosting: number }) {
  const width = Math.max(8, Math.round((item.total_postingan / Math.max(1, maxPosting)) * 100));

  return (
    <div className="grid gap-3 rounded-xl border border-foreground/10 p-3 md:grid-cols-[3.5rem_minmax(0,1fr)_7rem] md:items-center">
      <RankTrophy rank={item.rank} />
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{item.user.name}</p>
            <p className="truncate text-muted-foreground text-xs">{item.user.wilayah?.nama ?? "Tanpa wilayah"}</p>
          </div>
          <span className="font-semibold text-sm md:hidden">{formatNumber(item.total_postingan)}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${width}%` }} />
        </div>
      </div>
      <div className="hidden text-right md:block">
        <p className="font-semibold">{formatNumber(item.total_postingan)}</p>
        <p className="text-muted-foreground text-xs">postingan</p>
      </div>
    </div>
  );
}

function ActivityReferenceCell({ item }: { item: BlastActivityItem }) {
  if (!item.blast_assignment) {
    return <span className="text-muted-foreground text-xs">Log lama / tanpa assignment</span>;
  }

  return (
    <div className="space-y-1">
      <p className="line-clamp-1 font-medium text-sm">{item.blast_assignment.content.title}</p>
      <p className="text-muted-foreground text-xs">
        {item.blast_assignment.target_wilayah.nama}
        {item.blast_assignment.content.submission_code ? ` - ${item.blast_assignment.content.submission_code}` : ""}
      </p>
    </div>
  );
}

export function BlastRankingView() {
  const { isAuthorized, isPending } = useRoleGuard(["blast", "superadmin", "sysadmin"]);
  const [filters, setFilters] = useState<BlastRankingFilters>(INITIAL_FILTERS);
  const [data, setData] = useState<BlastRankingData | null>(null);
  const [meta, setMeta] = useState<BlastMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountItem[]>([]);
  const [isSocialAccountsLoading, setSocialAccountsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const fetchRanking = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getBlastRanking(filters);
        if (!isActive) {
          return;
        }

        setData(response.data);
        setMeta(response.meta ?? null);
      } catch (errorValue) {
        if (!isActive) {
          return;
        }

        setError(errorValue instanceof ApiError ? errorValue.message : "Gagal memuat ranking blast");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void fetchRanking();

    return () => {
      isActive = false;
    };
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchSocialAccounts = async () => {
      setSocialAccountsLoading(true);

      try {
        const response = await listSocialAccounts(
          {
            platform: "all",
            verification_status: "verified",
            delegation_status: "all",
            search: "",
            page: 1,
            limit: 100,
          },
          controller.signal,
        );
        setSocialAccounts(response.data);
      } catch {
        if (!controller.signal.aborted) {
          setSocialAccounts([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSocialAccountsLoading(false);
        }
      }
    };

    void fetchSocialAccounts();

    return () => controller.abort();
  }, []);

  const ranking = data?.ranking ?? [];
  const activities = data?.activities ?? [];
  const topThree = ranking.slice(0, 3);
  const maxPosting = Math.max(...ranking.map((item) => item.total_postingan), 1);
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;
  const userOptions = ranking.map((item) => item.user);
  const sortedSocialAccounts = useMemo(
    () => [...socialAccounts].sort((left, right) => left.username.localeCompare(right.username, "id")),
    [socialAccounts],
  );
  const hasFilters =
    filters.platform !== "all" ||
    filters.social_account_id !== "all" ||
    filters.blast_user_id !== "all" ||
    Boolean(filters.date_from?.trim()) ||
    Boolean(filters.date_to?.trim()) ||
    Boolean(filters.search.trim());

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
      <Card className="app-bg-hero app-border-soft">
        <CardContent className="px-6 py-8 md:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Badge
                variant="outline"
                className="rounded-full border-emerald-200 bg-background/75 px-3 py-1 text-emerald-700 dark:bg-card/75"
              >
                Blast / Ranking User
              </Badge>
              <div className="space-y-2">
                <h1 className="font-semibold text-3xl tracking-tight">Ranking Blast</h1>
                <p className="max-w-3xl text-muted-foreground text-sm leading-6">
                  Peringkat user blast berdasarkan jumlah postingan yang berhasil mereka submit.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[28rem]">
              <Input
                aria-label="Tanggal blast dari"
                type="date"
                value={filters.date_from ?? ""}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    date_from: event.target.value,
                    page: 1,
                  }))
                }
              />

              <Input
                aria-label="Tanggal blast sampai"
                type="date"
                value={filters.date_to ?? ""}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    date_to: event.target.value,
                    page: 1,
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <RankingStat title="User aktif di ranking" value={formatNumber(data?.stats.total_users)} />
        <RankingStat title="Total postingan diblast" value={formatNumber(data?.stats.total_postingan)} />
        <RankingStat title="Total views terkumpul" value={formatNumber(data?.stats.total_views)} />
      </div>

      {error ? (
        <Card>
          <CardContent className="py-6 text-destructive text-sm">{error}</CardContent>
        </Card>
      ) : isLoading && !data ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Spinner />
            <span>Memuat ranking blast...</span>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.9fr]">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Podium Blast</CardTitle>
              </CardHeader>
              <CardContent>
                {topThree.length === 0 ? (
                  <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed text-muted-foreground text-sm">
                    Belum ada aktivitas blast untuk periode ini.
                  </div>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-3 lg:items-end">
                    {topThree.map((item) => (
                      <PodiumCard
                        key={item.user.id}
                        item={item}
                        featured={item.rank === 1}
                        tone={item.rank === 1 ? "gold" : item.rank === 2 ? "green" : "blue"}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ranking.length === 0 ? (
                  <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed text-muted-foreground text-sm">
                    Ranking belum tersedia.
                  </div>
                ) : (
                  ranking
                    .slice(0, 10)
                    .map((item) => <LeaderboardRow key={item.user.id} item={item} maxPosting={maxPosting} />)
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="space-y-4">
              <div className="grid gap-3 xl:grid-cols-[160px_220px_220px_minmax(0,1fr)_auto]">
                <Select
                  value={filters.platform}
                  onValueChange={(value) =>
                    setFilters((previous) => ({
                      ...previous,
                      platform: value as typeof previous.platform,
                      page: 1,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Platform</SelectItem>
                    {["instagram", "tiktok", "youtube", "facebook", "x"].map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {formatPlatformLabel(platform as never)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.social_account_id}
                  onValueChange={(value) =>
                    setFilters((previous) => ({
                      ...previous,
                      social_account_id: value,
                      page: 1,
                    }))
                  }
                  disabled={isSocialAccountsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Akun Sosmed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Akun Sosmed</SelectItem>
                    {sortedSocialAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.username} - {account.wilayah_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.blast_user_id}
                  onValueChange={(value) =>
                    setFilters((previous) => ({
                      ...previous,
                      blast_user_id: value,
                      page: 1,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua User Blast" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua User Blast</SelectItem>
                    {userOptions.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Cari postingan, user, akun, atau link"
                    value={filters.search}
                    onChange={(event) =>
                      setFilters((previous) => ({
                        ...previous,
                        search: event.target.value,
                        page: 1,
                      }))
                    }
                  />
                </div>

                <Button variant="outline" onClick={() => setFilters(INITIAL_FILTERS)} disabled={!hasFilters}>
                  Reset Filter
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Blast</TableHead>
                      <TableHead className="min-w-[16rem]">Referensi</TableHead>
                      <TableHead className="w-56 min-w-[12rem] max-w-56">Akun Sosmed</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Waktu Blast</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          Belum ada postingan blast yang cocok.
                        </TableCell>
                      </TableRow>
                    ) : (
                      activities.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <p className="font-medium text-sm">{item.blast_user.name}</p>
                              <p className="text-muted-foreground text-xs">{item.blast_user.wilayah?.nama ?? "-"}</p>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <ActivityReferenceCell item={item} />
                          </TableCell>
                          <TableCell className="max-w-56 align-top">
                            <div className="space-y-1">
                              <p className="truncate font-medium text-sm">{item.social_account?.username ?? "-"}</p>
                              <p className="line-clamp-1 text-muted-foreground text-xs">
                                {item.social_account?.profile_name ?? "-"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <PlatformIcon platform={item.platform} />
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline" className="gap-1">
                                <Eye className="size-3" />
                                {formatNumber(item.views)}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Heart className="size-3" />
                                {formatNumber(item.likes)}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <MessageCircle className="size-3" />
                                {formatNumber(item.comments)}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Share2 className="size-3" />
                                {formatNumber(item.shares)}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Repeat2 className="size-3" />
                                {formatNumber(item.reposts)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="align-top text-sm">
                            {item.posted_at ? formatDateTime(item.posted_at) : formatDateTime(item.created_at)}
                          </TableCell>
                          <TableCell className="text-right align-top">
                            <Button asChild variant="ghost" size="icon-sm" aria-label="Buka postingan">
                              <Link href={item.post_url} target="_blank" rel="noreferrer">
                                <ExternalLink className="size-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <TablePagination
                summary={`Halaman ${filters.page} dari ${totalPages}${meta ? ` (${meta.total} total postingan)` : ""}`}
                page={filters.page}
                totalPages={totalPages}
                disabled={isLoading}
                onPageChange={(nextPage) => setFilters((previous) => ({ ...previous, page: nextPage }))}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
