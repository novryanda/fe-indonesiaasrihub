"use client";

import { useEffect, useState } from "react";

import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { formatPlatformLabel, formatTimeAgo } from "@/features/content-shared/utils/content-formatters";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { listPostingProofs, validatePostingLinks } from "../api/posting-proofs-api";
import type { PostingProofItem, ValidatePostingLinkPayloadItem } from "../types/posting-proof.type";

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
  const [drafts, setDrafts] = useState<
    Record<string, Record<string, { action: ValidatePostingLinkPayloadItem["action"]; rejection_type: string; note: string }>>
  >({});

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await listPostingProofs({
        status: "bukti_dikirim",
        page: 1,
        limit: 50,
      });
      setItems(response.data);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat bukti posting");
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
            Posting / Validasi
          </Badge>
          <div className="space-y-2">
            <h1 className="font-semibold text-3xl tracking-tight">Validasi Posting</h1>
            <p className="max-w-2xl text-muted-foreground text-sm leading-6">
              QCC/WCC memverifikasi link posting yang dikirim PIC sosmed untuk memastikan akun dan kontennya sesuai.
            </p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Spinner />
            <span>Memuat bukti posting...</span>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">Belum ada bukti posting yang menunggu validasi.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="border-foreground/10">
              <CardContent className="space-y-5 py-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-xl">{item.bank_content_judul}</h2>
                    <Badge variant="outline">{item.pic.name}</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">{formatTimeAgo(item.updated_at)}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
                    <p className="mb-2 font-medium">Drive Bank Konten</p>
                    <a
                      href={item.bank_content_drive_link}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-emerald-700 underline-offset-4 hover:underline"
                    >
                      {item.bank_content_drive_link}
                    </a>
                  </div>
                  <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
                    <p className="mb-2 font-medium">Arsip Drive PIC</p>
                    {item.evidence_drive_link ? (
                      <a
                        href={item.evidence_drive_link}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-emerald-700 underline-offset-4 hover:underline"
                      >
                        {item.evidence_drive_link}
                      </a>
                    ) : (
                      <p className="text-muted-foreground">Belum dilampirkan.</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4">
                  {item.links.map((link) => {
                    const draft = drafts[item.id]?.[link.id] ?? {
                      action: "valid" as const,
                      rejection_type: "",
                      note: "",
                    };

                    return (
                      <div key={link.id} className="grid gap-3 rounded-2xl border p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{formatPlatformLabel(link.platform)}</Badge>
                          <Badge variant="outline">{link.social_account?.username ?? "Akun belum terbaca"}</Badge>
                        </div>

                        <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
                          <p className="break-all">{link.post_url}</p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
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

                          {draft.action !== "valid" && (
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
                          )}
                        </div>

                        {draft.action !== "valid" && (
                          <div className="grid gap-2">
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
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
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
                        toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memvalidasi bukti posting");
                      } finally {
                        setSubmittingId(null);
                      }
                    }}
                  >
                    {submittingId === item.id ? <Spinner className="mr-2" /> : <ShieldCheck className="mr-2 size-4" />}
                    Simpan Validasi
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
