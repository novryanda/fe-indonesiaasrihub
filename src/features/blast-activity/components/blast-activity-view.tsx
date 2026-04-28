"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsUpDown,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  Pencil,
  Radio,
  Repeat2,
  Search,
  Send,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type {
  BlastActivityItem,
  BlastCandidateItem,
  BlastFeedItem,
  BlastReferenceStatus,
  BlastSortDirection,
} from "../types/blast-activity.type";

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

type EditableActivityMetrics = {
  views: string;
  likes: string;
  comments: string;
  shares: string;
  reposts: string;
};

function SortDirectionButton({ direction, onToggle }: { direction: BlastSortDirection; onToggle: () => void }) {
  const Icon = direction === "desc" ? ArrowDown : ArrowUp;

  return (
    <Button type="button" variant="ghost" size="sm" className="-ml-3 h-8 px-2" onClick={onToggle}>
      Submit {direction === "desc" ? "Terbaru" : "Terlama"}
      <Icon className="ml-2 size-4" />
    </Button>
  );
}

function HeaderSortButton({ direction, onToggle }: { direction: BlastSortDirection; onToggle: () => void }) {
  const Icon = direction === "desc" ? ArrowDown : ArrowUp;

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      className="h-6 px-1.5"
      aria-label={`Urutkan status submit ${direction === "asc" ? "menaik" : "menurun"}`}
      onClick={onToggle}
    >
      <Icon className="size-3" />
    </Button>
  );
}

function SocialAccountSummary({
  username,
  profileName,
  fallback,
}: {
  username?: string | null;
  profileName?: string | null;
  fallback?: string | null;
}) {
  const displayUsername = username ?? "-";
  const displayProfileName = profileName ?? fallback ?? "-";

  return (
    <div className="max-w-56 space-y-1">
      <p className="truncate font-medium text-sm" title={displayUsername}>
        {displayUsername}
      </p>
      <p className="line-clamp-1 whitespace-normal text-muted-foreground text-xs" title={displayProfileName}>
        {displayProfileName}
      </p>
    </div>
  );
}

function SubmissionStatusBadge({ days }: { days: number | null }) {
  if (days === null) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  if (days <= 0) {
    return (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
        Submit hari ini
      </Badge>
    );
  }

  return <Badge variant="destructive">Lewat {days} hari</Badge>;
}

function getMonthDateRange(monthValue: string) {
  const [yearValue, monthValuePart] = monthValue.split("-");
  const year = Number(yearValue);
  const month = Number(monthValuePart);

  if (!year || !month) {
    return null;
  }

  const monthLabel = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();

  return {
    date_from: `${year}-${monthLabel}-01`,
    date_to: `${year}-${monthLabel}-${String(lastDay).padStart(2, "0")}`,
  };
}

function createKpiYearOptions(totalYears = 5) {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: totalYears }, (_, index) => String(currentYear - index));
}

const KPI_MONTH_OPTIONS = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

export function BlastActivityView({
  mode,
  referenceStatusPreset = "unblasted",
}: {
  mode: "blast" | "superadmin";
  referenceStatusPreset?: Exclude<BlastReferenceStatus, "all">;
}) {
  const allowedRoles = mode === "blast" ? (["blast"] as const) : (["superadmin"] as const);
  const { session, isAuthorized, isPending } = useRoleGuard([...allowedRoles]);
  const {
    feedItems,
    keptFeedItems,
    candidateItems,
    activities,
    stats,
    feedMeta,
    keptFeedMeta,
    candidateMeta,
    candidateFilters,
    setCandidateFilters,
    activityMeta,
    feedFilters,
    setFeedFilters,
    keptFeedFilters,
    setKeptFeedFilters,
    activityFilters,
    setActivityFilters,
    isFeedLoading,
    isKeptFeedLoading,
    isCandidatesLoading,
    isActivitiesLoading,
    isSubmitting,
    candidateError,
    feedError,
    keptFeedError,
    activitiesError,
    resetFeedFilters,
    resetKeptFeedFilters,
    create,
    keep,
    remove,
    updateMetrics,
    decide,
    createManualQueue,
  } = useBlastActivity(mode, mode === "blast" ? referenceStatusPreset : "all");

  const [selectedReference, setSelectedReference] = useState<BlastFeedItem | null>(null);
  const blastFormRef = useRef<HTMLDivElement | null>(null);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountItem[]>([]);
  const [isSocialAccountsLoading, setSocialAccountsLoading] = useState(true);
  const [socialAccountsError, setSocialAccountsError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    platform: "instagram",
    post_url: "",
    proof_drive_link: "",
    caption: "",
    views: "0",
    likes: "0",
    comments: "0",
    shares: "0",
    reposts: "0",
    notes: "",
  });
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingMetrics, setEditingMetrics] = useState<EditableActivityMetrics | null>(null);
  const [manualQueueFormState, setManualQueueFormState] = useState({
    social_account_id: "",
    reference_title: "",
    post_url: "",
    caption: "",
    posted_at: "",
    note: "",
  });
  const [kpiMonth, setKpiMonth] = useState("");
  const [kpiMonthPart, setKpiMonthPart] = useState("all");
  const [kpiYearPart, setKpiYearPart] = useState("all");
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
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const kpiYearOptions = useMemo(() => createKpiYearOptions(), []);

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

  const canSubmit =
    mode === "blast" &&
    Boolean(selectedReference) &&
    (isRepeatMode || selectedReference?.kept_by?.id === currentUserId);
  const canCreateManualQueue =
    mode === "superadmin" &&
    Boolean(manualQueueFormState.social_account_id) &&
    Boolean(manualQueueFormState.post_url.trim());

  const selectedPlatform = selectedReference?.platform ?? formState.platform;

  const handleKpiMonthChange = (value: string) => {
    setKpiMonth(value);

    const monthRange = value ? getMonthDateRange(value) : null;
    setActivityFilters((previous) => ({
      ...previous,
      date_from: monthRange?.date_from ?? "",
      date_to: monthRange?.date_to ?? "",
      page: 1,
    }));
  };

  const handleKpiMonthPartChange = (value: string) => {
    setKpiMonthPart(value);

    if (value === "all") {
      setKpiYearPart("all");
      handleKpiMonthChange("");
      return;
    }

    if (kpiYearPart === "all") {
      return;
    }

    handleKpiMonthChange(`${kpiYearPart}-${value}`);
  };

  const handleKpiYearPartChange = (value: string) => {
    setKpiYearPart(value);

    if (value === "all") {
      setKpiMonthPart("all");
      handleKpiMonthChange("");
      return;
    }

    if (kpiMonthPart === "all") {
      return;
    }

    handleKpiMonthChange(`${value}-${kpiMonthPart}`);
  };

  const handleResetKpiMonthFilter = () => {
    setKpiMonthPart("all");
    setKpiYearPart("all");
    handleKpiMonthChange("");
  };

  const handleToggleFeedSubmitSort = () => {
    setFeedFilters((previous) => ({
      ...previous,
      sort_direction: previous.sort_direction === "asc" ? "desc" : "asc",
      page: 1,
    }));
  };

  const handleToggleKeptSubmitSort = () => {
    setKeptFeedFilters((previous) => ({
      ...previous,
      sort_direction: previous.sort_direction === "asc" ? "desc" : "asc",
      page: 1,
    }));
  };

  const handleSelectReference = (item: BlastFeedItem) => {
    if (!isRepeatMode && item.kept_by?.id !== currentUserId) {
      toast.error("Antrian ini harus di-keep oleh Anda sebelum bisa disubmit.");
      return;
    }

    setSelectedReference(item);
    setFormState({
      platform: item.platform,
      post_url: item.post_url,
      proof_drive_link: "",
      caption: item.caption ?? "",
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

  const handleKeepReference = async (item: BlastFeedItem) => {
    try {
      const result = await keep(item.id);
      toast.success(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal keep antrian blast");
    }
  };

  const handleCopyLink = async (link: string | null | undefined, successMessage = "Link referensi disalin") => {
    if (!link) {
      toast.error("Link referensi tidak tersedia");
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      toast.success(successMessage);
    } catch {
      toast.error("Gagal menyalin link referensi");
    }
  };

  const handleCopyReferenceLink = async (item: BlastFeedItem) => {
    await handleCopyLink(item.post_url || item.drive_link);
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
  }, []);

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
        proof_drive_link: formState.proof_drive_link.trim() || undefined,
        caption: formState.caption.trim() || undefined,
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
        proof_drive_link: "",
        caption: "",
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

  const handleDeleteActivity = async (activityId: string) => {
    const shouldDelete = window.confirm("Hapus aktivitas blast ini?");
    if (!shouldDelete) {
      return;
    }

    try {
      const result = await remove(activityId);
      toast.success(result.message);
      if (selectedReference?.id === result.blast_assignment_id) {
        setSelectedReference(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus aktivitas blast");
    }
  };

  const handleStartEditActivity = (item: BlastActivityItem) => {
    setEditingActivityId(item.id);
    setEditingMetrics({
      views: String(item.views),
      likes: String(item.likes),
      comments: String(item.comments),
      shares: String(item.shares),
      reposts: String(item.reposts),
    });
  };

  const handleCancelEditActivity = () => {
    setEditingActivityId(null);
    setEditingMetrics(null);
  };

  const handleEditMetricChange = (field: keyof EditableActivityMetrics, value: string) => {
    if (!/^\d*$/.test(value)) {
      return;
    }

    setEditingMetrics((previous) => (previous ? { ...previous, [field]: value } : previous));
  };

  const handleSaveActivityMetrics = async (activityId: string) => {
    if (!editingMetrics) {
      return;
    }

    try {
      const result = await updateMetrics(activityId, {
        views: Number(editingMetrics.views || 0),
        likes: Number(editingMetrics.likes || 0),
        comments: Number(editingMetrics.comments || 0),
        shares: Number(editingMetrics.shares || 0),
        reposts: Number(editingMetrics.reposts || 0),
      });

      toast.success(result.message);
      handleCancelEditActivity();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui metrik aktivitas blast");
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
        title: "Pengerjaan Blast",
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
    activityFilters.social_account_id !== "all" ||
    Boolean(activityFilters.date_from?.trim()) ||
    Boolean(activityFilters.date_to?.trim()) ||
    Boolean(activityFilters.search.trim());
  const hasCandidateFilters =
    candidateFilters.platform !== "all" ||
    candidateFilters.social_account_id !== "all" ||
    Boolean(candidateFilters.search.trim());
  const hasFeedFilters =
    feedFilters.platform !== "all" ||
    feedFilters.social_account_id !== "all" ||
    feedFilters.status !== referenceStatusPreset ||
    Boolean(feedFilters.date_from?.trim()) ||
    Boolean(feedFilters.date_to?.trim()) ||
    Boolean(feedFilters.search.trim());
  const activityLoadingLabel = activityFilters.search.trim()
    ? "Mencari aktivitas blast..."
    : hasActivityFilters
      ? "Memuat hasil filter..."
      : "Memuat aktivitas blast...";
  const showActivityActorColumns = mode === "superadmin";
  const displayedActivityTotalPages = useMemo(() => {
    if (!displayedActivityMeta) {
      return 1;
    }

    return Math.max(1, Math.ceil(displayedActivityMeta.total / displayedActivityMeta.limit));
  }, [displayedActivityMeta]);
  const feedTotalPages = useMemo(() => {
    if (!feedMeta) {
      return 1;
    }

    return Math.max(1, Math.ceil(feedMeta.total / feedMeta.limit));
  }, [feedMeta]);
  const keptFeedTotalPages = useMemo(() => {
    if (!keptFeedMeta) {
      return 1;
    }

    return Math.max(1, Math.ceil(keptFeedMeta.total / keptFeedMeta.limit));
  }, [keptFeedMeta]);
  const candidateTotalPages = useMemo(() => {
    if (!candidateMeta) {
      return 1;
    }

    return Math.max(1, Math.ceil(candidateMeta.total / candidateMeta.limit));
  }, [candidateMeta]);
  const toggleCandidateSortDirection = () => {
    setCandidateFilters((previous) => ({
      ...previous,
      sort_direction: previous.sort_direction === "desc" ? "asc" : "desc",
      page: 1,
    }));
  };

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

      <div className="flex justify-end">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Select value={kpiMonthPart} onValueChange={handleKpiMonthPartChange}>
            <SelectTrigger id="blast-kpi-month" className="w-full sm:w-44">
              <SelectValue placeholder="Bulan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Bulan</SelectItem>
              {KPI_MONTH_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={kpiYearPart} onValueChange={handleKpiYearPartChange}>
            <SelectTrigger id="blast-kpi-year" className="w-full sm:w-32">
              <SelectValue placeholder="Tahun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tahun</SelectItem>
              {kpiYearOptions.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={handleResetKpiMonthFilter} disabled={!kpiMonth}>
            Semua Bulan
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {activitySummary.map((item) => (
          <StatsCard key={item.title} title={item.title} value={item.value} icon={item.icon} />
        ))}
      </div>

      {mode === "blast" ? (
        <>
          <Card>
            <CardContent className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-[160px_190px_220px_150px_150px_minmax(0,1fr)_auto]">
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

                <Select
                  value={feedFilters.social_account_id}
                  onValueChange={(value) =>
                    setFeedFilters((previous) => ({
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
                        {account.username} • {account.wilayah_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  aria-label="Tanggal submit dari"
                  title="Tanggal submit dari"
                  type="date"
                  value={feedFilters.date_from ?? ""}
                  onChange={(event) =>
                    setFeedFilters((previous) => ({ ...previous, date_from: event.target.value, page: 1 }))
                  }
                />

                <Input
                  aria-label="Tanggal submit sampai"
                  title="Tanggal submit sampai"
                  type="date"
                  value={feedFilters.date_to ?? ""}
                  onChange={(event) =>
                    setFeedFilters((previous) => ({ ...previous, date_to: event.target.value, page: 1 }))
                  }
                />

                <div className="relative">
                  <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Cari judul, topik, akun, atau wilayah target"
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
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[16rem]">Referensi</TableHead>
                          <TableHead className="w-56 min-w-[12rem] max-w-56">Akun Sosmed</TableHead>
                          {isRepeatMode ? <TableHead className="min-w-[12rem]">Blast Terakhir Oleh</TableHead> : null}
                          <TableHead className="min-w-[8rem]">Platform</TableHead>
                          <TableHead className="min-w-[9rem]">Status</TableHead>
                          {!isRepeatMode ? (
                            <TableHead className="min-w-[9rem]">
                              <div className="flex items-center gap-1">
                                <span>Status Submit</span>
                                <HeaderSortButton
                                  direction={feedFilters.sort_direction}
                                  onToggle={handleToggleFeedSubmitSort}
                                />
                              </div>
                            </TableHead>
                          ) : null}
                          <TableHead className="min-w-[10rem]">Tanggal Submit</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feedItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                              {feedFilters.status === "unblasted"
                                ? "Belum ada antrian blast yang menunggu."
                                : feedFilters.status === "blasted"
                                  ? "Belum ada riwayat antrian blast yang selesai."
                                  : "Belum ada antrian blast yang cocok."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          feedItems.map((item) => {
                            const isActive = selectedReference?.id === item.id;
                            const canUseDirectly = isRepeatMode || item.blast_status === "blasted";
                            const keptById = item.kept_by?.id;
                            const isKeptByOther = Boolean(keptById && keptById !== currentUserId);

                            return (
                              <TableRow key={item.id} data-state={isActive ? "selected" : undefined}>
                                <TableCell className="align-top">
                                  <div className="space-y-1">
                                    <button
                                      type="button"
                                      className="max-w-full cursor-copy text-left font-medium text-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                      title="Klik untuk copy link referensi"
                                      onClick={() => void handleCopyReferenceLink(item)}
                                    >
                                      <span className="line-clamp-1">{item.title}</span>
                                    </button>
                                    <p className="text-muted-foreground text-xs">
                                      {item.target_wilayah.nama}
                                      {item.submission_code ? ` • ${item.submission_code}` : ""}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-56 align-top">
                                  <SocialAccountSummary
                                    username={item.social_account?.username}
                                    profileName={item.social_account?.profile_name}
                                    fallback={item.target_wilayah.nama}
                                  />
                                </TableCell>
                                {isRepeatMode ? (
                                  <TableCell className="align-top">
                                    {item.completed_by ? (
                                      <div className="space-y-1">
                                        <p className="font-medium text-sm">{item.completed_by.name}</p>
                                        <p className="text-muted-foreground text-xs">
                                          {item.completed_by.wilayah?.nama ?? item.target_wilayah.nama}
                                        </p>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                  </TableCell>
                                ) : null}
                                <TableCell className="align-top">
                                  <PlatformIcon platform={item.platform} />
                                </TableCell>
                                <TableCell className="align-top">
                                  <div className="flex flex-col gap-2">
                                    <Badge variant={item.blast_status === "blasted" ? "default" : "secondary"}>
                                      {item.blast_status === "blasted" ? "Sudah Di-blast" : "Belum Di-blast"}
                                    </Badge>
                                    <Badge variant="outline">{item.blast_count} aktivitas</Badge>
                                  </div>
                                </TableCell>
                                {!isRepeatMode ? (
                                  <TableCell className="align-top">
                                    <SubmissionStatusBadge days={item.submission_delay_days} />
                                  </TableCell>
                                ) : null}
                                <TableCell className="align-top text-sm">
                                  {item.submitted_at ? formatDateTime(item.submitted_at) : "-"}
                                </TableCell>
                                <TableCell className="align-top">
                                  <div className="flex justify-end gap-2">
                                    <Button asChild variant="ghost" size="icon-sm" aria-label="Buka postingan">
                                      <Link href={item.post_url} target="_blank" rel="noreferrer">
                                        <ExternalLink className="size-4" />
                                      </Link>
                                    </Button>
                                    <Button
                                      type="button"
                                      variant={isActive ? "default" : "outline"}
                                      size="sm"
                                      disabled={isSubmitting || (!canUseDirectly && isKeptByOther)}
                                      onClick={() =>
                                        canUseDirectly ? handleSelectReference(item) : void handleKeepReference(item)
                                      }
                                    >
                                      {isActive
                                        ? "Dipilih"
                                        : canUseDirectly
                                          ? "Blast Ulang"
                                          : isKeptByOther
                                            ? "Sudah Dikeep"
                                            : "Keep"}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <TablePagination
                    summary={`Halaman ${feedFilters.page} dari ${feedTotalPages}${feedMeta ? ` (${feedMeta.total} total antrian)` : ""}`}
                    page={feedFilters.page}
                    totalPages={feedTotalPages}
                    disabled={isFeedLoading}
                    onPageChange={(nextPage) => setFeedFilters((previous) => ({ ...previous, page: nextPage }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {!isRepeatMode ? (
            <Card>
              <CardHeader>
                <CardTitle>Daftar Keep</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Cari judul, akun, user keep, atau wilayah"
                      value={keptFeedFilters.search}
                      onChange={(event) =>
                        setKeptFeedFilters((previous) => ({ ...previous, search: event.target.value, page: 1 }))
                      }
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => resetKeptFeedFilters()}
                    disabled={!keptFeedFilters.search.trim()}
                  >
                    Reset Filter
                  </Button>
                </div>

                {keptFeedError ? (
                  <div className="text-destructive text-sm">{keptFeedError}</div>
                ) : isKeptFeedLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                    <Spinner />
                    <span>Memuat daftar keep...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[16rem]">Referensi</TableHead>
                            <TableHead className="w-56 min-w-[12rem] max-w-56">Akun Sosmed</TableHead>
                            <TableHead className="min-w-[12rem]">Dikeep Oleh</TableHead>
                            <TableHead className="min-w-[8rem]">Platform</TableHead>
                            <TableHead className="min-w-[9rem]">
                              <div className="flex items-center gap-1">
                                <span>Status Submit</span>
                                <HeaderSortButton
                                  direction={keptFeedFilters.sort_direction}
                                  onToggle={handleToggleKeptSubmitSort}
                                />
                              </div>
                            </TableHead>
                            <TableHead className="min-w-[10rem]">Waktu Keep</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {keptFeedItems.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                Belum ada antrian yang sedang di-keep.
                              </TableCell>
                            </TableRow>
                          ) : (
                            keptFeedItems.map((item) => {
                              const isActive = selectedReference?.id === item.id;
                              const isMine = item.kept_by?.id === currentUserId;

                              return (
                                <TableRow key={item.id} data-state={isActive ? "selected" : undefined}>
                                  <TableCell className="align-top">
                                    <div className="space-y-1">
                                      <button
                                        type="button"
                                        className="max-w-full cursor-copy text-left font-medium text-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        title="Klik untuk copy link referensi"
                                        onClick={() => void handleCopyReferenceLink(item)}
                                      >
                                        <span className="line-clamp-1">{item.title}</span>
                                      </button>
                                      <p className="text-muted-foreground text-xs">
                                        {item.target_wilayah.nama}
                                        {item.submission_code ? ` • ${item.submission_code}` : ""}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="max-w-56 align-top">
                                    <SocialAccountSummary
                                      username={item.social_account?.username}
                                      profileName={item.social_account?.profile_name}
                                      fallback={item.target_wilayah.nama}
                                    />
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <div className="space-y-1">
                                      <p className="font-medium text-sm">{item.kept_by?.name ?? "-"}</p>
                                      <p className="text-muted-foreground text-xs">
                                        {item.kept_by?.wilayah?.nama ?? item.target_wilayah.nama}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <PlatformIcon platform={item.platform} />
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <SubmissionStatusBadge days={item.submission_delay_days} />
                                  </TableCell>
                                  <TableCell className="align-top text-sm">
                                    {item.kept_at ? formatDateTime(item.kept_at) : "-"}
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <div className="flex justify-end gap-2">
                                      <Button asChild variant="ghost" size="icon-sm" aria-label="Buka postingan">
                                        <Link href={item.post_url} target="_blank" rel="noreferrer">
                                          <ExternalLink className="size-4" />
                                        </Link>
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={isActive ? "default" : "outline"}
                                        size="sm"
                                        disabled={!isMine || isSubmitting}
                                        onClick={() => handleSelectReference(item)}
                                      >
                                        {isActive ? "Dipilih" : isMine ? "Kerjakan" : "Dikeep User Lain"}
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <TablePagination
                      summary={`Halaman ${keptFeedFilters.page} dari ${keptFeedTotalPages}${keptFeedMeta ? ` (${keptFeedMeta.total} total keep)` : ""}`}
                      page={keptFeedFilters.page}
                      totalPages={keptFeedTotalPages}
                      disabled={isKeptFeedLoading}
                      onPageChange={(nextPage) => setKeptFeedFilters((previous) => ({ ...previous, page: nextPage }))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

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
                <label htmlFor="blast-proof-drive-link" className="font-medium text-sm">
                  Link Bukti Drive
                </label>
                <Input
                  id="blast-proof-drive-link"
                  type="url"
                  value={formState.proof_drive_link}
                  onChange={(event) =>
                    setFormState((previous) => ({ ...previous, proof_drive_link: event.target.value }))
                  }
                  placeholder="Link Google Drive bukti aktivitas blast"
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
                      proof_drive_link: "",
                      caption: "",
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
                          <span
                            className={cn(
                              "truncate",
                              !manualQueueFormState.social_account_id && "text-muted-foreground",
                            )}
                          >
                            {isSocialAccountsLoading
                              ? "Memuat akun sosmed..."
                              : manualQueueFormState.social_account_id
                                ? `${selectedManualSocialAccount ? `${selectedManualSocialAccount.username} • ${selectedManualSocialAccount.wilayah_name}` : "Akun tidak ditemukan"}`
                                : "Pilih akun sosmed target blast"}
                          </span>
                          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
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
                                  <span className="max-w-full truncate">
                                    {account.username} • {account.wilayah_name}
                                  </span>
                                  <Check
                                    className={cn(
                                      "ml-auto size-4 shrink-0",
                                      manualQueueFormState.social_account_id === account.id
                                        ? "opacity-100"
                                        : "opacity-0",
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
            <div className="grid gap-3 lg:grid-cols-[180px_240px_minmax(0,1fr)_auto]">
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

              <Select
                value={candidateFilters.social_account_id}
                onValueChange={(value) =>
                  setCandidateFilters((previous) => ({
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
                      {account.username} • {account.wilayah_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Cari link posting, judul konten, akun, PIC, atau wilayah"
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
                    social_account_id: "all",
                    sort_direction: "desc",
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
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[16rem]">Konten</TableHead>
                        <TableHead className="w-56 min-w-[12rem] max-w-56">Akun Sosmed</TableHead>
                        <TableHead className="min-w-[12rem]">PIC / Wilayah</TableHead>
                        <TableHead className="min-w-[8rem]">Platform</TableHead>
                        <TableHead className="min-w-[18rem]">Link / Caption</TableHead>
                        <TableHead className="min-w-[10rem]">
                          <SortDirectionButton
                            direction={candidateFilters.sort_direction}
                            onToggle={toggleCandidateSortDirection}
                          />
                        </TableHead>
                        <TableHead className="min-w-[10rem]">Validasi</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidateItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                            Belum ada postingan valid yang menunggu keputusan blast.
                          </TableCell>
                        </TableRow>
                      ) : (
                        candidateItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="align-top">
                              <div className="space-y-1">
                                <p className="font-medium text-sm">{item.posting_proof.bank_content.title}</p>
                                <Button asChild variant="link" className="h-auto p-0 text-xs">
                                  <Link
                                    href={item.posting_proof.bank_content.drive_link}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Buka bank konten
                                  </Link>
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-56 align-top">
                              <SocialAccountSummary
                                username={item.social_account?.username}
                                profileName={item.social_account?.profile_name}
                              />
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="space-y-1">
                                <p className="font-medium text-sm">{item.posting_proof.pic.name}</p>
                                <p className="text-muted-foreground text-xs">
                                  {item.posting_proof.pic.wilayah?.nama ?? "-"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <PlatformIcon platform={item.platform} />
                            </TableCell>
                            <TableCell className="max-w-96 align-top">
                              <div className="space-y-1">
                                <Button asChild variant="link" className="h-auto p-0 text-left text-xs">
                                  <Link href={item.post_url} target="_blank" rel="noreferrer">
                                    {item.post_url}
                                  </Link>
                                </Button>
                                <p className="line-clamp-2 whitespace-normal text-muted-foreground text-xs">
                                  {item.caption?.trim() || "Caption belum tersedia."}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="align-top text-sm">
                              {item.posting_proof.submitted_at ? formatDateTime(item.posting_proof.submitted_at) : "-"}
                            </TableCell>
                            <TableCell className="align-top text-sm">
                              {item.validated_at ? formatDateTime(item.validated_at) : "Sudah valid"}
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isSubmitting}
                                  onClick={() => void handleDecideCandidate(item, false)}
                                >
                                  Tidak Perlu
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={isSubmitting}
                                  onClick={() => void handleDecideCandidate(item, true)}
                                >
                                  Masukkan
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <TablePagination
                  summary={`Halaman ${candidateFilters.page} dari ${candidateTotalPages}${candidateMeta ? ` (${candidateMeta.total} total kandidat)` : ""}`}
                  page={candidateFilters.page}
                  totalPages={candidateTotalPages}
                  disabled={isCandidatesLoading}
                  onPageChange={(nextPage) => setCandidateFilters((previous) => ({ ...previous, page: nextPage }))}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[180px_240px_180px_180px_minmax(0,1fr)]">
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

              <Select
                value={activityFilters.social_account_id}
                onValueChange={(value) =>
                  setActivityFilters((previous) => ({
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
                      {account.username} • {account.wilayah_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                aria-label="Tanggal dibuat dari"
                type="date"
                value={activityFilters.date_from ?? ""}
                onChange={(event) => {
                  setKpiMonth("");
                  setActivityFilters((previous) => ({ ...previous, date_from: event.target.value, page: 1 }));
                }}
              />

              <Input
                aria-label="Tanggal dibuat sampai"
                type="date"
                value={activityFilters.date_to ?? ""}
                onChange={(event) => {
                  setKpiMonth("");
                  setActivityFilters((previous) => ({ ...previous, date_to: event.target.value, page: 1 }));
                }}
              />

              <div className="relative">
                <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Cari link, caption, akun"
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
                onClick={() => {
                  setKpiMonth("");
                  setActivityFilters((previous) => ({
                    ...previous,
                    platform: "all",
                    social_account_id: "all",
                    date_from: "",
                    date_to: "",
                    search: "",
                    page: 1,
                  }));
                }}
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

              <div className="overflow-x-auto">
                <Table className={isRefreshing ? "opacity-60" : undefined}>
                  <TableHeader>
                    <TableRow>
                      {showActivityActorColumns ? <TableHead>User Blast</TableHead> : null}
                      {showActivityActorColumns ? <TableHead>Dikeep Oleh</TableHead> : null}
                      <TableHead>Referensi Blast</TableHead>
                      <TableHead className="w-56 min-w-[12rem] max-w-56">Akun Sosmed</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Likes</TableHead>
                      <TableHead>Comments</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Reposts</TableHead>
                      <TableHead>Waktu Submit</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedActivities.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={showActivityActorColumns ? 12 : 10}
                          className="h-24 text-center text-muted-foreground"
                        >
                          Belum ada aktivitas blast.
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedActivities.map((item) => {
                        const canManageActivity = mode === "superadmin" || mode === "blast";
                        const rowEditingMetrics = editingActivityId === item.id ? editingMetrics : null;
                        const isEditingRow = rowEditingMetrics !== null;

                        return (
                          <TableRow key={item.id}>
                            {showActivityActorColumns ? (
                              <TableCell className="align-top">
                                <div className="space-y-1">
                                  <p className="font-medium">{item.blast_user.name}</p>
                                  <p className="text-muted-foreground text-xs">
                                    {item.blast_user.wilayah?.nama ?? "-"}
                                  </p>
                                </div>
                              </TableCell>
                            ) : null}
                            {showActivityActorColumns ? (
                              <TableCell className="align-top">
                                {item.blast_assignment?.kept_by ? (
                                  <div className="space-y-1">
                                    <p className="font-medium text-sm">{item.blast_assignment.kept_by.name}</p>
                                    <p className="text-muted-foreground text-xs">
                                      {item.blast_assignment.kept_at
                                        ? formatDateTime(item.blast_assignment.kept_at)
                                        : (item.blast_assignment.kept_by.wilayah?.nama ?? "-")}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </TableCell>
                            ) : null}
                            <TableCell className="align-top">
                              {item.blast_assignment ? (
                                <div className="space-y-1">
                                  <button
                                    type="button"
                                    className="max-w-full cursor-copy text-left font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    title="Klik untuk copy link referensi"
                                    onClick={() =>
                                      void handleCopyLink(
                                        item.blast_assignment?.content.drive_link ?? item.post_url,
                                        "Link referensi blast disalin",
                                      )
                                    }
                                  >
                                    <span className="line-clamp-1">{item.blast_assignment.content.title}</span>
                                  </button>
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
                            <TableCell className="max-w-56 align-top">
                              <SocialAccountSummary
                                username={item.social_account?.username}
                                profileName={item.social_account?.profile_name}
                              />
                            </TableCell>
                            <TableCell className="align-top">
                              <PlatformIcon platform={item.platform} />
                            </TableCell>
                            <TableCell className="min-w-[6.5rem]">
                              {isEditingRow ? (
                                <Input
                                  inputMode="numeric"
                                  value={rowEditingMetrics.views}
                                  onChange={(event) => handleEditMetricChange("views", event.target.value)}
                                  className="h-8"
                                />
                              ) : (
                                formatNumber(item.views)
                              )}
                            </TableCell>
                            <TableCell className="min-w-[6.5rem]">
                              {isEditingRow ? (
                                <Input
                                  inputMode="numeric"
                                  value={rowEditingMetrics.likes}
                                  onChange={(event) => handleEditMetricChange("likes", event.target.value)}
                                  className="h-8"
                                />
                              ) : (
                                formatNumber(item.likes)
                              )}
                            </TableCell>
                            <TableCell className="min-w-[6.5rem]">
                              {isEditingRow ? (
                                <Input
                                  inputMode="numeric"
                                  value={rowEditingMetrics.comments}
                                  onChange={(event) => handleEditMetricChange("comments", event.target.value)}
                                  className="h-8"
                                />
                              ) : (
                                formatNumber(item.comments)
                              )}
                            </TableCell>
                            <TableCell className="min-w-[6.5rem]">
                              {isEditingRow ? (
                                <Input
                                  inputMode="numeric"
                                  value={rowEditingMetrics.shares}
                                  onChange={(event) => handleEditMetricChange("shares", event.target.value)}
                                  className="h-8"
                                />
                              ) : (
                                formatNumber(item.shares)
                              )}
                            </TableCell>
                            <TableCell className="min-w-[6.5rem]">
                              {isEditingRow ? (
                                <Input
                                  inputMode="numeric"
                                  value={rowEditingMetrics.reposts}
                                  onChange={(event) => handleEditMetricChange("reposts", event.target.value)}
                                  className="h-8"
                                />
                              ) : (
                                formatNumber(item.reposts)
                              )}
                            </TableCell>
                            <TableCell>
                              {item.posted_at ? formatDateTime(item.posted_at) : formatDateTime(item.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              {canManageActivity ? (
                                <div className="flex justify-end gap-1">
                                  {isEditingRow ? (
                                    <>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        disabled={isSubmitting}
                                        aria-label="Simpan perubahan metrik"
                                        onClick={() => void handleSaveActivityMetrics(item.id)}
                                      >
                                        <Check className="size-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        disabled={isSubmitting}
                                        aria-label="Batal edit metrik"
                                        onClick={handleCancelEditActivity}
                                      >
                                        <X className="size-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      disabled={isSubmitting}
                                      aria-label="Edit metrik aktivitas blast"
                                      onClick={() => handleStartEditActivity(item)}
                                    >
                                      <Pencil className="size-4" />
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    disabled={isSubmitting}
                                    aria-label="Hapus aktivitas blast"
                                    onClick={() => void handleDeleteActivity(item.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
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
