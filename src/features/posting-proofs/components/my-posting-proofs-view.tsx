"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { ChartColumnBig, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { formatDateTime, formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { cn } from "@/lib/utils";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { listPostingProofs } from "../api/posting-proofs-api";
import type { PostingProofFilters, PostingProofItem } from "../types/posting-proof.type";

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

function getAutoStatsFreshness(item: PostingProofItem) {
  const timestamps = item.links
    .map((link) => link.stats?.auto_updated_at)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left));

  return timestamps[0] ?? null;
}

export function MyPostingProofsView() {
  const { isAuthorized, isPending } = useRoleGuard(["pic_sosmed"]);
  const [items, setItems] = useState<PostingProofItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<PostingProofFilters["status"]>("all");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listPostingProofs({
        status,
        search: search || undefined,
        page,
        limit: 20,
      });
      setItems(response.data);
      setTotal(response.meta?.total ?? response.data.length);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat riwayat posting");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    if (!isPending && isAuthorized) {
      void loadData();
    }
  }, [isAuthorized, isPending, loadData]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / 20)), [total]);

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
            Posting / Riwayat Saya
          </Badge>
          <div className="space-y-2">
            <h1 className="font-semibold text-3xl tracking-tight">Postingan Saya</h1>
            <p className="max-w-2xl text-muted-foreground text-sm leading-6">
              Daftar task posting dan bukti yang pernah Anda kirim, lengkap dengan status validasi dan freshness
              statistik otomatis.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 py-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_auto]">
          <div className="relative">
            <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cari judul bank konten"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <Select
            value={status}
            onValueChange={(value) => {
              setPage(1);
              setStatus(value as PostingProofFilters["status"]);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="menunggu_bukti_posting">Menunggu Bukti</SelectItem>
              <SelectItem value="bukti_dikirim">Bukti Dikirim</SelectItem>
              <SelectItem value="bukti_valid">Bukti Valid</SelectItem>
              <SelectItem value="bukti_ditolak">Bukti Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Spinner />
              <span>Memuat riwayat posting...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank Konten</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status Task</TableHead>
                  <TableHead>Status Bukti</TableHead>
                  <TableHead>Freshness Stats</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Belum ada bukti posting yang cocok dengan filter saat ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-80 align-top">
                        <div className="space-y-1">
                          <p className="line-clamp-2 whitespace-normal font-medium">{item.bank_content_judul}</p>
                          <p className="text-muted-foreground text-xs">{item.pic.regional ?? "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex max-w-48 flex-wrap gap-2">
                          {item.platform_targets.map((platform) => (
                            <Badge key={platform} variant="outline" className="rounded-full px-3 py-1">
                              {formatPlatformLabel(platform)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge
                          variant="outline"
                          className={cn("rounded-full px-3 py-1", getStatusBadgeClass(item.status))}
                        >
                          {item.status.replaceAll("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-1 text-sm">
                          <p>Link: {item.links.length}</p>
                          <p>Valid: {item.links.filter((link) => link.validation_status === "valid").length}</p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        {getAutoStatsFreshness(item)
                          ? formatDateTime(getAutoStatsFreshness(item))
                          : "Menunggu scraping"}
                      </TableCell>
                      <TableCell className="align-top">{formatDateTime(item.updated_at)}</TableCell>
                      <TableCell className="align-top">
                        <div className="flex justify-end gap-2">
                          {item.evidence_drive_link ? (
                            <Button asChild variant="outline" size="sm">
                              <a href={item.evidence_drive_link} target="_blank" rel="noreferrer">
                                <ExternalLink className="mr-2 size-4" />
                                Drive
                              </a>
                            </Button>
                          ) : null}
                          <Button asChild size="sm">
                            <Link href={`/dashboard/postingan-saya/${item.id}`}>
                              <ChartColumnBig className="mr-2 size-4" />
                              Detail
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent>
          <TablePagination
            summary={`Halaman ${page} dari ${totalPages} (${total} total task)`}
            page={page}
            totalPages={totalPages}
            disabled={loading}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
