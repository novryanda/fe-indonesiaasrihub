"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { Check, ChevronsUpDown, ExternalLink, Eye, Heart, MessageCircle, Radio, Repeat2, Search, Send, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Textarea } from "@/components/ui/textarea";
import { PlatformIcon } from "@/features/content-shared/components/platform-icon";
import { formatDateTime, formatNumber, formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { listSocialAccounts } from "@/features/social-accounts/api/social-accounts-api";
import type { SocialAccountItem } from "@/features/social-accounts/types/social-account.type";
import { cn } from "@/lib/utils";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";
import { useSmoothTableData } from "@/shared/hooks/use-smooth-loading-state";

import { useBlastActivity } from "../hooks/use-blast-activity";
import type { BlastCandidateItem, BlastFeedItem, BlastReferenceStatus } from "../types/blast-activity.type";

function StatsCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="border-foreground/10">
      <CardContent className="flex items-center gap-4 py-5">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
        <div>
          <p className="font-semibold text-2xl">{value}</p>
          <p className="text-muted-foreground text-sm">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FeedReferenceCard({
  item,
  active,
  onSelect,
  actionLabel,
}: {
  item: BlastFeedItem;
  active: boolean;
  onSelect: (item: BlastFeedItem) => void;
  actionLabel: string;
}) {
  return (
    <Card className={cn("border-foreground/10", active ? "ring-2 ring-emerald-500" : "")}>
      <CardContent className="space-y-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <PlatformIcon platform={item.platform} />
            <div>
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-muted-foreground text-xs">
                {item.social_account?.username ?? item.target_wilayah.nama} • {item.target_wilayah.nama}
              </p>
            </div>
          </div>
          <Button type="button" variant={active ? "default" : "outline"} size="sm" onClick={() => onSelect(item)}>
            {active ? "Dipilih" : actionLabel}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={item.blast_status === "blasted" ? "default" : "secondary"}>
            {item.blast_status === "blasted" ? "Sudah Pernah Di-blast" : "Belum Di-blast"}
          </Badge>
          <Badge variant="outline">{formatPlatformLabel(item.platform)}</Badge>
          <Badge variant="outline">{item.blast_count} aktivitas blast</Badge>
        </div>

        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground text-xs">Topik</p>
          <p className="line-clamp-2 font-medium leading-6">{item.topic}</p>
        </div>

        <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-6">
          {item.caption?.trim() || "Caption belum tersedia."}
        </p>

        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs">
            {item.last_blasted_at
              ? `Blast terakhir ${formatDateTime(item.last_blasted_at)}`
              : item.approval_at
                ? `Disetujui ${formatDateTime(item.approval_at)}`
                : "Menunggu blast pertama"}
          </p>
          <Button asChild variant="ghost" size="sm">
            <Link href={item.post_url} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 size-4" />
              Buka Postingan
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CandidateCard({
  item,
  isSubmitting,
  onDecide,
}: {
  item: BlastCandidateItem;
  isSubmitting: boolean;
  onDecide: (item: BlastCandidateItem, shouldBlast: boolean) => Promise<void>;
}) {
  return (
    <Card className="border-foreground/10">
      <CardContent className="space-y-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <PlatformIcon platform={item.platform} />
            <div>
              <p className="font-medium text-sm">{item.posting_proof.bank_content.title}</p>
              <p className="text-muted-foreground text-xs">
                {item.posting_proof.pic.name} • {item.posting_proof.pic.wilayah?.nama ?? "-"}
              </p>
            </div>
          </div>
          <Badge variant="outline">{formatPlatformLabel(item.platform)}</Badge>
        </div>

        <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6">{item.caption?.trim() || item.post_url}</p>

        <div className="flex items-center justify-between gap-2 text-muted-foreground text-xs">
          <span>{item.validated_at ? `Valid ${formatDateTime(item.validated_at)}` : "Sudah valid"}</span>
          <Button asChild variant="ghost" size="sm">
            <Link href={item.post_url} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 size-4" />
              Buka Link
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => void onDecide(item, false)}>
            Tidak Perlu Blast
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={() => void onDecide(item, true)}>
            Masukkan Blast
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function BlastActivityView({
  mode,
  referenceStatusPreset = "unblasted",
}: {
  mode: "blast" | "superadmin";
  referenceStatusPreset?: Exclude<BlastReferenceStatus, "all">;
}) {
  const allowedRoles = mode === "blast" ? (["blast"] as const) : (["superadmin"] as const);
  const { isAuthorized, isPending } = useRoleGuard([...allowedRoles]);
  const {
    feedItems,
    candidateItems,
    activities,
    stats,
    candidateFilters,
    setCandidateFilters,
    activityMeta,
    feedFilters,
    setFeedFilters,
    activityFilters,
    setActivityFilters,
    isFeedLoading,
    isCandidatesLoading,
    isActivitiesLoading,
    isSubmitting,
    candidateError,
    feedError,
    activitiesError,
    resetFeedFilters,
    create,
    decide,
    createManualQueue,
  } = useBlastActivity(mode, mode === "blast" ? referenceStatusPreset : "all");

  const [selectedReference, setSelectedReference] = useState<BlastFeedItem | null>(null);
  const blastFormRef = useRef<HTMLDivElement | null>(null);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountItem[]>([]);
  const [isSocialAccountsLoading, setSocialAccountsLoading] = useState(mode === "superadmin");
  const [socialAccountsError, setSocialAccountsError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    platform: "instagram",
    post_url: "",
    caption: "",
    posted_at: "",
    views: "0",
    likes: "0",
    comments: "0",
    shares: "0",
    reposts: "0",
    notes: "",
  });
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [manualQueueFormState, setManualQueueFormState] = useState({
    social_account_id: "",
    reference_title: "",
    post_url: "",
    caption: "",
    posted_at: "",
    note: "",
  });
  const tableState = useMemo(() => ({ activities, stats, activityMeta }), [activities, activityMeta, stats]);
  const { displayData, isInitialLoading, isRefreshing } = useSmoothTableData(tableState, isActivitiesLoading);
  const displayedActivities = displayData.activities;
  const displayedStats = displayData.stats;
  const displayedActivityMeta = displayData.activityMeta;
  const selectedManualSocialAccount = useMemo(
    () => socialAccounts.find((item) => item.id === manualQueueFormState.social_account_id) ?? null,
    [manualQueueFormState.social_account_id, socialAccounts],
  );
  const sortedSocialAccounts = useMemo(
    () => [...socialAccounts].sort((left, right) => left.username.localeCompare(right.username, "id")),
    [socialAccounts],
  );

  const isRepeatMode = mode === "blast" && referenceStatusPreset === "blasted";
  const title = mode === "blast" ? (isRepeatMode ? "Blast Ulang" : "Aktivitas Blast") : "Monitoring Blast";
  const subtitle =
    mode === "blast"
      ? isRepeatMode
        ? "Blast / Riwayat Blast"
        : "Blast / Antrian Blast"
      : "Superadmin / Monitoring Blast";
  const description =
    mode === "blast"
      ? isRepeatMode
        ? "Pilih item blast yang sudah selesai untuk mencatat blast ulang, tanpa mengembalikannya ke halaman utama."
        : "Halaman ini hanya menampilkan konten yang ditandai superadmin untuk masuk antrian blast dan belum selesai diblast."
      : "Tentukan apakah postingan yang sudah valid oleh QCC perlu masuk antrian blast, lalu pantau eksekusinya dari satu halaman.";

  const canSubmit = mode === "blast" && Boolean(selectedReference);
  const canCreateManualQueue =
    mode === "superadmin" &&
    Boolean(manualQueueFormState.social_account_id) &&
    Boolean(manualQueueFormState.post_url.trim());

  const selectedPlatform = selectedReference?.platform ?? formState.platform;

  const handleSelectReference = (item: BlastFeedItem) => {
    setSelectedReference(item);
    setFormState({
      platform: item.platform,
      post_url: item.post_url,
      caption: item.caption ?? "",
      posted_at: "",
      views: "0",
      likes: "0",
      comments: "0",
      shares: "0",
      reposts: "0",
      notes: "",
    });
    requestAnimationFrame(() => {
      blastFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleDecideCandidate = async (item: BlastCandidateItem, shouldBlast: boolean) => {
    try {
      const result = await decide({
        posting_proof_link_id: item.id,
        should_blast: shouldBlast,
      });

      toast.success(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan keputusan blast");
    }
  };

  useEffect(() => {
    if (mode !== "superadmin") {
      return;
    }

    const controller = new AbortController();

    const fetchSocialAccounts = async () => {
      setSocialAccountsLoading(true);
      setSocialAccountsError(null);

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
      } catch (error) {
        if (!controller.signal.aborted) {
          setSocialAccountsError(error instanceof Error ? error.message : "Gagal memuat akun sosmed");
        }
      } finally {
        if (!controller.signal.aborted) {
          setSocialAccountsLoading(false);
        }
      }
    };

    void fetchSocialAccounts();

    return () => controller.abort();
  }, [mode]);

  const handleSubmit = async () => {
    if (!selectedReference) {
      toast.error("Pilih antrian blast terlebih dahulu.");
      return;
    }

    try {
      const result = await create({
        blast_assignment_id: selectedReference.id,
        platform: selectedReference.platform,
        post_url: formState.post_url.trim() || undefined,
        caption: formState.caption.trim() || undefined,
        posted_at: formState.posted_at ? new Date(formState.posted_at).toISOString() : undefined,
        views: Number(formState.views || 0),
        likes: Number(formState.likes || 0),
        comments: Number(formState.comments || 0),
        shares: Number(formState.shares || 0),
        reposts: Number(formState.reposts || 0),
        notes: formState.notes.trim() || undefined,
      });

      toast.success(result.message);
      setSelectedReference(null);
      setFormState({
        platform: "instagram",
        post_url: "",
        caption: "",
        posted_at: "",
        views: "0",
        likes: "0",
        comments: "0",
        shares: "0",
        reposts: "0",
        notes: "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan aktivitas blast");
    }
  };

  const handleCreateManualQueue = async () => {
    if (!manualQueueFormState.social_account_id) {
      toast.error("Pilih akun sosmed target terlebih dahulu.");
      return;
    }

    if (!manualQueueFormState.post_url.trim()) {
      toast.error("Link URL manual wajib diisi.");
      return;
    }

    try {
      const result = await createManualQueue({
        social_account_id: manualQueueFormState.social_account_id,
        reference_title: manualQueueFormState.reference_title.trim() || undefined,
        post_url: manualQueueFormState.post_url.trim(),
        caption: manualQueueFormState.caption.trim() || undefined,
        posted_at: manualQueueFormState.posted_at ? new Date(manualQueueFormState.posted_at).toISOString() : undefined,
        note: manualQueueFormState.note.trim() || undefined,
      });

      toast.success(result.message);
      setManualQueueFormState({
        social_account_id: "",
        reference_title: "",
        post_url: "",
        caption: "",
        posted_at: "",
        note: "",
      });
      setIsManualModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat antrian blast manual");
    }
  };

  const activitySummary = useMemo(
    () => [
      {
        title: "Total Aktivitas",
        value: formatNumber(displayedStats?.total_aktivitas),
        icon: <Radio className="size-5" />,
      },
      {
        title: "Total Views",
        value: formatNumber(displayedStats?.total_views),
        icon: <Eye className="size-5" />,
      },
      {
        title: "Total Likes",
        value: formatNumber(displayedStats?.total_likes),
        icon: <Heart className="size-5" />,
      },
      {
        title: "Total Comments",
        value: formatNumber(displayedStats?.total_comments),
        icon: <MessageCircle className="size-5" />,
      },
      {
        title: "Total Shares",
        value: formatNumber(displayedStats?.total_shares),
        icon: <Share2 className="size-5" />,
      },
      {
        title: "Total Reposts",
        value: formatNumber(displayedStats?.total_reposts),
        icon: <Repeat2 className="size-5" />,
      },
    ],
    [displayedStats],
  );

  const hasActivityFilters =
    activityFilters.platform !== "all" ||
    Boolean(activityFilters.date_from?.trim()) ||
    Boolean(activityFilters.date_to?.trim()) ||
    Boolean(activityFilters.search.trim());
  const hasCandidateFilters = candidateFilters.platform !== "all" || Boolean(candidateFilters.search.trim());
  const hasFeedFilters =
    feedFilters.platform !== "all" ||
    feedFilters.status !== referenceStatusPreset ||
    Boolean(feedFilters.search.trim());
  const activityLoadingLabel = activityFilters.search.trim()
    ? "Mencari aktivitas blast..."
    : hasActivityFilters
      ? "Memuat hasil filter..."
      : "Memuat aktivitas blast...";
  const displayedActivityTotalPages = useMemo(() => {
    if (!displayedActivityMeta) {
      return 1;
    }

    return Math.max(1, Math.ceil(displayedActivityMeta.total / displayedActivityMeta.limit));
  }, [displayedActivityMeta]);

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
          <Badge
            variant="outline"
            className="rounded-full border-emerald-200 bg-background/75 px-3 py-1 text-emerald-700 dark:bg-card/75"
          >
            {subtitle}
          </Badge>
          <div className="space-y-2">
            <h1 className="font-semibold text-3xl tracking-tight">{title}</h1>
            <p className="max-w-3xl text-muted-foreground text-sm leading-6">{description}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {activitySummary.map((item) => (
          <StatsCard key={item.title} title={item.title} value={item.value} icon={item.icon} />
        ))}
      </div>

      {mode === "blast" ? (
        <>
          <Card>
            <CardContent className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-[220px_220px_minmax(0,1fr)_auto]">
                <Select
                  value={feedFilters.platform}
                  onValueChange={(value) =>
                    setFeedFilters((previous) => ({
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
                  value={feedFilters.status}
                  onValueChange={(value) =>
                    setFeedFilters((previous) => ({
                      ...previous,
                      status: value as BlastReferenceStatus,
                      page: 1,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status Blast" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="unblasted">Belum Di-blast</SelectItem>
                    <SelectItem value="blasted">Sudah Pernah Di-blast</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Cari judul, topik, atau wilayah target"
                    value={feedFilters.search}
                    onChange={(event) =>
                      setFeedFilters((previous) => ({ ...previous, search: event.target.value, page: 1 }))
                    }
                  />
                </div>

                <Button variant="outline" onClick={() => resetFeedFilters()} disabled={!hasFeedFilters}>
                  Reset Filter
                </Button>
              </div>

              {feedError ? (
                <div className="text-destructive text-sm">{feedError}</div>
              ) : isFeedLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Spinner />
                  <span>Memuat referensi posting...</span>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {feedItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground text-sm xl:col-span-2">
                      {feedFilters.status === "unblasted"
                        ? "Belum ada antrian blast yang menunggu."
                        : feedFilters.status === "blasted"
                          ? "Belum ada riwayat antrian blast yang selesai."
                          : "Belum ada antrian blast yang cocok."}
                    </div>
                  ) : (
                    feedItems.map((item) => (
                      <FeedReferenceCard
                        key={item.id}
                        item={item}
                        active={selectedReference?.id === item.id}
                        onSelect={handleSelectReference}
                        actionLabel={item.blast_status === "blasted" ? "Blast Ulang" : "Pakai Referensi"}
                      />
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card ref={blastFormRef}>
            <CardContent className="space-y-4">
              {selectedReference ? (
                <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
                  <p className="font-medium">{selectedReference.title}</p>
                  <p className="mt-1 text-muted-foreground">
                    {selectedReference.target_wilayah.nama} • {formatPlatformLabel(selectedReference.platform)}
                  </p>
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="blast-platform" className="font-medium text-sm">
                    Platform
                  </label>
                  <Select
                    value={selectedPlatform}
                    onValueChange={(value) => setFormState((previous) => ({ ...previous, platform: value }))}
                    disabled={Boolean(selectedReference)}
                  >
                    <SelectTrigger id="blast-platform">
                      <SelectValue placeholder="Pilih platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {["instagram", "tiktok", "youtube", "facebook", "x"].map((platform) => (
                        <SelectItem key={platform} value={platform}>
                          {formatPlatformLabel(platform as never)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="blast-posted-at" className="font-medium text-sm">
                    Tanggal Posting
                  </label>
                  <Input
                    id="blast-posted-at"
                    type="datetime-local"
                    value={formState.posted_at}
                    onChange={(event) => setFormState((previous) => ({ ...previous, posted_at: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="blast-post-url" className="font-medium text-sm">
                  Link Blast / Referensi
                </label>
                <Input
                  id="blast-post-url"
                  value={formState.post_url}
                  onChange={(event) => setFormState((previous) => ({ ...previous, post_url: event.target.value }))}
                  placeholder="Link drive atau link blast yang digunakan"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="blast-caption" className="font-medium text-sm">
                  Caption
                </label>
                <Textarea
                  id="blast-caption"
                  value={formState.caption}
                  onChange={(event) => setFormState((previous) => ({ ...previous, caption: event.target.value }))}
                  rows={4}
                  placeholder="Ringkasan caption posting"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-2">
                  <label htmlFor="blast-views" className="font-medium text-sm">
                    Views
                  </label>
                  <Input
                    id="blast-views"
                    type="number"
                    min={0}
                    value={formState.views}
                    onChange={(event) => setFormState((previous) => ({ ...previous, views: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="blast-likes" className="font-medium text-sm">
                    Likes
                  </label>
                  <Input
                    id="blast-likes"
                    type="number"
                    min={0}
                    value={formState.likes}
                    onChange={(event) => setFormState((previous) => ({ ...previous, likes: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="blast-comments" className="font-medium text-sm">
                    Comments
                  </label>
                  <Input
                    id="blast-comments"
                    type="number"
                    min={0}
                    value={formState.comments}
                    onChange={(event) => setFormState((previous) => ({ ...previous, comments: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="blast-shares" className="font-medium text-sm">
                    Shares
                  </label>
                  <Input
                    id="blast-shares"
                    type="number"
                    min={0}
                    value={formState.shares}
                    onChange={(event) => setFormState((previous) => ({ ...previous, shares: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="blast-reposts" className="font-medium text-sm">
                    Reposts
                  </label>
                  <Input
                    id="blast-reposts"
                    type="number"
                    min={0}
                    value={formState.reposts}
                    onChange={(event) => setFormState((previous) => ({ ...previous, reposts: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="blast-notes" className="font-medium text-sm">
                  Catatan
                </label>
                <Textarea
                  id="blast-notes"
                  value={formState.notes}
                  onChange={(event) => setFormState((previous) => ({ ...previous, notes: event.target.value }))}
                  rows={3}
                  placeholder="Catatan tambahan blast"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedReference(null);
                    setFormState({
                      platform: "instagram",
                      post_url: "",
                      caption: "",
                      posted_at: "",
                      views: "0",
                      likes: "0",
                      comments: "0",
                      shares: "0",
                      reposts: "0",
                      notes: "",
                    });
                  }}
                >
                  Reset
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
                  <Send className="mr-2 size-4" />
                  {isSubmitting ? "Menyimpan..." : "Simpan Aktivitas"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      {mode === "superadmin" ? (
        <div className="flex justify-end">
          <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Input Link Blast Manual</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Input Link Blast Manual</DialogTitle>
                <DialogDescription>
                  Superadmin dapat menambahkan link referensi secara manual agar langsung muncul di antrian blast sesuai
                  akun sosmed target.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="manual-social-account" className="font-medium text-sm">
                    Akun Sosmed Target
                  </label>
                  <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="manual-social-account"
                        variant="outline"
                        role="combobox"
                        aria-expanded={isComboboxOpen}
                        className="w-full justify-between font-normal disabled:opacity-50"
                        disabled={isSocialAccountsLoading}
                      >
                        <span className={cn("truncate", !manualQueueFormState.social_account_id && "text-muted-foreground")}>
                          {isSocialAccountsLoading
                            ? "Memuat akun sosmed..."
                            : manualQueueFormState.social_account_id
                              ? `${selectedManualSocialAccount ? `${selectedManualSocialAccount.username} • ${selectedManualSocialAccount.wilayah_name}` : "Akun tidak ditemukan"}`
                              : "Pilih akun sosmed target blast"}
                        </span>
                        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                      <Command>
                        <CommandInput placeholder="Cari akun sosmed..." />
                        <CommandList>
                          <CommandEmpty>Akun sosmed tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {sortedSocialAccounts.map((account) => (
                              <CommandItem
                                key={account.id}
                                value={`${account.username} ${account.wilayah_name}`}
                                onSelect={() => {
                                  setManualQueueFormState((previous) => ({
                                    ...previous,
                                    social_account_id: account.id,
                                  }));
                                  setIsComboboxOpen(false);
                                }}
                              >
                                <span className="truncate max-w-full">{account.username} • {account.wilayah_name}</span>
                                <Check
                                  className={cn(
                                    "ml-auto size-4 shrink-0",
                                    manualQueueFormState.social_account_id === account.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {socialAccountsError ? <p className="text-destructive text-xs">{socialAccountsError}</p> : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="manual-posted-at" className="font-medium text-sm">
                    Tanggal Posting
                  </label>
                  <Input
                    id="manual-posted-at"
                    type="datetime-local"
                    value={manualQueueFormState.posted_at}
                    onChange={(event) =>
                      setManualQueueFormState((previous) => ({
                        ...previous,
                        posted_at: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {selectedManualSocialAccount ? (
                <div className="grid gap-3 rounded-2xl border bg-muted/20 p-4 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Platform</p>
                    <p className="font-medium">{formatPlatformLabel(selectedManualSocialAccount.platform)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Wilayah Target</p>
                    <p className="font-medium">{selectedManualSocialAccount.wilayah_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Akun</p>
                    <p className="font-medium">{selectedManualSocialAccount.username}</p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <label htmlFor="manual-reference-title" className="font-medium text-sm">
                  Judul Referensi
                </label>
                <Input
                  id="manual-reference-title"
                  value={manualQueueFormState.reference_title}
                  onChange={(event) =>
                    setManualQueueFormState((previous) => ({
                      ...previous,
                      reference_title: event.target.value,
                    }))
                  }
                  placeholder="Opsional, misalnya: Blast Kreatif KLH 21 April"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="manual-post-url" className="font-medium text-sm">
                  Link URL
                </label>
                <Input
                  id="manual-post-url"
                  value={manualQueueFormState.post_url}
                  onChange={(event) =>
                    setManualQueueFormState((previous) => ({
                      ...previous,
                      post_url: event.target.value,
                    }))
                  }
                  placeholder="https://www.instagram.com/p/..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="manual-caption" className="font-medium text-sm">
                  Caption
                </label>
                <Textarea
                  id="manual-caption"
                  value={manualQueueFormState.caption}
                  onChange={(event) =>
                    setManualQueueFormState((previous) => ({
                      ...previous,
                      caption: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Opsional, isi caption atau ringkasan referensi posting"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="manual-note" className="font-medium text-sm">
                  Catatan Internal
                </label>
                <Textarea
                  id="manual-note"
                  value={manualQueueFormState.note}
                  onChange={(event) =>
                    setManualQueueFormState((previous) => ({
                      ...previous,
                      note: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Opsional, catatan internal untuk tim blast"
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsManualModalOpen(false);
                    setManualQueueFormState({
                      social_account_id: "",
                      reference_title: "",
                      post_url: "",
                      caption: "",
                      posted_at: "",
                      note: "",
                    });
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateManualQueue}
                  disabled={!canCreateManualQueue || isSubmitting}
                >
                  <Send className="mr-2 size-4" />
                  {isSubmitting ? "Membuat Antrian..." : "Masukkan ke Antrian Blast"}
                </Button>
              </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : null}

      {mode === "superadmin" ? (
        <Card>
          <CardHeader>
            <CardTitle>Keputusan Blast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
                <Select
                  value={candidateFilters.platform}
                  onValueChange={(value) =>
                    setCandidateFilters((previous) => ({
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

                <div className="relative">
                  <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Cari link posting, judul konten, PIC, atau wilayah"
                    value={candidateFilters.search}
                    onChange={(event) =>
                      setCandidateFilters((previous) => ({ ...previous, search: event.target.value, page: 1 }))
                    }
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={() =>
                    setCandidateFilters({
                      platform: "all",
                      search: "",
                      page: 1,
                      limit: candidateFilters.limit,
                    })
                  }
                  disabled={!hasCandidateFilters}
                >
                  Reset Filter
                </Button>
              </div>

              {candidateError ? (
                <div className="text-destructive text-sm">{candidateError}</div>
              ) : isCandidatesLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Spinner />
                  <span>Memuat postingan valid...</span>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {candidateItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground text-sm xl:col-span-2">
                      Belum ada postingan valid yang menunggu keputusan blast.
                    </div>
                  ) : (
                    candidateItems.map((item) => (
                      <CandidateCard
                        key={item.id}
                        item={item}
                        isSubmitting={isSubmitting}
                        onDecide={handleDecideCandidate}
                      />
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[220px_180px_180px_minmax(0,1fr)]">
              <Select
                value={activityFilters.platform}
                onValueChange={(value) =>
                  setActivityFilters((previous) => ({
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

              <Input
                aria-label="Tanggal dibuat dari"
                type="date"
                value={activityFilters.date_from ?? ""}
                onChange={(event) =>
                  setActivityFilters((previous) => ({ ...previous, date_from: event.target.value, page: 1 }))
                }
              />

              <Input
                aria-label="Tanggal dibuat sampai"
                type="date"
                value={activityFilters.date_to ?? ""}
                onChange={(event) =>
                  setActivityFilters((previous) => ({ ...previous, date_to: event.target.value, page: 1 }))
                }
              />

              <div className="relative">
                <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Cari link, caption, user blast, atau wilayah"
                  value={activityFilters.search}
                  onChange={(event) =>
                    setActivityFilters((previous) => ({ ...previous, search: event.target.value, page: 1 }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() =>
                  setActivityFilters((previous) => ({
                    ...previous,
                    platform: "all",
                    date_from: "",
                    date_to: "",
                    search: "",
                    page: 1,
                  }))
                }
                disabled={!hasActivityFilters}
              >
                Reset Filter
              </Button>
            </div>
          </div>

          {activitiesError ? (
            <div className="text-destructive text-sm">{activitiesError}</div>
          ) : isInitialLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Spinner />
              <span>Memuat aktivitas blast...</span>
            </div>
          ) : (
            <div className="relative">
              {isRefreshing ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
                  <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
                    <Spinner />
                    <span>{activityLoadingLabel}</span>
                  </div>
                </div>
              ) : null}

              <Table className={isRefreshing ? "opacity-60" : undefined}>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Blast</TableHead>
                    <TableHead>Referensi Blast</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Likes</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Reposts</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead>Dibuat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedActivities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                        Belum ada aktivitas blast.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedActivities.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="align-top">
                          <div className="space-y-1">
                            <p className="font-medium">{item.blast_user.name}</p>
                            <p className="text-muted-foreground text-xs">{item.blast_user.wilayah?.nama ?? "-"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          {item.blast_assignment ? (
                            <div className="space-y-1">
                              <p className="font-medium">{item.blast_assignment.content.title}</p>
                              <p className="text-muted-foreground text-xs">
                                {item.blast_assignment.target_wilayah.nama}
                                {item.blast_assignment.content.submission_code
                                  ? ` • ${item.blast_assignment.content.submission_code}`
                                  : ""}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Log lama / tanpa assignment</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <PlatformIcon platform={item.platform} />
                        </TableCell>
                        <TableCell className="max-w-80 align-top">
                          <div className="space-y-1">
                            <Button asChild variant="link" className="h-auto p-0">
                              <Link href={item.post_url} target="_blank" rel="noreferrer">
                                {item.post_url}
                              </Link>
                            </Button>
                            {item.caption ? (
                              <p className="line-clamp-2 whitespace-normal text-muted-foreground text-xs">
                                {item.caption}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>{formatNumber(item.views)}</TableCell>
                        <TableCell>{formatNumber(item.likes)}</TableCell>
                        <TableCell>{formatNumber(item.comments)}</TableCell>
                        <TableCell>{formatNumber(item.shares)}</TableCell>
                        <TableCell>{formatNumber(item.reposts)}</TableCell>
                        <TableCell>{item.posted_at ? formatDateTime(item.posted_at) : "-"}</TableCell>
                        <TableCell>{formatDateTime(item.created_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {!activitiesError && !isInitialLoading ? (
        <Card size="sm" className="overflow-hidden border-foreground/10">
          <CardContent>
            <TablePagination
              summary={`Halaman ${activityFilters.page} dari ${displayedActivityTotalPages}${displayedActivityMeta ? ` (${displayedActivityMeta.total} total aktivitas)` : ""}`}
              page={activityFilters.page}
              totalPages={displayedActivityTotalPages}
              disabled={isActivitiesLoading}
              onPageChange={(nextPage) => setActivityFilters((previous) => ({ ...previous, page: nextPage }))}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
