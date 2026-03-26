"use client";

import { useEffect, useMemo, useState } from "react";

import { ExternalLink, Send } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { BankContentItem } from "@/features/content-library/types/content-library.type";
import type { ContentPlatform } from "@/features/content-shared/types/content.type";
import { formatDate, formatPlatformLabel, formatTopikLabel } from "@/features/content-shared/utils/content-formatters";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { listPostableBankContents, listPostingProofs, submitPostingLinksFromBankContent } from "../api/posting-proofs-api";
import type { SubmitPostingLinkPayloadItem } from "../types/posting-proof.type";
import { listSocialAccounts } from "@/features/social-accounts/api/social-accounts-api";
import type { SocialAccountItem } from "@/features/social-accounts/types/social-account.type";

interface DraftLinkRow {
  social_account_id: string;
  post_url: string;
  posted_at: string;
  catatan_officer: string;
}

export function SubmitPostingView() {
  const { isAuthorized, isPending } = useRoleGuard(["pic_sosmed"]);
  const [contents, setContents] = useState<BankContentItem[]>([]);
  const [accounts, setAccounts] = useState<SocialAccountItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Record<ContentPlatform, DraftLinkRow>>>({});
  const [evidenceLinks, setEvidenceLinks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const accountOptionsByPlatform = useMemo(
    () =>
      accounts.reduce<Record<string, SocialAccountItem[]>>((accumulator, account) => {
        const key = account.platform;
        accumulator[key] = [...(accumulator[key] ?? []), account];
        return accumulator;
      }, {}),
    [accounts],
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [contentsResponse, accountsResponse, proofsResponse] = await Promise.all([
        listPostableBankContents(),
        listSocialAccounts({
          verification_status: "verified",
          delegation_status: "sudah_didelegasikan",
          page: 1,
          limit: 100,
        }),
        listPostingProofs({
          status: "all",
          page: 1,
          limit: 100,
        }),
      ]);
      const submittedBankContentIds = new Set(proofsResponse.data.map((item) => item.bank_content_id));
      setContents(contentsResponse.data.filter((content) => !submittedBankContentIds.has(content.id)));
      setAccounts(accountsResponse.data);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat data submit posting");
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
            Posting / Submit
          </Badge>
          <div className="space-y-2">
            <h1 className="font-semibold text-3xl tracking-tight">Submit Postingan</h1>
            <p className="max-w-2xl text-muted-foreground text-sm leading-6">
              Pilih konten dari bank konten, tentukan akun sosmed delegasi yang dipakai, lalu kirim link posting untuk
              divalidasi oleh QCC/WCC.
            </p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Spinner />
            <span>Memuat konten approved...</span>
          </CardContent>
        </Card>
      ) : contents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">Belum ada konten bank yang siap diposting.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contents.map((content) => (
            <Card key={content.id} className="border-foreground/10">
              <CardContent className="space-y-5 py-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-xl">{content.judul}</h2>
                    {content.platform.map((platform) => (
                      <Badge key={platform} variant="outline">
                        {formatPlatformLabel(platform)}
                      </Badge>
                    ))}
                    <Badge variant="outline">{formatTopikLabel(content.topik)}</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Bank konten • {content.regional_asal} • Diunggah {formatDate(content.created_at)}
                  </p>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
                  <p>Konten ini akan diposting menggunakan akun sosmed delegasi yang sesuai dengan platform target.</p>
                  <div className="mt-3">
                    <a href={content.drive_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-700 underline-offset-4 hover:underline">
                      <ExternalLink className="size-4" />
                      Buka folder kerja
                    </a>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Link Arsip Drive</Label>
                  <Input
                    placeholder="Opsional, untuk arsip bukti posting"
                    value={evidenceLinks[content.id] ?? ""}
                    onChange={(event) =>
                      setEvidenceLinks((previous) => ({
                        ...previous,
                        [content.id]: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-4">
                  {content.platform.map((platform) => {
                    const draft = drafts[content.id]?.[platform] ?? {
                      social_account_id: "",
                      post_url: "",
                      posted_at: "",
                      catatan_officer: "",
                    };

                    return (
                      <div key={platform} className="grid gap-3 rounded-2xl border p-4">
                        <p className="font-medium text-sm">{formatPlatformLabel(platform)}</p>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label>Akun Sosmed</Label>
                            <Select
                              value={draft.social_account_id}
                              onValueChange={(value) =>
                                setDrafts((previous) => ({
                                  ...previous,
                                  [content.id]: {
                                    ...(previous[content.id] ?? {}),
                                    [platform]: {
                                      ...(previous[content.id]?.[platform] ?? draft),
                                      social_account_id: value,
                                    },
                                  },
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih akun" />
                              </SelectTrigger>
                              <SelectContent>
                                {(accountOptionsByPlatform[platform] ?? []).map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.nama_profil} • {account.username}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-2">
                            <Label>Waktu Posting</Label>
                            <Input
                              type="datetime-local"
                              value={draft.posted_at}
                              onChange={(event) =>
                                setDrafts((previous) => ({
                                  ...previous,
                                  [content.id]: {
                                    ...(previous[content.id] ?? {}),
                                    [platform]: {
                                      ...(previous[content.id]?.[platform] ?? draft),
                                      posted_at: event.target.value,
                                    },
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label>URL Posting</Label>
                          <Input
                            value={draft.post_url}
                            onChange={(event) =>
                              setDrafts((previous) => ({
                                ...previous,
                                [content.id]: {
                                  ...(previous[content.id] ?? {}),
                                  [platform]: {
                                    ...(previous[content.id]?.[platform] ?? draft),
                                    post_url: event.target.value,
                                  },
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={submittingId === content.id}
                    onClick={async () => {
                      const contentDraft = drafts[content.id] ?? {};
                      const payload = content.platform.map((platform): SubmitPostingLinkPayloadItem => {
                        const row = contentDraft[platform];
                        return {
                          platform,
                          social_account_id: row?.social_account_id ?? "",
                          post_url: row?.post_url ?? "",
                          posted_at: row?.posted_at ? new Date(row.posted_at).toISOString() : "",
                          catatan_officer: row?.catatan_officer ?? "",
                        };
                      });

                      if (payload.some((item) => !item.social_account_id || !item.post_url || !item.posted_at)) {
                        toast.error("Semua platform target harus diisi akun, URL posting, dan waktu posting.");
                        return;
                      }

                      setSubmittingId(content.id);
                      try {
                        await submitPostingLinksFromBankContent(content.id, {
                          evidence_drive_link: evidenceLinks[content.id]?.trim() || undefined,
                          links: payload,
                        });
                        toast.success("Link posting berhasil dikirim.");
                        await loadData();
                      } catch (errorValue) {
                        toast.error(errorValue instanceof Error ? errorValue.message : "Gagal submit posting");
                      } finally {
                        setSubmittingId(null);
                      }
                    }}
                  >
                    {submittingId === content.id ? <Spinner className="mr-2" /> : <Send className="mr-2 size-4" />}
                    Kirim Bukti Posting
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
