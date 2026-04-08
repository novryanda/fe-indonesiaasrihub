"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Textarea } from "@/components/ui/textarea";
import { PlatformIcon } from "@/features/content-shared/components/platform-icon";
import { formatDateTime, formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { listPostingProofs, validatePostingLinks } from "../api/posting-proofs-api";
import type {
  PostingProofFilters,
  PostingProofItem,
  ValidatePostingLinkPayloadItem,
} from "../types/posting-proof.type";

const REJECTION_TYPES = [
  "link_tidak_bisa_dibuka",
  "bukan_platform_yang_benar",
  "konten_tidak_sesuai",
  "caption_diubah",
  "watermark_atau_edit_tidak_sah",
  "lainnya",
] as const;

export function PostingValidationView() {
  const { isAuthorized, isPending } = useRoleGuard(["qcc_wcc"]);
  const [items, setItems] = useState<PostingProofItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<PostingProofFilters["status"]>("bukti_dikirim");
  const [drafts, setDrafts] = useState<
    Record<
      string,
      Record<string, { action: ValidatePostingLinkPayloadItem["action"]; rejection_type: string; note: string }>
    >
  >({});

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
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat bukti posting");
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
            Posting / Validasi
          </Badge>
          <div className="space-y-2">
            <h1 className="font-semibold text-3xl tracking-tight">Validasi Posting</h1>
            <p className="max-w-2xl text-muted-foreground text-sm leading-6">
              QCC/WCC memverifikasi bukti posting dari PIC sesuai platform, akun delegasi, dan freshness statistik.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 py-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
          <div className="relative">
            <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cari judul bank konten atau PIC"
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
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bukti_dikirim">Bukti Dikirim</SelectItem>
              <SelectItem value="all">Semua status</SelectItem>
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
              <span>Memuat bukti posting...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PIC / Wilayah</TableHead>
                  <TableHead>Bank Konten</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validasi Link</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Belum ada bukti posting yang menunggu validasi.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="align-top">
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">{item.pic.name}</p>
                          <p className="text-muted-foreground">{item.pic.regional ?? "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-72 align-top">
                        <div className="space-y-2">
                          <p className="line-clamp-2 whitespace-normal font-medium">{item.bank_content_judul}</p>
                          {item.evidence_drive_link ? (
                            <a
                              href={item.evidence_drive_link}
                              target="_blank"
                              rel="noreferrer"
                              className="break-all text-emerald-700 text-xs underline-offset-4 hover:underline"
                            >
                              {item.evidence_drive_link}
                            </a>
                          ) : (
                            <p className="text-muted-foreground text-xs">Arsip drive belum dilampirkan.</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                          {item.status.replaceAll("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-[480px] align-top">
                        <div className="space-y-3">
                          {item.links.map((link) => {
                            const draft = drafts[item.id]?.[link.id] ?? {
                              action: "valid" as const,
                              rejection_type: "",
                              note: "",
                            };

                            return (
                              <div key={link.id} className="rounded-2xl border p-3">
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                  <PlatformIcon platform={link.platform} />
                                  <Badge variant="outline">
                                    {link.social_account?.username ?? "Akun belum terbaca"}
                                  </Badge>
                                  <Badge variant="outline">{link.validation_status}</Badge>
                                  <span className="text-muted-foreground text-xs">
                                    Stats:{" "}
                                    {link.stats?.auto_updated_at
                                      ? formatDateTime(link.stats.auto_updated_at)
                                      : "manual / kosong"}
                                  </span>
                                </div>

                                <a
                                  href={link.post_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block break-all text-emerald-700 text-sm underline-offset-4 hover:underline"
                                >
                                  {link.post_url}
                                </a>

                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                  <div className="grid gap-2">
                                    <Label>Keputusan</Label>
                                    <Select
                                      value={draft.action}
                                      onValueChange={(value) =>
                                        setDrafts((previous) => ({
                                          ...previous,
                                          [item.id]: {
                                            ...(previous[item.id] ?? {}),
                                            [link.id]: {
                                              ...(previous[item.id]?.[link.id] ?? draft),
                                              action: value as ValidatePostingLinkPayloadItem["action"],
                                            },
                                          },
                                        }))
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Pilih hasil validasi" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="valid">Valid</SelectItem>
                                        <SelectItem value="tidak_valid">Tidak Valid</SelectItem>
                                        <SelectItem value="tidak_sesuai">Tidak Sesuai</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {draft.action !== "valid" ? (
                                    <div className="grid gap-2">
                                      <Label>Alasan Penolakan</Label>
                                      <Select
                                        value={draft.rejection_type}
                                        onValueChange={(value) =>
                                          setDrafts((previous) => ({
                                            ...previous,
                                            [item.id]: {
                                              ...(previous[item.id] ?? {}),
                                              [link.id]: {
                                                ...(previous[item.id]?.[link.id] ?? draft),
                                                rejection_type: value,
                                              },
                                            },
                                          }))
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Pilih alasan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {REJECTION_TYPES.map((reason) => (
                                            <SelectItem key={reason} value={reason}>
                                              {reason.replaceAll("_", " ")}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  ) : null}
                                </div>

                                {draft.action !== "valid" ? (
                                  <div className="mt-3 grid gap-2">
                                    <Label>Catatan</Label>
                                    <Textarea
                                      value={draft.note}
                                      onChange={(event) =>
                                        setDrafts((previous) => ({
                                          ...previous,
                                          [item.id]: {
                                            ...(previous[item.id] ?? {}),
                                            [link.id]: {
                                              ...(previous[item.id]?.[link.id] ?? draft),
                                              note: event.target.value,
                                            },
                                          },
                                        }))
                                      }
                                    />
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            disabled={submittingId === item.id}
                            onClick={async () => {
                              const payload = item.links.map((link): ValidatePostingLinkPayloadItem => {
                                const draft = drafts[item.id]?.[link.id] ?? {
                                  action: "valid" as const,
                                  rejection_type: "",
                                  note: "",
                                };

                                return {
                                  link_id: link.id,
                                  action: draft.action,
                                  rejection_type: draft.action === "valid" ? undefined : draft.rejection_type,
                                  note: draft.action === "valid" ? undefined : draft.note,
                                };
                              });

                              if (
                                payload.some(
                                  (entry) =>
                                    entry.action !== "valid" && (!entry.rejection_type?.trim() || !entry.note?.trim()),
                                )
                              ) {
                                toast.error("Semua link yang ditolak wajib memiliki alasan dan catatan.");
                                return;
                              }

                              setSubmittingId(item.id);
                              try {
                                await validatePostingLinks(item.id, payload);
                                toast.success("Validasi bukti posting berhasil disimpan.");
                                await loadData();
                              } catch (errorValue) {
                                toast.error(
                                  errorValue instanceof Error ? errorValue.message : "Gagal memvalidasi bukti posting",
                                );
                              } finally {
                                setSubmittingId(null);
                              }
                            }}
                          >
                            {submittingId === item.id ? (
                              <Spinner className="mr-2" />
                            ) : (
                              <ShieldCheck className="mr-2 size-4" />
                            )}
                            Simpan
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
            summary={`Halaman ${page} dari ${totalPages} (${total} total bukti)`}
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
