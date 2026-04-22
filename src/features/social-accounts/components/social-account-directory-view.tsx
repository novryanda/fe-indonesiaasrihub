"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { Spinner as HeroSpinner } from "@heroui/react";
import {
  Check,
  ChevronsUpDown,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Textarea } from "@/components/ui/textarea";
import { PlatformIcon } from "@/features/content-shared/components/platform-icon";
import { formatPlatformLabel, formatTimeAgo } from "@/features/content-shared/utils/content-formatters";
import { cn } from "@/lib/utils";
import { listWilayahOptions, type WilayahOption } from "@/shared/api/wilayah";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";
import { useSmoothLoadingState, useSmoothTableData } from "@/shared/hooks/use-smooth-loading-state";

import {
  createSocialAccount,
  deleteSocialAccount,
  listSocialAccounts,
  toggleSocialAccountAutoBlast,
  updateSocialAccount,
} from "../api/social-accounts-api";
import {
  ESELON_1_OPTIONS,
  ESELON_2_OPTIONS,
  type SocialAccountEselon1,
  type SocialAccountEselon2,
} from "../constants/social-account-eselon";
import type {
  CreateSocialAccountPayload,
  SocialAccountDelegationStatus,
  SocialAccountItem,
  SocialAccountListMeta,
  UpdateSocialAccountPayload,
} from "../types/social-account.type";

const PLATFORM_OPTIONS = ["instagram", "tiktok", "youtube", "facebook", "x"] as const;
const ACCOUNT_TYPE_OPTIONS = [
  { value: "government", label: "Government" },
  { value: "bisnis", label: "Bisnis" },
  { value: "personal", label: "Personal" },
] as const;
const DELEGATION_FILTER_OPTIONS: Array<{
  value: "all" | SocialAccountDelegationStatus;
  label: string;
}> = [
  { value: "all", label: "Semua Delegasi" },
  { value: "sudah_didelegasikan", label: "Sudah Didelegasikan" },
  { value: "belum_didelegasikan", label: "Belum Didelegasikan" },
  { value: "delegasi_dicabut", label: "Delegasi Dicabut" },
];

const numberFormatter = new Intl.NumberFormat("id-ID");
const compactNumberFormatter = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const PAGE_SIZE = 10;
const initialMeta: SocialAccountListMeta = { page: 1, limit: PAGE_SIZE, total: 0 };
type OptionalTableColumnId =
  | "platform"
  | "wilayah"
  | "pic_sosmed"
  | "followers"
  | "delegasi"
  | "wajib_blast"
  | "update";

const OPTIONAL_TABLE_COLUMNS: Array<{
  id: OptionalTableColumnId;
  label: string;
}> = [
  { id: "platform", label: "Platform" },
  { id: "wilayah", label: "Wilayah" },
  { id: "pic_sosmed", label: "PIC Sosmed" },
  { id: "followers", label: "Followers" },
  { id: "delegasi", label: "Delegasi" },
  { id: "wajib_blast", label: "Wajib Blast" },
  { id: "update", label: "Update" },
];

const INITIAL_VISIBLE_COLUMNS: Record<OptionalTableColumnId, boolean> = {
  platform: true,
  wilayah: true,
  pic_sosmed: true,
  followers: false,
  delegasi: false,
  wajib_blast: false,
  update: false,
};

function SearchableSelect({
  label,
  placeholder,
  value,
  options,
  onValueChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: readonly string[];
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate text-left", !value && "text-muted-foreground")}>{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder={`Cari ${label.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>{label} tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onValueChange(option);
                    setOpen(false);
                  }}
                >
                  <span className="max-w-full truncate">{option}</span>
                  <Check className={cn("ml-auto size-4 shrink-0", value === option ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function getVerificationBadge(status: SocialAccountItem["verification_status"]) {
  switch (status) {
    case "verified":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getDelegationBadge(status: SocialAccountItem["delegation_status"]) {
  switch (status) {
    case "sudah_didelegasikan":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "delegasi_dicabut":
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
    default:
      return "border-orange-200 bg-orange-50 text-orange-700";
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

type SocialAccountFormState = Omit<CreateSocialAccountPayload, "eselon_1" | "eselon_2"> & {
  eselon_1: SocialAccountEselon1 | "";
  eselon_2: SocialAccountEselon2 | "";
};

const initialForm: SocialAccountFormState = {
  wilayah: "",
  platform: "instagram",
  username: "",
  profile_url: "",
  nama_profil: "",
  tipe_akun: "government",
  eselon_1: "",
  eselon_2: "",
  followers: 0,
  deskripsi: "",
};

export function SocialAccountDirectoryView() {
  const { isAuthorized, isPending } = useRoleGuard(["superadmin"]);
  const [items, setItems] = useState<SocialAccountItem[]>([]);
  const [wilayahOptions, setWilayahOptions] = useState<WilayahOption[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<SocialAccountListMeta>(initialMeta);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingAutoBlastIds, setPendingAutoBlastIds] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SocialAccountItem | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<SocialAccountItem | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | SocialAccountItem["platform"]>("all");
  const [isPlatformFilterOpen, setIsPlatformFilterOpen] = useState(false);
  const [delegationFilter, setDelegationFilter] = useState<"all" | SocialAccountDelegationStatus>("all");
  const [visibleColumns, setVisibleColumns] = useState(INITIAL_VISIBLE_COLUMNS);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const tableState = useMemo(() => ({ items, meta }), [items, meta]);
  const { displayData, isInitialLoading, isRefreshing } = useSmoothTableData(tableState, isLoading);
  const displayedItems = displayData.items;
  const displayedMeta = displayData.meta;

  const resetFormState = () => {
    setForm(initialForm);
    setEditingAccount(null);
  };

  const openCreateDialog = () => {
    resetFormState();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: SocialAccountItem) => {
    setEditingAccount(item);
    setForm({
      wilayah: item.wilayah_id,
      platform: item.platform,
      username: item.username.replace(/^@/, ""),
      profile_url: item.profile_url,
      nama_profil: item.nama_profil,
      tipe_akun: item.tipe_akun,
      eselon_1: item.eselon_1 ?? "",
      eselon_2: item.eselon_2 ?? "",
      followers: item.followers,
      deskripsi: item.description ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetFormState();
    }
  };

  const validateForm = () => {
    if (!form.wilayah.trim()) {
      toast.error("Wilayah akun wajib diisi.");
      return false;
    }

    if (!form.username.trim()) {
      toast.error("Username akun wajib diisi.");
      return false;
    }

    if (!form.profile_url.trim()) {
      toast.error("Profile URL wajib diisi.");
      return false;
    }

    if (!form.nama_profil.trim()) {
      toast.error("Nama profil wajib diisi.");
      return false;
    }

    if (!form.eselon_1) {
      toast.error("Eselon 1 wajib dipilih.");
      return false;
    }

    if (!form.eselon_2) {
      toast.error("Eselon 2 wajib dipilih.");
      return false;
    }

    return true;
  };

  const toUpdatePayload = (): UpdateSocialAccountPayload => ({
    wilayah: form.wilayah,
    platform: form.platform,
    username: form.username,
    profile_url: form.profile_url,
    nama_profil: form.nama_profil,
    tipe_akun: form.tipe_akun,
    eselon_1: form.eselon_1 as SocialAccountEselon1,
    eselon_2: form.eselon_2 as SocialAccountEselon2,
    followers: form.followers,
    deskripsi: form.deskripsi,
  });

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAccount) {
        await updateSocialAccount(editingAccount.id, toUpdatePayload());
        toast.success("Akun sosmed berhasil diperbarui.");
      } else {
        await createSocialAccount(toUpdatePayload());
        toast.success("Akun sosmed berhasil didaftarkan.");
      }

      handleDialogOpenChange(false);
      await loadAccounts();
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal menyimpan akun sosmed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAccount) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteSocialAccount(deletingAccount.id);
      toast.success("Akun sosmed berhasil dihapus.");
      setDeletingAccount(null);
      if (items.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
        return;
      }
      await loadAccounts();
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal menghapus akun sosmed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleAutoBlast = async (item: SocialAccountItem, enabled: boolean) => {
    setPendingAutoBlastIds((previous) => (previous.includes(item.id) ? previous : [...previous, item.id]));

    try {
      const response = await toggleSocialAccountAutoBlast(item.id, { enabled });

      setItems((previous) =>
        previous.map((entry) =>
          entry.id === item.id ? { ...entry, auto_blast_enabled: response.data.auto_blast_enabled } : entry,
        ),
      );

      toast.success(response.data.message);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memperbarui pengaturan wajib blast");
    } finally {
      setPendingAutoBlastIds((previous) => previous.filter((entryId) => entryId !== item.id));
    }
  };

  const handleToggleColumn = (columnId: OptionalTableColumnId, checked: boolean) => {
    setVisibleColumns((previous) => ({
      ...previous,
      [columnId]: checked,
    }));
  };

  const loadAccounts = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      try {
        const [response, wilayahList] = await Promise.all([
          listSocialAccounts(
            {
              page,
              limit: PAGE_SIZE,
              search,
              platform: platformFilter,
              delegation_status: delegationFilter,
            },
            signal,
          ),
          listWilayahOptions(),
        ]);

        if (signal?.aborted) {
          return;
        }

        setItems(response.data);
        setWilayahOptions(wilayahList);
        setMeta(response.meta ?? { ...initialMeta, page, total: response.data.length });
      } catch (errorValue) {
        if (signal?.aborted) {
          return;
        }

        toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat daftar akun sosmed");
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [delegationFilter, page, platformFilter, search],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = searchInput.trim();

      if (nextSearch === search) {
        return;
      }

      setPage(1);
      setSearch(nextSearch);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search, searchInput]);

  useEffect(() => {
    if (isPending || !isAuthorized) {
      return;
    }

    const controller = new AbortController();
    void loadAccounts(controller.signal);

    return () => controller.abort();
  }, [isAuthorized, isPending, loadAccounts]);

  const summaryCards = useMemo(() => {
    const fallbackVerifiedCount = displayedItems.filter((item) => item.verification_status === "verified").length;
    const fallbackDelegatedCount = displayedItems.filter(
      (item) => item.delegation_status === "sudah_didelegasikan",
    ).length;
    const fallbackTotalFollowers = displayedItems.reduce((total, item) => total + item.followers, 0);
    const summary = displayedMeta.summary;
    const totalAccounts = summary?.total_accounts ?? displayedItems.length;
    const verifiedCount = summary?.verified_accounts ?? fallbackVerifiedCount;
    const delegatedCount = summary?.delegated_accounts ?? fallbackDelegatedCount;
    const totalFollowers = summary?.total_followers ?? fallbackTotalFollowers;

    return [
      {
        label: "Total Akun",
        value: numberFormatter.format(totalAccounts),
        helper: "Akun aktif yang sudah terdaftar",
      },
      {
        label: "Akun Terverifikasi",
        value: numberFormatter.format(verifiedCount),
        helper: "Sudah lolos validasi akun",
      },
      {
        label: "Sudah Didelegasikan",
        value: numberFormatter.format(delegatedCount),
        helper: "Sudah punya PIC sosmed",
      },
      {
        label: "Total Followers",
        value: compactNumberFormatter.format(totalFollowers),
        helper: "Akumulasi follower seluruh akun",
      },
    ];
  }, [displayedItems, displayedMeta.summary]);

  const totalPages = Math.max(1, Math.ceil(displayedMeta.total / displayedMeta.limit));
  const visibleOptionalColumnCount = OPTIONAL_TABLE_COLUMNS.filter((column) => visibleColumns[column.id]).length;
  const visibleTableColumnCount = visibleOptionalColumnCount + 2;
  const summaryText =
    displayedMeta.total === 0
      ? "Halaman 1 dari 1 (0 total akun)"
      : `Halaman ${page} dari ${totalPages} (${displayedMeta.total} total akun)`;
  const hasActiveFilters = Boolean(search) || platformFilter !== "all" || delegationFilter !== "all";
  const isSearchPending = searchInput.trim() !== search || (isLoading && searchInput.trim().length > 0);
  const showSearchIndicator = useSmoothLoadingState(isSearchPending, { delayMs: 100, minVisibleMs: 260 });
  const loadingLabel = search
    ? "Mencari akun sosmed..."
    : hasActiveFilters
      ? "Memuat hasil filter..."
      : "Memuat akun sosmed...";

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
    <>
      <section className="min-w-0 space-y-6">
        <Card className="app-bg-hero app-border-soft overflow-hidden">
          <CardContent className="min-w-0 space-y-6 px-6 py-8 md:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-3">
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-200 bg-background/75 px-3 py-1 text-emerald-700 dark:bg-card/75"
                >
                  Akun / Daftar Akun Sosmed
                </Badge>
                <div className="space-y-2">
                  <h1 className="font-semibold text-3xl tracking-tight">Daftar Akun Sosmed</h1>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/70 bg-white/70 px-5 py-4 shadow-sm">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">{item.label}</p>
                  <p className="mt-3 font-semibold text-3xl tracking-tight">{item.value}</p>
                  <p className="mt-2 text-muted-foreground text-sm">{item.helper}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-foreground/10">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
                <div className="relative min-w-0 md:w-[22rem] md:flex-none">
                  <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
                  <Input
                    className="pr-10 pl-9"
                    placeholder="Cari nama profil, username, wilayah, atau PIC"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                  />
                  {showSearchIndicator ? (
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                      <HeroSpinner size="sm" />
                    </div>
                  ) : null}
                </div>

                <Popover open={isPlatformFilterOpen} onOpenChange={setIsPlatformFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={isPlatformFilterOpen}
                      className="justify-between font-normal md:w-[11rem]"
                    >
                      {platformFilter === "all" ? (
                        <span className="text-muted-foreground">Semua Platform</span>
                      ) : (
                        <span className="flex items-center gap-2 truncate">
                          <PlatformIcon platform={platformFilter} />
                          <span>{formatPlatformLabel(platformFilter)}</span>
                        </span>
                      )}
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              setPlatformFilter("all");
                              setPage(1);
                              setIsPlatformFilterOpen(false);
                            }}
                          >
                            <span className="flex items-center gap-2">Semua Platform</span>
                            <Check
                              className={cn(
                                "ml-auto size-4 shrink-0",
                                platformFilter === "all" ? "opacity-100" : "opacity-0",
                              )}
                            />
                          </CommandItem>
                          {PLATFORM_OPTIONS.map((platform) => (
                            <CommandItem
                              key={platform}
                              value={platform}
                              onSelect={() => {
                                setPlatformFilter(platform);
                                setPage(1);
                                setIsPlatformFilterOpen(false);
                              }}
                            >
                              <span className="flex items-center gap-2">
                                <PlatformIcon platform={platform} />
                                <span>{formatPlatformLabel(platform)}</span>
                              </span>
                              <Check
                                className={cn(
                                  "ml-auto size-4 shrink-0",
                                  platformFilter === platform ? "opacity-100" : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Select
                  value={delegationFilter}
                  onValueChange={(value) => {
                    setDelegationFilter(value as typeof delegationFilter);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="md:w-[12rem]">
                    <SelectValue placeholder="Semua Delegasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {DELEGATION_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:flex-none xl:justify-end">
                <Popover open={isColumnSelectorOpen} onOpenChange={setIsColumnSelectorOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline">
                      <SlidersHorizontal className="mr-2 size-4" />
                      {`Tampilan Kolom (${visibleOptionalColumnCount})`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-60 p-3">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">Pilih kolom yang ditampilkan</p>
                        <p className="text-muted-foreground text-xs">
                          Centang kolom yang ingin tetap terlihat di tabel.
                        </p>
                      </div>
                      <div className="space-y-2">
                        {OPTIONAL_TABLE_COLUMNS.map((column) => (
                          <label
                            key={column.id}
                            htmlFor={`column-visibility-${column.id}`}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-sm hover:bg-muted/50"
                          >
                            <Checkbox
                              id={`column-visibility-${column.id}`}
                              checked={visibleColumns[column.id]}
                              onCheckedChange={(checked) => handleToggleColumn(column.id, checked === true)}
                            />
                            <span>{column.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasActiveFilters && !isLoading}
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setPlatformFilter("all");
                    setDelegationFilter("all");
                    setPage(1);
                  }}
                >
                  Reset Filter
                </Button>
                <Button type="button" onClick={openCreateDialog}>
                  <Plus className="mr-2 size-4" />
                  Daftarkan Akun
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="overflow-hidden border-foreground/10">
          <CardContent className="min-w-0">
            {isInitialLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Spinner />
                <span>Memuat akun sosmed...</span>
              </div>
            ) : (
              <div className="relative">
                {isRefreshing ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
                    <div className="flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                      <HeroSpinner size="lg" />
                      <span>{loadingLabel}</span>
                    </div>
                  </div>
                ) : null}

                <Table className={isRefreshing ? "opacity-60" : undefined}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[260px]">Akun</TableHead>
                      {visibleColumns.platform ? <TableHead>Platform</TableHead> : null}
                      {visibleColumns.wilayah ? <TableHead>Wilayah</TableHead> : null}
                      {visibleColumns.pic_sosmed ? <TableHead>PIC Sosmed</TableHead> : null}
                      {visibleColumns.followers ? <TableHead>Followers</TableHead> : null}
                      {/* Status column removed */}
                      {visibleColumns.delegasi ? <TableHead>Delegasi</TableHead> : null}
                      {visibleColumns.wajib_blast ? <TableHead>Wajib Blast</TableHead> : null}
                      {visibleColumns.update ? <TableHead>Update</TableHead> : null}
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={visibleTableColumnCount} className="h-28 text-center text-muted-foreground">
                          {search
                            ? "Tidak ada akun sosmed yang cocok dengan pencarian."
                            : "Belum ada akun sosmed yang terdaftar."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="max-w-[20rem] whitespace-normal align-top">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium">{item.nama_profil}</p>
                                <PlatformIcon platform={item.platform} />
                              </div>
                              <div className="space-y-1 text-muted-foreground text-sm">
                                <p>{item.username}</p>
                                <p className="line-clamp-1">{item.profile_url}</p>
                              </div>
                            </div>
                          </TableCell>
                          {visibleColumns.platform ? (
                            <TableCell className="align-top">
                              <div className="space-y-1 text-sm">
                                <PlatformIcon platform={item.platform} />
                                <p className="text-muted-foreground capitalize">{item.tipe_akun}</p>
                              </div>
                            </TableCell>
                          ) : null}
                          {visibleColumns.wilayah ? (
                            <TableCell className="whitespace-normal align-top">
                              <div className="space-y-1 text-sm">
                                <p className="font-medium">{item.wilayah_name}</p>
                                <p className="text-muted-foreground">{item.eselon_2 ?? item.eselon_1 ?? "-"}</p>
                              </div>
                            </TableCell>
                          ) : null}
                          {visibleColumns.pic_sosmed ? (
                            <TableCell className="max-w-[14rem] whitespace-normal align-top">
                              <div className="space-y-1 text-sm">
                                <p className="font-medium">{item.officer_name ?? "Belum didelegasikan"}</p>
                                <p className="text-muted-foreground">
                                  {item.officer_regional ?? item.added_by.regional ?? "-"}
                                </p>
                              </div>
                            </TableCell>
                          ) : null}
                          {visibleColumns.followers ? (
                            <TableCell className="align-top">
                              <div className="space-y-1 text-sm">
                                <p className="font-medium">{numberFormatter.format(item.followers)}</p>
                                <p className="text-muted-foreground">
                                  {item.last_stat_update
                                    ? `Update ${formatTimeAgo(item.last_stat_update)}`
                                    : "Belum ada snapshot"}
                                </p>
                              </div>
                            </TableCell>
                          ) : null}
                          {/* Status column removed */}
                          {visibleColumns.delegasi ? (
                            <TableCell className="max-w-[13rem] whitespace-normal align-top">
                              <div className="space-y-2">
                                <Badge
                                  variant="outline"
                                  className={cn("rounded-full px-3 py-1", getDelegationBadge(item.delegation_status))}
                                >
                                  {item.delegation_status.replaceAll("_", " ")}
                                </Badge>
                                <p className="max-w-44 whitespace-normal text-muted-foreground text-xs leading-5">
                                  {item.delegated_by ? `Oleh ${item.delegated_by.name}` : "Belum ada history delegasi"}
                                </p>
                              </div>
                            </TableCell>
                          ) : null}
                          {visibleColumns.wajib_blast ? (
                            <TableCell className="max-w-[15rem] whitespace-normal align-top">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <Switch
                                    checked={item.auto_blast_enabled}
                                    disabled={isLoading || pendingAutoBlastIds.includes(item.id)}
                                    aria-label={`Toggle wajib blast untuk ${item.nama_profil}`}
                                    onCheckedChange={(checked) => void handleToggleAutoBlast(item, checked)}
                                  />
                                  <span className="font-medium text-sm">
                                    {item.auto_blast_enabled ? "Aktif" : "Nonaktif"}
                                  </span>
                                </div>
                                <p className="max-w-52 whitespace-normal text-muted-foreground text-xs leading-5">
                                  {pendingAutoBlastIds.includes(item.id)
                                    ? "Menyimpan pengaturan wajib blast..."
                                    : item.auto_blast_enabled
                                      ? "Posting valid dari akun ini otomatis masuk antrian blast."
                                      : "Posting valid dari akun ini tetap menunggu keputusan superadmin."}
                                </p>
                              </div>
                            </TableCell>
                          ) : null}
                          {visibleColumns.update ? (
                            <TableCell className="whitespace-normal align-top">
                              <div className="space-y-1 text-sm">
                                <p className="font-medium">{formatDate(item.created_at)}</p>
                                <p className="text-muted-foreground">Ditambahkan {formatTimeAgo(item.created_at)}</p>
                              </div>
                            </TableCell>
                          ) : null}
                          <TableCell className="align-top">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/akun/daftar-akun/${item.id}`}>Detail</Link>
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() => openEditDialog(item)}
                                aria-label={`Edit ${item.nama_profil}`}
                                title="Edit"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button asChild type="button" variant="outline" size="icon" className="size-8">
                                <a href={item.profile_url} target="_blank" rel="noreferrer" aria-label="Buka profil">
                                  <ExternalLink className="size-4" />
                                </a>
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="size-8"
                                onClick={() => setDeletingAccount(item)}
                                aria-label={`Hapus ${item.nama_profil}`}
                                title="Hapus"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card size="sm" className="overflow-hidden border-foreground/10">
          <CardContent className="px-6">
            <TablePagination
              summary={summaryText}
              page={page}
              totalPages={totalPages}
              disabled={isLoading}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      </section>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit Akun Sosmed" : "Daftarkan Akun Sosmed"}</DialogTitle>
            <DialogDescription>
              {editingAccount
                ? "Perbarui metadata akun sosmed yang sudah terdaftar."
                : "Lengkapi metadata akun sosmed beserta informasi eselon 1 dan eselon 2."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Wilayah Akun</Label>
              <Select
                value={form.wilayah}
                onValueChange={(value) => setForm((previous) => ({ ...previous, wilayah: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih wilayah akun" />
                </SelectTrigger>
                <SelectContent>
                  {wilayahOptions.map((wilayah) => (
                    <SelectItem key={wilayah.id} value={wilayah.id}>
                      {wilayah.nama} ({wilayah.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Platform</Label>
              <Select
                value={form.platform}
                onValueChange={(value) =>
                  setForm((previous) => ({ ...previous, platform: value as CreateSocialAccountPayload["platform"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {formatPlatformLabel(platform)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Username</Label>
              <Input
                value={form.username}
                onChange={(event) => setForm((previous) => ({ ...previous, username: event.target.value }))}
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label>Profile URL</Label>
              <Input
                value={form.profile_url}
                onChange={(event) => setForm((previous) => ({ ...previous, profile_url: event.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label>Nama Profil</Label>
              <Input
                value={form.nama_profil}
                onChange={(event) => setForm((previous) => ({ ...previous, nama_profil: event.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label>Tipe Akun</Label>
              <Select
                value={form.tipe_akun}
                onValueChange={(value) =>
                  setForm((previous) => ({ ...previous, tipe_akun: value as CreateSocialAccountPayload["tipe_akun"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe akun" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label>Eselon 1</Label>
              <SearchableSelect
                label="Eselon 1"
                placeholder="Pilih eselon 1"
                value={form.eselon_1}
                options={ESELON_1_OPTIONS}
                onValueChange={(value) =>
                  setForm((previous) => ({ ...previous, eselon_1: value as SocialAccountEselon1 }))
                }
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label>Eselon 2</Label>
              <SearchableSelect
                label="Eselon 2"
                placeholder="Pilih eselon 2"
                value={form.eselon_2}
                options={ESELON_2_OPTIONS}
                onValueChange={(value) =>
                  setForm((previous) => ({ ...previous, eselon_2: value as SocialAccountEselon2 }))
                }
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={form.deskripsi ?? ""}
                onChange={(event) => setForm((previous) => ({ ...previous, deskripsi: event.target.value }))}
              />
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sky-800 text-sm md:col-span-2">
              Jumlah followers akan diperbarui otomatis oleh sistem setelah akun berhasil disimpan.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
              Batal
            </Button>
            <Button type="button" disabled={isSubmitting} onClick={handleSubmit}>
              {isSubmitting && <Spinner className="mr-2" />}
              <Upload className="mr-2 size-4" />
              {editingAccount ? "Simpan Perubahan" : "Simpan Akun"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingAccount)} onOpenChange={(open) => !open && setDeletingAccount(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus akun sosmed?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingAccount
                ? `Akun ${deletingAccount.nama_profil} (${deletingAccount.username}) akan dihapus dari daftar aktif.`
                : "Akun sosmed ini akan dihapus dari daftar aktif."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {isDeleting && <Spinner className="mr-2" />}
              Hapus Akun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
