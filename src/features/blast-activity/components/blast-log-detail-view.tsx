"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { ArrowLeft, ExternalLink, Eye, Heart, MessageCircle, Repeat2, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { PlatformIcon } from "@/features/content-shared/components/platform-icon";
import { formatDateTime, formatNumber, formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { getBlastLogDetail } from "../api/get-blast-log-detail";
import type { BlastLogDetailData } from "../types/blast-activity.type";

function MetricBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Badge variant="outline" className="gap-1">
      {icon}
      <span className="sr-only">{label}</span>
      {formatNumber(value)}
    </Badge>
  );
}

export function BlastLogDetailView({ id }: { id: string }) {
  const { isAuthorized, isPending } = useRoleGuard(["blast", "sysadmin"]);
  const [data, setData] = useState<BlastLogDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDetail = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getBlastLogDetail(id);
      setData(response.data);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat detail log blast");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthorized || isPending) {
      return;
    }

    void loadDetail();
  }, [isAuthorized, isPending, loadDetail]);

  const totals = useMemo(
    () =>
      data?.history.reduce(
        (summary, item) => ({
          views: summary.views + item.views,
          likes: summary.likes + item.likes,
          comments: summary.comments + item.comments,
          shares: summary.shares + item.shares,
          reposts: summary.reposts + item.reposts,
        }),
        { views: 0, likes: 0, comments: 0, shares: 0, reposts: 0 },
      ) ?? { views: 0, likes: 0, comments: 0, shares: 0, reposts: 0 },
    [data],
  );

  if (isPending || loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Spinner />
          <span>{isPending ? "Memuat session..." : "Memuat detail log blast..."}</span>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthorized || !data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="app-bg-hero app-border-soft">
        <CardContent className="space-y-5 px-6 py-8 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="rounded-full border-emerald-200 bg-background/75 px-3 py-1 text-emerald-700 dark:bg-card/75"
              >
                Blast / Log Blast / Detail
              </Badge>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <PlatformIcon platform={data.platform} />
                  <Badge variant="outline">{formatPlatformLabel(data.platform)}</Badge>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    {formatNumber(data.blast_count)}x blast
                  </Badge>
                </div>
                <h1 className="max-w-4xl font-semibold text-3xl tracking-tight">{data.reference.content.title}</h1>
                <p className="max-w-3xl text-muted-foreground text-sm leading-6">
                  Terakhir diblast oleh {data.completed_by?.name ?? "-"} • {formatDateTime(data.last_blasted_at)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/blast/log">
                  <ArrowLeft className="mr-2 size-4" />
                  Kembali
                </Link>
              </Button>
              <Button asChild>
                <Link href={data.reference.post_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Buka Postingan
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="space-y-2 py-5">
            <p className="text-muted-foreground text-sm">Total Blast</p>
            <p className="font-semibold text-2xl">{formatNumber(data.blast_count)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 py-5">
            <p className="text-muted-foreground text-sm">User Blast Terakhir</p>
            <p className="font-semibold text-lg">{data.completed_by?.name ?? "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 py-5">
            <p className="text-muted-foreground text-sm">Pertama Diblast</p>
            <p className="font-semibold text-lg">{formatDateTime(data.first_blasted_at)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 py-5">
            <p className="text-muted-foreground text-sm">Terakhir Diblast</p>
            <p className="font-semibold text-lg">{formatDateTime(data.last_blasted_at)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Referensi Postingan</CardTitle>
            <CardDescription>Postingan sumber yang menjadi target aktivitas blast.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="font-medium">{data.reference.content.title}</p>
              <p className="mt-1 text-muted-foreground text-sm">
                {data.reference.content.submission_code ?? "-"} • {data.target_wilayah.nama}
              </p>
            </div>
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-muted-foreground text-sm">Akun Sosmed</p>
              <p className="mt-1 font-medium">{data.reference.social_account?.username ?? "-"}</p>
              <p className="text-muted-foreground text-sm">{data.reference.social_account?.profile_name ?? "-"}</p>
            </div>
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-muted-foreground text-sm">PIC Postingan</p>
              <p className="mt-1 font-medium">{data.reference.posting_proof.pic.name}</p>
              <p className="text-muted-foreground text-sm">{data.reference.posting_proof.pic.wilayah?.nama ?? "-"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={data.reference.content.drive_link} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Bank Konten
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={data.reference.post_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Postingan
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Akumulasi Metrik Blast</CardTitle>
            <CardDescription>Total metrik dari seluruh aktivitas blast yang tercatat di log ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-muted-foreground text-sm">Views</p>
                <p className="mt-2 font-semibold text-2xl">{formatNumber(totals.views)}</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-muted-foreground text-sm">Likes</p>
                <p className="mt-2 font-semibold text-2xl">{formatNumber(totals.likes)}</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-muted-foreground text-sm">Comments</p>
                <p className="mt-2 font-semibold text-2xl">{formatNumber(totals.comments)}</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-muted-foreground text-sm">Shares</p>
                <p className="mt-2 font-semibold text-2xl">{formatNumber(totals.shares)}</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-muted-foreground text-sm">Reposts</p>
                <p className="mt-2 font-semibold text-2xl">{formatNumber(totals.reposts)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Blast</CardTitle>
          <CardDescription>Urutan aktivitas blast untuk postingan ini dari yang terbaru.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.history.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground">
              Belum ada aktivitas blast yang tercatat.
            </div>
          ) : (
            data.history.map((item) => (
              <div key={item.id} className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        <Repeat2 className="mr-1 size-3" />
                        Blast #{item.sequence}
                      </Badge>
                      <p className="font-medium">{item.blast_user.name}</p>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {item.blast_user.wilayah?.nama ?? "-"} • {formatDateTime(item.blasted_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-1.5 text-xs">
                    <MetricBadge icon={<Eye className="size-3" />} label="Views" value={item.views} />
                    <MetricBadge icon={<Heart className="size-3" />} label="Likes" value={item.likes} />
                    <MetricBadge icon={<MessageCircle className="size-3" />} label="Comments" value={item.comments} />
                    <MetricBadge icon={<Share2 className="size-3" />} label="Shares" value={item.shares} />
                    <MetricBadge icon={<Repeat2 className="size-3" />} label="Reposts" value={item.reposts} />
                  </div>
                </div>

                {item.caption ? (
                  <p className="mt-3 line-clamp-2 text-muted-foreground text-sm">{item.caption}</p>
                ) : null}
                {item.notes ? <p className="mt-2 text-muted-foreground text-sm">{item.notes}</p> : null}
                {item.proof_drive_link ? (
                  <Button asChild size="sm" variant="link" className="mt-2 h-auto px-0">
                    <Link href={item.proof_drive_link} target="_blank" rel="noreferrer">
                      Buka bukti blast
                    </Link>
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
