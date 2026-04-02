"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  ExternalLink,
  Hash,
  MessageSquareText,
  PlayCircle,
  Repeat2,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Spinner } from "@/components/ui/spinner";
import { getSocialAccountScrapedPostDetail } from "@/features/social-accounts/api/social-accounts-api";
import type {
  SocialAccountScrapedPostDetail,
  SocialPostPicStatus,
} from "@/features/social-accounts/types/social-account.type";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

const compactNumberFormatter = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });

const postRadarChartConfig = {
  score: {
    label: "Skor Relatif",
    color: "#0f766e",
  },
} satisfies ChartConfig;

function formatCompact(value: number | null | undefined) {
  return compactNumberFormatter.format(value ?? 0);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Tidak tersedia";
  }

  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

export function SocialAccountPostDetailView({ accountId, postId }: { accountId: string; postId: string }) {
  const { isAuthorized, isPending } = useRoleGuard(["superadmin", "qcc_wcc"]);
  const [data, setData] = useState<SocialAccountScrapedPostDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthorized || isPending) {
      return;
    }

    setLoading(true);
    void getSocialAccountScrapedPostDetail(accountId, postId)
      .then((response) => setData(response.data))
      .catch((errorValue) => {
        toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat detail posting");
      })
      .finally(() => setLoading(false));
  }, [accountId, isAuthorized, isPending, postId]);

  const performanceRadarData = useMemo(() => {
    if (!data) {
      return [];
    }

    const metrics = [
      {
        metric: "Views",
        value: data.video_view_count ?? data.video_play_count ?? 0,
        raw_value: formatCompact(data.video_view_count ?? data.video_play_count),
      },
      {
        metric: "Likes",
        value: data.likes_count ?? 0,
        raw_value: formatCompact(data.likes_count),
      },
      {
        metric: "Comments",
        value: data.comments_count ?? 0,
        raw_value: formatCompact(data.comments_count),
      },
      {
        metric: "Share",
        value: data.share_posts ?? 0,
        raw_value: formatCompact(data.share_posts),
      },
      {
        metric: "Repost",
        value: data.reposts ?? 0,
        raw_value: formatCompact(data.reposts),
      },
    ];

    const maxMetric = Math.max(...metrics.map((item) => item.value), 1);
    const normalizeMetric = (value: number) => Math.round((Math.log10(value + 1) / Math.log10(maxMetric + 1)) * 100);

    return metrics.map((item) => ({
      ...item,
      score: normalizeMetric(item.value),
    }));
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
          <span>Memuat detail posting...</span>
        </CardContent>
      </Card>
    );
  }

  const kpiItems = [
    { label: "Views", value: formatCompact(data.video_view_count ?? data.video_play_count), icon: PlayCircle },
    { label: "Likes", value: formatCompact(data.likes_count), icon: ShieldCheck },
    { label: "Comments", value: formatCompact(data.comments_count), icon: MessageSquareText },
    { label: "Share", value: formatCompact(data.share_posts), icon: Share2 },
    { label: "Repost", value: formatCompact(data.reposts), icon: Repeat2 },
    { label: "Hashtags", value: formatCompact(data.hashtags.length), icon: Hash },
  ];

  return (
    <div className="space-y-6">
      <Card className="app-bg-hero-strong overflow-hidden border-0 text-white shadow-xl">
        <CardContent className="grid gap-6 px-6 py-8 md:px-8 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">Detail Post</Badge>
              <Badge className={getPicTone(data.pic_marker.status)}>
                {data.pic_marker.status.replaceAll("_", " ")}
              </Badge>
            </div>
            <div>
              <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">
                {data.short_code || data.external_post_id}
              </h1>
              <p className="mt-2 text-sm text-white/75 md:text-base">
                {data.owner_username || "Akun tidak diketahui"} • {formatDateTime(data.timestamp)}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur">
            <Button
              asChild
              variant="outline"
              className="w-full border-white/15 bg-black/10 text-white hover:bg-black/20"
            >
              <Link href={`/analitik/monitoring-sosmed/${accountId}`}>
                <ArrowLeft className="mr-2 size-4" />
                Kembali ke Akun
              </Link>
            </Button>
            <Button asChild className="w-full">
              <a href={data.url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 size-4" />
                Buka Post Source
              </a>
            </Button>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white/75">
              Snapshot scrape: {formatDateTime(data.latest_snapshot?.scrapedAt ?? null)}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {kpiItems.map((item) => (
          <Card key={item.label} className="border-foreground/10">
            <CardContent className="space-y-3 py-6">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">{item.label}</p>
                <item.icon className="size-5 text-emerald-600" />
              </div>
              <p className="font-semibold text-3xl tracking-tight">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-foreground/10">
          <CardHeader>
            <CardTitle>Caption</CardTitle>
            <CardDescription>Teks caption hasil scrape untuk posting ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-foreground/10 bg-muted/20 p-5 text-foreground/90 text-sm leading-7 md:text-base">
              {data.caption || "Posting tanpa caption."}
            </div>

            <div className="flex flex-wrap gap-2">
              {data.hashtags.map((tag) => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
              {data.hashtags.length === 0 && (
                <div className="text-muted-foreground text-sm">Tidak ada hashtag pada posting ini.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border-foreground/10">
            <CardHeader className="items-center">
              <CardTitle>Statistik</CardTitle>
              <CardDescription>
                Visualisasi statistik untuk membaca komposisi views, likes, comments, share, dan repost.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              <ChartContainer config={postRadarChartConfig} className="mx-auto aspect-square max-h-[320px]">
                <RadarChart data={performanceRadarData}>
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
            <div className="px-6 pb-6 text-muted-foreground text-sm">
              Nilai divisualkan secara relatif agar perbandingan antar metrik lebih mudah dibaca.
            </div>
          </Card>

          <Card className="border-foreground/10">
            <CardHeader>
              <CardTitle>Status PIC</CardTitle>
              <CardDescription>Marker bukti posting untuk post ini.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-foreground/10 bg-muted/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getPicTone(data.pic_marker.status)}>
                    {data.pic_marker.status.replaceAll("_", " ")}
                  </Badge>
                  {data.pic_marker.bank_content ? (
                    <Badge variant="outline">{data.pic_marker.bank_content.title}</Badge>
                  ) : null}
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    PIC: <span className="font-medium text-foreground">{data.pic_marker.pic?.name ?? "-"}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Submitted at:{" "}
                    <span className="font-medium text-foreground">{formatDateTime(data.pic_marker.posted_at)}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Post URL marker:{" "}
                    <span className="font-medium text-foreground">{data.pic_marker.post_url ?? "-"}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-foreground/10">
            <CardHeader>
              <CardTitle>Komentar</CardTitle>
              <CardDescription>Komentar dan replies terbaru yang masuk pada posting ini.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {data.comments.map((comment) => (
                <div key={comment.id} className="rounded-2xl border border-foreground/10 bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{comment.owner_username || "Anonim"}</p>
                    <span className="text-muted-foreground text-xs">{formatDateTime(comment.timestamp)}</span>
                  </div>
                  <p className="mt-2 text-muted-foreground text-sm">{comment.text || "Komentar kosong"}</p>
                  <div className="mt-3 space-y-2">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="rounded-xl border border-foreground/10 bg-background p-3">
                        <p className="font-medium text-sm">{reply.owner_username || "Anonim"}</p>
                        <p className="mt-1 text-muted-foreground text-sm">{reply.text || "Balasan kosong"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {data.comments.length === 0 && (
                <div className="rounded-2xl border border-foreground/20 border-dashed p-6 text-center text-muted-foreground">
                  Belum ada komentar pada posting ini.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
