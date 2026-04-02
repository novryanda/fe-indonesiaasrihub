"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime, formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { getPostingProofDetail, updatePostingStats } from "../api/posting-proofs-api";
import type { PostingProofDetail } from "../types/posting-proof.type";

type StatsDraft = {
  views: string;
  likes: string;
  comments: string;
  reposts: string;
  share_posts: string;
};

function toDraft(detail: PostingProofDetail | null): Record<string, StatsDraft> {
  if (!detail) {
    return {};
  }

  return Object.fromEntries(
    detail.links.map((link) => [
      link.id,
      {
        views: link.stats?.views?.toString() ?? "",
        likes: link.stats?.likes?.toString() ?? "",
        comments: link.stats?.comments?.toString() ?? "",
        reposts: link.stats?.reposts?.toString() ?? "",
        share_posts: link.stats?.share_posts?.toString() ?? "",
      },
    ]),
  );
}

function parseNullableInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return Number.parseInt(trimmed, 10);
}

function getStatsInfo(stats?: PostingProofDetail["links"][number]["stats"]) {
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
      label: "Diisi manual",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Menunggu data scraping...",
    className: "border-zinc-200 bg-zinc-50 text-zinc-700",
  };
}

export function PostingProofStatsDetailView() {
  const params = useParams<{ id: string }>();
  const proofId = typeof params?.id === "string" ? params.id : "";
  const { isAuthorized, isPending } = useRoleGuard(["pic_sosmed"]);
  const [item, setItem] = useState<PostingProofDetail | null>(null);
  const [drafts, setDrafts] = useState<Record<string, StatsDraft>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!proofId || !isAuthorized || isPending) {
      return;
    }

    setIsLoading(true);
    void getPostingProofDetail(proofId)
      .then((response) => {
        setItem(response.data);
        setDrafts(toDraft(response.data));
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

  const handleFieldChange = (linkId: string, field: keyof StatsDraft, value: string) => {
    setDrafts((previous) => ({
      ...previous,
      [linkId]: {
        ...previous[linkId],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!item) {
      return;
    }

    setIsSaving(true);
    try {
      await updatePostingStats(
        item.id,
        item.links.map((link) => ({
          link_id: link.id,
          views: parseNullableInt(drafts[link.id]?.views ?? ""),
          likes: parseNullableInt(drafts[link.id]?.likes ?? ""),
          comments: parseNullableInt(drafts[link.id]?.comments ?? ""),
          reposts: parseNullableInt(drafts[link.id]?.reposts ?? ""),
          share_posts: parseNullableInt(drafts[link.id]?.share_posts ?? ""),
        })),
      );

      const refreshed = await getPostingProofDetail(item.id);
      setItem(refreshed.data);
      setDrafts(toDraft(refreshed.data));
      toast.success("Statistik posting berhasil disimpan");
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal menyimpan statistik posting");
    } finally {
      setIsSaving(false);
    }
  };

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
                PIC Sosmed dapat mengisi statistik performa per link posting yang sudah dibuat dari akun terdelegasi.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/dashboard/postingan-saya">
                  <ArrowLeft className="mr-2 size-4" />
                  Kembali
                </Link>
              </Button>
              {item?.evidence_drive_link ? (
                <Button asChild variant="outline">
                  <a href={item.evidence_drive_link} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 size-4" />
                    Buka Drive Lampiran
                  </a>
                </Button>
              ) : null}
              <Button onClick={() => void handleSave()} disabled={isSaving || !item}>
                {isSaving ? <Spinner className="mr-2" /> : <Save className="mr-2 size-4" />}
                Simpan Statistik
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

          <Card>
            <CardContent className="py-6">
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
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Validator</p>
                    <p className="mt-2 font-medium">{link.validated_by ?? "-"}</p>
                  </div>
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Validated At</p>
                    <p className="mt-2 font-medium">{link.validated_at ? formatDateTime(link.validated_at) : "-"}</p>
                  </div>
                </div>

                <Badge variant="outline" className={getStatsInfo(link.stats).className}>
                  {getStatsInfo(link.stats).label}
                </Badge>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Views</label>
                    <Input
                      type="number"
                      min={0}
                      value={drafts[link.id]?.views ?? ""}
                      onChange={(event) => handleFieldChange(link.id, "views", event.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Likes</label>
                    <Input
                      type="number"
                      min={0}
                      value={drafts[link.id]?.likes ?? ""}
                      onChange={(event) => handleFieldChange(link.id, "likes", event.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Comments</label>
                    <Input
                      type="number"
                      min={0}
                      value={drafts[link.id]?.comments ?? ""}
                      onChange={(event) => handleFieldChange(link.id, "comments", event.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Reposts</label>
                    <Input
                      type="number"
                      min={0}
                      value={drafts[link.id]?.reposts ?? ""}
                      onChange={(event) => handleFieldChange(link.id, "reposts", event.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Share Posts</label>
                    <Input
                      type="number"
                      min={0}
                      value={drafts[link.id]?.share_posts ?? ""}
                      onChange={(event) => handleFieldChange(link.id, "share_posts", event.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
