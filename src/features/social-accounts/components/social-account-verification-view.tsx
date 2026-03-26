"use client";

import { useEffect, useMemo, useState } from "react";

import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { formatPlatformLabel, formatTimeAgo } from "@/features/content-shared/utils/content-formatters";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import { listSocialAccounts, verifySocialAccount } from "../api/social-accounts-api";
import type { SocialAccountItem } from "../types/social-account.type";

export function SocialAccountVerificationView() {
  const { isAuthorized, isPending } = useRoleGuard(["superadmin"]);
  const [items, setItems] = useState<SocialAccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await listSocialAccounts({
        verification_status: "pending",
        page: 1,
        limit: 50,
      });
      setItems(response.data);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat akun pending");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending && isAuthorized) {
      void loadAccounts();
    }
  }, [isAuthorized, isPending]);

  const pendingCount = useMemo(() => items.length, [items]);

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
            Akun Sosmed / Verifikasi
          </Badge>
          <div className="space-y-2">
            <h1 className="font-semibold text-3xl tracking-tight">Verifikasi Akun Sosmed</h1>
            <p className="max-w-2xl text-muted-foreground text-sm leading-6">
              Superadmin meninjau akun yang diajukan regional sebelum akun masuk ke bank akun aktif dan siap didelegasikan.
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-white/80 p-4 text-sm text-emerald-800">
            {pendingCount} akun menunggu verifikasi.
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Spinner />
            <span>Memuat akun pending...</span>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">Tidak ada akun yang menunggu verifikasi.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="border-foreground/10">
              <CardContent className="space-y-4 py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-xl">{item.nama_profil}</h2>
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        {formatPlatformLabel(item.platform)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {item.username} • Didaftarkan oleh {item.added_by.name} ({item.added_by.regional ?? "Nasional"})
                    </p>
                  </div>
                  <p className="text-muted-foreground text-xs">{formatTimeAgo(item.created_at)}</p>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="font-medium text-sm">URL Profil</p>
                  <a href={item.profile_url} target="_blank" rel="noreferrer" className="mt-1 block text-muted-foreground text-sm underline-offset-4 hover:underline">
                    {item.profile_url}
                  </a>
                </div>

                <div className="grid gap-2">
                  <p className="font-medium text-sm">Catatan Verifikasi</p>
                  <Textarea
                    placeholder="Opsional untuk approve, wajib saat reject."
                    value={notes[item.id] ?? ""}
                    onChange={(event) => setNotes((previous) => ({ ...previous, [item.id]: event.target.value }))}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={actionId === item.id}
                    onClick={async () => {
                      setActionId(item.id);
                      try {
                        await verifySocialAccount(item.id, {
                          action: "verified",
                          note: notes[item.id]?.trim() || undefined,
                        });
                        toast.success("Akun berhasil diverifikasi.");
                        await loadAccounts();
                      } catch (errorValue) {
                        toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memverifikasi akun");
                      } finally {
                        setActionId(null);
                      }
                    }}
                  >
                    {actionId === item.id ? <Spinner className="mr-2" /> : <CheckCircle2 className="mr-2 size-4" />}
                    Setujui
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={actionId === item.id}
                    onClick={async () => {
                      if (!notes[item.id]?.trim()) {
                        toast.error("Catatan wajib diisi saat akun ditolak.");
                        return;
                      }

                      setActionId(item.id);
                      try {
                        await verifySocialAccount(item.id, {
                          action: "rejected",
                          note: notes[item.id].trim(),
                        });
                        toast.success("Akun berhasil ditolak.");
                        await loadAccounts();
                      } catch (errorValue) {
                        toast.error(errorValue instanceof Error ? errorValue.message : "Gagal menolak akun");
                      } finally {
                        setActionId(null);
                      }
                    }}
                  >
                    {actionId === item.id ? <Spinner className="mr-2" /> : <XCircle className="mr-2 size-4" />}
                    Tolak
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
