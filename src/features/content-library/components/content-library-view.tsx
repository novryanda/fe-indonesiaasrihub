"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { CalendarDays, ExternalLink, FileText, FolderOpen, ImageOff, LibraryBig, Search, Upload } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  formatDate,
  formatNumber,
  formatPlatformLabel,
  formatTopikLabel,
  getPlatformAccentClassName,
} from "@/features/content-shared/utils/content-formatters";
import { cn } from "@/lib/utils";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { useContentLibrary } from "../hooks/use-content-library";
import type { BankContentItem } from "../types/content-library.type";
import { BankContentUploadDialog } from "./bank-content-upload-dialog";

function StatsCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="border-foreground/10">
      <CardContent className="flex items-center gap-4 py-6">
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

function BankContentCard({ item }: { item: BankContentItem }) {
  return (
    <Card className="hover:-translate-y-0.5 overflow-hidden border-foreground/10 transition hover:shadow-md">
      <div className="relative aspect-[16/10] overflow-hidden bg-linear-to-br from-emerald-50 via-amber-50 to-zinc-100">
        {item.thumbnail_url ? (
          // biome-ignore lint/performance/noImgElement: remote URL preview is acceptable for card thumbnail
          <img src={item.thumbnail_url} alt={item.judul} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
            <div className="flex size-16 items-center justify-center rounded-full border border-emerald-200 bg-white/70 font-semibold text-2xl text-emerald-700">
              {item.judul.slice(0, 1).toUpperCase()}
            </div>
            <p className="px-6 text-xs">Preview thumbnail belum tersedia</p>
          </div>
        )}
      </div>

      <CardContent className="space-y-4 py-5">
        <div className="space-y-3">
          <h2 className="line-clamp-2 font-semibold text-lg">{item.judul}</h2>
          <div className="flex flex-wrap gap-2">
            {item.platform.map((platform) => (
              <Badge
                key={platform}
                variant="outline"
                className={cn("rounded-full px-3 py-1", getPlatformAccentClassName(platform))}
              >
                {formatPlatformLabel(platform)}
              </Badge>
            ))}
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {formatTopikLabel(item.topik)}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-muted-foreground text-sm">
          <p>{item.regional_asal}</p>
          <p>
            {formatDate(item.created_at)} • {item.tahun_kampanye}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {item.hashtags.slice(0, 3).map((hashtag) => (
            <Badge key={hashtag} variant="secondary" className="rounded-full px-3 py-1">
              {hashtag}
            </Badge>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild variant="outline">
            <Link href={`/konten/bank-konten/${item.id}`}>
              <FileText className="mr-2 size-4" />
              Detail
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={item.drive_link} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 size-4" />
              Lihat Drive
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ContentLibraryView() {
  const { accessToken, role, isAuthorized, isPending } = useRoleGuard([
    "qcc_wcc",
    "wcc",
    "pic_sosmed",
    "superadmin",
  ]);
  const { items, stats, meta, filters, setFilters, isLoading, isUploading, error, availableTopics, createItem } =
    useContentLibrary(accessToken);
  const [uploadOpen, setUploadOpen] = useState(false);

  const canUpload = role === "superadmin";
  const totalPages = useMemo(() => {
    if (!meta) {
      return 1;
    }

    return Math.max(1, Math.ceil(meta.total / meta.limit));
  }, [meta]);

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
      <div className="space-y-6">
        <Card className="border-emerald-100 bg-linear-to-br from-emerald-50 via-background to-amber-50">
          <CardContent className="space-y-4 px-6 py-8 md:px-8">
            <Badge variant="outline" className="rounded-full border-emerald-200 bg-white/70 px-3 py-1 text-emerald-700">
              {role === "superadmin" ? "Konten / Bank Konten" : "Referensi / Bank Konten"}
            </Badge>
            <div className="space-y-2">
              <h1 className="font-semibold text-3xl tracking-tight">Bank Konten</h1>
              <p className="max-w-2xl text-muted-foreground text-sm leading-6">
                Kumpulan konten yang sudah tervalidasi untuk referensi, reuse lintas regional, dan distribusi cepat oleh
                tim lapangan.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Total Konten"
            value={formatNumber(stats?.total_konten)}
            icon={<FolderOpen className="size-5" />}
          />
          <StatsCard
            title="Bulan Ini"
            value={formatNumber(stats?.bulan_ini)}
            icon={<CalendarDays className="size-5" />}
          />
          <StatsCard
            title="Platform"
            value={formatNumber(stats?.platform_count)}
            icon={<LibraryBig className="size-5" />}
          />
          <StatsCard
            title="Topik Aktif"
            value={formatNumber(stats?.topik_aktif)}
            icon={<ImageOff className="size-5" />}
          />
        </div>

        <Card>
          <CardContent className="grid gap-3 py-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.6fr)_auto]">
            <Select
              value={filters.platform}
              onValueChange={(value) =>
                setFilters((previous) => ({ ...previous, platform: value as typeof previous.platform, page: 1 }))
              }
            >
              <SelectTrigger className="w-full">
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
              value={filters.topik}
              onValueChange={(value) => setFilters((previous) => ({ ...previous, topik: value, page: 1 }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Topik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Topik</SelectItem>
                {availableTopics.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {formatTopikLabel(topic)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Cari judul konten"
                value={filters.search}
                onChange={(event) => setFilters((previous) => ({ ...previous, search: event.target.value, page: 1 }))}
              />
            </div>

            {canUpload && (
              <Button type="button" onClick={() => setUploadOpen(true)}>
                <Upload className="mr-2 size-4" />
                Upload Konten
              </Button>
            )}
          </CardContent>
        </Card>

        {error ? (
          <Card>
            <CardContent className="py-6 text-destructive">{error}</CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Spinner />
              <span>Memuat bank konten...</span>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              Belum ada konten yang cocok dengan filter saat ini.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <BankContentCard key={item.id} item={item} />
            ))}
          </div>
        )}

        <Card size="sm">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              Halaman {filters.page} dari {totalPages} {meta ? `(${meta.total} total konten)` : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters((previous) => ({ ...previous, page: Math.max(1, previous.page - 1) }))}
                disabled={filters.page <= 1 || isLoading}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters((previous) => ({ ...previous, page: previous.page + 1 }))}
                disabled={filters.page >= totalPages || isLoading}
              >
                Berikutnya
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BankContentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        isSubmitting={isUploading}
        onSubmit={async (payload) => {
          try {
            const result = await createItem(payload);
            toast.success(result.message);
            setUploadOpen(false);
          } catch (errorValue) {
            toast.error(errorValue instanceof Error ? errorValue.message : "Gagal mengunggah konten");
          }
        }}
      />
    </>
  );
}
