"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ChartColumnBig, ExternalLink, ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime, formatPlatformLabel, formatTimeAgo } from "@/features/content-shared/utils/content-formatters";
import { cn } from "@/lib/utils";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { listPostingProofs } from "../api/posting-proofs-api";
import type { PostingProofItem } from "../types/posting-proof.type";

function getStatusBadgeClass(status: PostingProofItem["status"]) {
  switch (status) {
    case "bukti_valid":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "bukti_ditolak":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "bukti_dikirim":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

function formatStatValue(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("id-ID").format(value);
}

export function MyPostingProofsView() {
  const { isAuthorized, isPending } = useRoleGuard(["pic_sosmed"]);
  const [items, setItems] = useState<PostingProofItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await listPostingProofs({
        status: "all",
        page: 1,
        limit: 50,
      });
      setItems(response.data);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat riwayat posting");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending && isAuthorized) {
      void loadData();
    }
  }, [isAuthorized, isPending]);

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
      <Card className="border-emerald-100 bg-linear-to-br from-emerald-50 via-background to-amber-50">
        <CardContent className="space-y-4 px-6 py-8 md:px-8">
          <Badge variant="outline" className="rounded-full border-emerald-200 bg-white/70 px-3 py-1 text-emerald-700">
            Posting / Riwayat Saya
          </Badge>
          <div className="space-y-2">
            <h1 className="font-semibold text-3xl tracking-tight">Postingan Saya</h1>
            <p className="max-w-2xl text-muted-foreground text-sm leading-6">
              Pantau semua bukti posting yang pernah Anda kirim, termasuk akun yang dipakai, status validasi, dan link
              yang perlu diperbaiki.
            </p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Spinner />
            <span>Memuat riwayat posting...</span>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            Belum ada bukti posting yang pernah Anda kirim.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="border-foreground/10">
              <CardContent className="space-y-5 py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-xl">{item.bank_content_judul}</h2>
                      <Badge variant="outline" className={cn("rounded-full px-3 py-1", getStatusBadgeClass(item.status))}>
                        {item.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">Diperbarui {formatTimeAgo(item.updated_at)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.evidence_drive_link ? (
                      <Button asChild variant="outline">
                        <a href={item.evidence_drive_link} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-2 size-4" />
                          Buka Drive Lampiran
                        </a>
                      </Button>
                    ) : null}
                    <Button asChild>
                      <Link href={`/dashboard/postingan-saya/${item.id}`}>
                        <ChartColumnBig className="mr-2 size-4" />
                        Isi Statistik
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Link Arsip Drive Posting</p>
                  {item.evidence_drive_link ? (
                    <a
                      href={item.evidence_drive_link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block break-all text-emerald-700 underline-offset-4 hover:underline"
                    >
                      {item.evidence_drive_link}
                    </a>
                  ) : (
                    <p className="mt-2 text-muted-foreground">Belum ada link arsip drive yang dilampirkan.</p>
                  )}
                </div>

                <div className="grid gap-3">
                  {item.links.map((link) => (
                    <div key={link.id} className="grid gap-3 rounded-2xl border p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{formatPlatformLabel(link.platform)}</Badge>
                        <Badge variant="outline">
                          {link.social_account?.nama_profil ?? link.social_account?.username ?? "Akun belum dipilih"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full px-3 py-1",
                            link.validation_status === "valid"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : link.validation_status === "ditolak"
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-amber-200 bg-amber-50 text-amber-700",
                          )}
                        >
                          {link.validation_status}
                        </Badge>
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
                          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Validator</p>
                          <p className="mt-2 font-medium">{link.validated_by ?? "-"}</p>
                        </div>
                        <div className="rounded-2xl border bg-muted/20 p-4">
                          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Validated At</p>
                          <p className="mt-2 font-medium">
                            {link.validated_at ? formatDateTime(link.validated_at) : "-"}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-2xl border bg-muted/20 p-4">
                          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Views</p>
                          <p className="mt-2 font-semibold text-lg">{formatStatValue(link.stats?.views)}</p>
                        </div>
                        <div className="rounded-2xl border bg-muted/20 p-4">
                          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Likes</p>
                          <p className="mt-2 font-semibold text-lg">{formatStatValue(link.stats?.likes)}</p>
                        </div>
                        <div className="rounded-2xl border bg-muted/20 p-4">
                          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Comments</p>
                          <p className="mt-2 font-semibold text-lg">{formatStatValue(link.stats?.comments)}</p>
                        </div>
                        <div className="rounded-2xl border bg-muted/20 p-4">
                          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Reposts</p>
                          <p className="mt-2 font-semibold text-lg">{formatStatValue(link.stats?.reposts)}</p>
                        </div>
                        <div className="rounded-2xl border bg-muted/20 p-4">
                          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Share Posts</p>
                          <p className="mt-2 font-semibold text-lg">{formatStatValue(link.stats?.share_posts)}</p>
                        </div>
                      </div>

                      {link.rejection_note ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700">
                          <div className="mb-2 flex items-center gap-2 font-medium">
                            <ShieldX className="size-4" />
                            Catatan Penolakan
                          </div>
                          <p>{link.rejection_note}</p>
                        </div>
                      ) : link.validation_status === "valid" ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-700">
                          <div className="mb-2 flex items-center gap-2 font-medium">
                            <ShieldCheck className="size-4" />
                            Link Tervalidasi
                          </div>
                          <p>Link posting ini sudah tervalidasi dan tercatat sebagai posting resmi.</p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
