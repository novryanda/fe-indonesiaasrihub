"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime, formatNumber, formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { getPostingProofDetail } from "../api/posting-proofs-api";
import type { PostingProofDetail } from "../types/posting-proof.type";

function getStatsInfo(link: PostingProofDetail["links"][number]) {
  if (link.validation_status === "ditolak") {
    return {
      label: "Link ditolak otomatis",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  const stats = link.stats;
  const hasAnyValue = [stats?.views, stats?.likes, stats?.comments, stats?.reposts, stats?.share_posts].some(
    (value) => value !== null && value !== undefined,
  );

  if (stats?.auto_updated_at) {
    return {
      label: `Diperbarui otomatis · ${formatDateTime(stats.auto_updated_at)}`,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (hasAnyValue) {
    return {
      label: "Data statistik tercatat",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Menunggu data scraping...",
    className: "border-zinc-200 bg-zinc-50 text-zinc-700",
  };
}

function formatStatValue(value: number | null | undefined) {
  return value === null || value === undefined ? "-" : formatNumber(value);
}

function PostingStatsSummary({ link }: { link: PostingProofDetail["links"][number] }) {
  const stats: Array<{ label: string; value: number | null | undefined }> = [
    { label: "Views", value: link.stats?.views },
    { label: "Likes", value: link.stats?.likes },
    { label: "Comments", value: link.stats?.comments },
    { label: "Reposts", value: link.stats?.reposts },
    { label: "Share Posts", value: link.stats?.share_posts },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border bg-muted/20 p-4">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">{stat.label}</p>
          <p className="mt-2 font-semibold text-lg">{formatStatValue(stat.value)}</p>
        </div>
      ))}
    </div>
  );
}

export function PostingProofStatsDetailView() {
  const params = useParams<{ id: string }>();
  const proofId = typeof params?.id === "string" ? params.id : "";
  const { isAuthorized, isPending } = useRoleGuard(["pic_sosmed"]);
  const [item, setItem] = useState<PostingProofDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!proofId || !isAuthorized || isPending) {
      return;
    }

    setIsLoading(true);
    void getPostingProofDetail(proofId)
      .then((response) => {
        setItem(response.data);
      })
      .catch((errorValue) => {
        toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat detail posting");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isAuthorized, isPending, proofId]);

  const totalLinks = useMemo(() => item?.links.length ?? 0, [item]);

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
        <CardContent className="space-y-4 px-6 py-8 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <Badge
                variant="outline"
                className="rounded-full border-sky-200 bg-background/75 px-3 py-1 text-sky-700 dark:bg-card/75"
              >
                Postingan / Detail Statistik
              </Badge>
              <h1 className="font-semibold text-3xl tracking-tight">{item?.bank_content_judul ?? "Detail Posting"}</h1>
              <p className="max-w-2xl text-muted-foreground text-sm leading-6">
                Link diverifikasi otomatis via actor posting metrics. Statistik performa di bawah ini ditampilkan dari
                hasil scrape tanpa input manual.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/dashboard/postingan-saya">
                  <ArrowLeft className="mr-2 size-4" />
                  Kembali
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Spinner />
            <span>Memuat detail posting...</span>
          </CardContent>
        </Card>
      ) : !item ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">Detail posting tidak ditemukan.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="grid gap-3 py-6 md:grid-cols-4">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Status</p>
                <p className="mt-2 font-medium">{item.status.replaceAll("_", " ")}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">PIC Sosmed</p>
                <p className="mt-2 font-medium">{item.pic.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Wilayah</p>
                <p className="mt-2 font-medium">{item.pic.regional ?? "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Jumlah Link</p>
                <p className="mt-2 font-medium">{totalLinks}</p>
              </div>
            </CardContent>
          </Card>

          {item.links.map((link) => (
            <Card key={link.id} className="border-foreground/10">
              <CardContent className="space-y-5 py-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{formatPlatformLabel(link.platform)}</Badge>
                  <Badge variant="outline">
                    {link.social_account?.nama_profil ?? link.social_account?.username ?? "Akun belum dipilih"}
                  </Badge>
                  <Badge variant="outline">{link.validation_status}</Badge>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
                  <a
                    href={link.post_url}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-emerald-700 underline-offset-4 hover:underline"
                  >
                    {link.post_url}
                  </a>
                </div>

                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Waktu Posting</p>
                    <p className="mt-2 font-medium">{formatDateTime(link.posted_at)}</p>
                  </div>
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Dicatat Oleh</p>
                    <p className="mt-2 font-medium">{link.validated_by ?? "Sistem otomatis"}</p>
                  </div>
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Tercatat Pada</p>
                    <p className="mt-2 font-medium">{link.validated_at ? formatDateTime(link.validated_at) : "-"}</p>
                  </div>
                </div>

                <Badge variant="outline" className={getStatsInfo(link).className}>
                  {getStatsInfo(link).label}
                </Badge>

                {link.rejection_note ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-rose-700 text-sm">
                    {link.rejection_note}
                  </div>
                ) : null}

                <PostingStatsSummary link={link} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
