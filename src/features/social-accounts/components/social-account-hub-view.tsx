"use client";

import { useEffect, useState } from "react";

import { BarChart3, Link2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime, formatPlatformLabel } from "@/features/content-shared/utils/content-formatters";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import {
  delegateSocialAccount,
  listSocialAccounts,
  listSocialPicOptions,
  upsertSocialAccountWeeklyStat,
} from "../api/social-accounts-api";
import type { SocialAccountItem, SocialPicOption } from "../types/social-account.type";

export function SocialAccountHubView() {
  const { isAuthorized, isPending, role } = useRoleGuard(["superadmin", "pic_sosmed"]);
  const [items, setItems] = useState<SocialAccountItem[]>([]);
  const [pics, setPics] = useState<SocialPicOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedPic, setSelectedPic] = useState<Record<string, string>>({});
  const [statDialog, setStatDialog] = useState<{ open: boolean; account?: SocialAccountItem }>({ open: false });
  const [statForm, setStatForm] = useState({
    week_date: "",
    followers: 0,
    posting_count: 0,
    total_reach: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [accountsResponse, picOptions] = await Promise.all([
        listSocialAccounts({
          verification_status: role === "pic_sosmed" ? "all" : "verified",
          page: 1,
          limit: 50,
        }),
        role === "pic_sosmed" ? Promise.resolve([]) : listSocialPicOptions(),
      ]);
      setItems(accountsResponse.data);
      setPics(picOptions);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat data akun sosmed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending && isAuthorized) {
      void loadData();
    }
  }, [isAuthorized, isPending, role]);

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
              Akun Sosmed / {role === "pic_sosmed" ? "Akun Saya" : "Delegasi"}
            </Badge>
            <div className="space-y-2">
              <h1 className="font-semibold text-3xl tracking-tight">
                {role === "pic_sosmed" ? "Akun Sosmed Delegasi Saya" : "Delegasi Akun Sosmed"}
              </h1>
              <p className="max-w-2xl text-muted-foreground text-sm leading-6">
                {role === "pic_sosmed"
                  ? "PIC sosmed hanya melihat akun yang telah didelegasikan dan dapat memperbarui statistik mingguan."
                  : "Superadmin mendelegasikan akun ke PIC sosmed dengan batas wilayah akun yang sama."}
              </p>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Spinner />
              <span>Memuat akun sosmed...</span>
            </CardContent>
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
                        <Badge variant="outline">{formatPlatformLabel(item.platform)}</Badge>
                        <Badge variant="outline">{item.delegation_status.replaceAll("_", " ")}</Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">{item.username}</p>
                    </div>

                    {role === "pic_sosmed" ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setStatDialog({ open: true, account: item });
                          setStatForm({
                            week_date: "",
                            followers: item.followers,
                            posting_count: 0,
                            total_reach: 0,
                          });
                        }}
                      >
                        <BarChart3 className="mr-2 size-4" />
                        Update Statistik
                      </Button>
                    ) : null}
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border bg-muted/20 p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Wilayah Akun</p>
                      <p className="mt-2 font-medium text-sm">{item.wilayah_name}</p>
                    </div>
                    <div className="rounded-2xl border bg-muted/20 p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">PIC Saat Ini</p>
                      <p className="mt-2 font-medium text-sm">{item.officer_name ?? "Belum ada"}</p>
                    </div>
                    <div className="rounded-2xl border bg-muted/20 p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Delegated At</p>
                      <p className="mt-2 font-medium text-sm">{item.delegated_at ? formatDateTime(item.delegated_at) : "-"}</p>
                    </div>
                    <div className="rounded-2xl border bg-muted/20 p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Last Stat Update</p>
                      <p className="mt-2 font-medium text-sm">
                        {item.last_stat_update ? formatDateTime(item.last_stat_update) : "-"}
                      </p>
                    </div>
                  </div>

                  {role !== "pic_sosmed" && (
                  <div className="flex flex-col gap-3 border-border/60 border-t pt-4 md:flex-row">
                      <Select
                        value={selectedPic[item.id] ?? item.officer_id ?? ""}
                        onValueChange={(value) => setSelectedPic((previous) => ({ ...previous, [item.id]: value }))}
                      >
                        <SelectTrigger className="w-full md:max-w-sm">
                          <SelectValue placeholder="Pilih PIC sosmed" />
                        </SelectTrigger>
                        <SelectContent>
                          {pics.map((pic) => (
                            <SelectItem key={pic.id} value={pic.id}>
                              {pic.name} {pic.regional ? `• ${pic.regional}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={activeId === item.id}
                          onClick={async () => {
                            const officerId = selectedPic[item.id] ?? item.officer_id ?? "";
                            if (!officerId) {
                              toast.error("Pilih PIC sosmed terlebih dahulu.");
                              return;
                            }

                            setActiveId(item.id);
                            try {
                              await delegateSocialAccount(item.id, {
                                action: "delegate",
                                officer_id: officerId,
                              });
                              toast.success("Akun berhasil didelegasikan.");
                              await loadData();
                            } catch (errorValue) {
                              toast.error(errorValue instanceof Error ? errorValue.message : "Gagal mendelegasikan akun");
                            } finally {
                              setActiveId(null);
                            }
                          }}
                        >
                          {activeId === item.id ? <Spinner className="mr-2" /> : <Link2 className="mr-2 size-4" />}
                          Delegate
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={activeId === item.id || !item.officer_id}
                          onClick={async () => {
                            setActiveId(item.id);
                            try {
                              await delegateSocialAccount(item.id, {
                                action: "revoke",
                              });
                              toast.success("Delegasi berhasil dicabut.");
                              await loadData();
                            } catch (errorValue) {
                              toast.error(errorValue instanceof Error ? errorValue.message : "Gagal mencabut delegasi");
                            } finally {
                              setActiveId(null);
                            }
                          }}
                        >
                          <ShieldCheck className="mr-2 size-4" />
                          Cabut Delegasi
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {items.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  {role === "pic_sosmed"
                    ? "Belum ada akun yang didelegasikan ke Anda."
                    : "Belum ada akun verified untuk didelegasikan."}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <Dialog open={statDialog.open} onOpenChange={(open) => setStatDialog((previous) => ({ ...previous, open }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Statistik Mingguan</DialogTitle>
            <DialogDescription>{statDialog.account?.nama_profil}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Pekan (hari Senin)</Label>
              <Input type="date" value={statForm.week_date} onChange={(event) => setStatForm((previous) => ({ ...previous, week_date: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Followers</Label>
              <Input type="number" min={0} value={String(statForm.followers)} onChange={(event) => setStatForm((previous) => ({ ...previous, followers: Number(event.target.value || 0) }))} />
            </div>
            <div className="grid gap-2">
              <Label>Jumlah Posting</Label>
              <Input type="number" min={0} value={String(statForm.posting_count)} onChange={(event) => setStatForm((previous) => ({ ...previous, posting_count: Number(event.target.value || 0) }))} />
            </div>
            <div className="grid gap-2">
              <Label>Total Reach</Label>
              <Input type="number" min={0} value={String(statForm.total_reach)} onChange={(event) => setStatForm((previous) => ({ ...previous, total_reach: Number(event.target.value || 0) }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatDialog({ open: false })}>
              Tutup
            </Button>
            <Button
              onClick={async () => {
                if (!statDialog.account) {
                  return;
                }

                try {
                  await upsertSocialAccountWeeklyStat(statDialog.account.id, statForm);
                  toast.success("Statistik berhasil diperbarui.");
                  setStatDialog({ open: false });
                  await loadData();
                } catch (errorValue) {
                  toast.error(errorValue instanceof Error ? errorValue.message : "Gagal menyimpan statistik");
                }
              }}
            >
              Simpan Statistik
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
