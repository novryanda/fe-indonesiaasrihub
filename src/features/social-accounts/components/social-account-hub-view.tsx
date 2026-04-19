"use client";

import { type ComponentType, useCallback, useEffect, useState } from "react";

import { BarChart3, CircleAlert, Clock3, ExternalLink, Link2, ShieldCheck, Trophy, UserRound, UsersRound } from "lucide-react";
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
import { TablePagination } from "@/components/ui/table-pagination";
import { PlatformIcon } from "@/features/content-shared/components/platform-icon";
import {
  formatDateTime,
  formatNumber,
  formatPlatformLabel,
  getPlatformAccentClassName,
} from "@/features/content-shared/utils/content-formatters";
import { getOfficerDashboard } from "@/features/dashboard/api/dashboard-api";
import type { OfficerDashboardData } from "@/features/dashboard/types/dashboard.type";
import { cn } from "@/lib/utils";
import { useRoleGuard } from "@/shared/hooks/use-role-guard";

import {
  delegateSocialAccount,
  listSocialAccounts,
  listSocialPicOptions,
  upsertSocialAccountWeeklyStat,
} from "../api/social-accounts-api";
import type {
  SocialAccountDelegationStatus,
  SocialAccountItem,
  SocialAccountListMeta,
  SocialPicOption,
} from "../types/social-account.type";

function getPlatformCardAccentClassName(platform: SocialAccountItem["platform"]) {
  switch (platform) {
    case "instagram":
      return "from-fuchsia-500/18 via-rose-500/10 to-transparent";
    case "facebook":
      return "from-blue-500/18 via-sky-500/10 to-transparent";
    case "x":
      return "from-zinc-500/18 via-zinc-400/10 to-transparent";
    case "youtube":
      return "from-red-500/18 via-rose-500/10 to-transparent";
    case "tiktok":
      return "from-cyan-500/18 via-pink-500/10 to-transparent";
    default:
      return "from-emerald-500/14 via-teal-500/8 to-transparent";
  }
}

function getPlatformAvatarClassName(platform: SocialAccountItem["platform"]) {
  switch (platform) {
    case "instagram":
      return "border-fuchsia-200/80 bg-linear-to-br from-fuchsia-50 to-rose-50";
    case "facebook":
      return "border-blue-200/80 bg-linear-to-br from-blue-50 to-sky-50";
    case "x":
      return "border-zinc-200/80 bg-linear-to-br from-zinc-50 to-zinc-100";
    case "youtube":
      return "border-red-200/80 bg-linear-to-br from-red-50 to-rose-50";
    case "tiktok":
      return "border-cyan-200/80 bg-linear-to-br from-cyan-50 to-pink-50";
    default:
      return "border-emerald-200/80 bg-linear-to-br from-emerald-50 to-teal-50";
  }
}

function formatDelegationStatusLabel(value: SocialAccountDelegationStatus) {
  switch (value) {
    case "sudah_didelegasikan":
      return "Sudah Didelegasikan";
    case "delegasi_dicabut":
      return "Delegasi Dicabut";
    default:
      return "Belum Didelegasikan";
  }
}

function getDelegationStatusClassName(value: SocialAccountDelegationStatus) {
  switch (value) {
    case "sudah_didelegasikan":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "delegasi_dicabut":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
  }
}

function formatMetricValue(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return formatNumber(value);
}

function ProfileMetricCard(props: { label: string; value: number | null | undefined; helper: string }) {
  return (
    <div className="group-hover:-translate-y-0.5 rounded-[1.15rem] border border-border/70 bg-background/95 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition-transform duration-200">
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">{props.label}</p>
      <p className="mt-1.5 font-semibold text-base leading-none">{formatMetricValue(props.value)}</p>
      <p className="mt-1 text-muted-foreground text-xs">{props.helper}</p>
    </div>
  );
}

function OperationalInfoCard(props: { label: string; value: string; icon: ComponentType<{ className?: string }> }) {
  const Icon = props.icon;

  return (
    <div className="rounded-[1rem] border border-border/70 bg-muted/25 px-3.5 py-3 transition-colors duration-200 group-hover:bg-muted/35">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.2em]">
        <Icon className="size-3.5" />
        <span>{props.label}</span>
      </div>
      <p className="mt-1.5 line-clamp-2 font-medium text-sm leading-5">{props.value}</p>
    </div>
  );
}

export function SocialAccountHubView() {
  const { isAuthorized, isPending, role } = useRoleGuard(["superadmin", "pic_sosmed"]);
  const [items, setItems] = useState<SocialAccountItem[]>([]);
  const [meta, setMeta] = useState<SocialAccountListMeta>({ page: 1, limit: 9, total: 0 });
  const [page, setPage] = useState(1);
  const [pics, setPics] = useState<SocialPicOption[]>([]);
  const [officerDashboard, setOfficerDashboard] = useState<OfficerDashboardData | null>(null);
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsResponse, picOptions, officerResponse] = await Promise.all([
        listSocialAccounts({
          verification_status: role === "pic_sosmed" ? "all" : "verified",
          page,
          limit: 9,
        }),
        role === "pic_sosmed" ? Promise.resolve([]) : listSocialPicOptions(),
        role === "pic_sosmed" ? getOfficerDashboard() : Promise.resolve(null),
      ]);
      setItems(accountsResponse.data);
      setMeta(accountsResponse.meta ?? { page, limit: 9, total: accountsResponse.data.length });
      setPics(picOptions);
      setOfficerDashboard(officerResponse?.data ?? null);
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Gagal memuat data akun sosmed");
    } finally {
      setLoading(false);
    }
  }, [page, role]);

  useEffect(() => {
    if (!isPending && isAuthorized) {
      void loadData();
    }
  }, [isAuthorized, isPending, loadData]);

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

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const paginationSummary =
    meta.total === 0
      ? "Belum ada akun sosmed untuk ditampilkan."
      : `Halaman ${page} dari ${totalPages} (${meta.total} total akun)`;

  return (
    <>
      <div className="space-y-6">
        <Card className="app-bg-hero app-border-soft">
          <CardContent className="space-y-4 px-6 py-8 md:px-8">
            <Badge
              variant="outline"
              className="rounded-full border-emerald-200 bg-background/75 px-3 py-1 text-emerald-700 dark:bg-card/75"
            >
              Akun Sosmed / {role === "pic_sosmed" ? "Akun Saya" : "Delegasi"}
            </Badge>
            <div className="space-y-2">
              <h1 className="font-semibold text-3xl tracking-tight">
                {role === "pic_sosmed" ? "Akun Sosmed Saya" : "PIC Akun Sosmed"}
              </h1>
              {role === "pic_sosmed" && officerDashboard?.ranking ? (
                <p className="max-w-3xl text-muted-foreground text-sm leading-6">
                  Posisi Anda saat ini #{officerDashboard.ranking.current_rank ?? "-"} dari{" "}
                  {formatNumber(officerDashboard.ranking.total_pic_wilayah)} PIC wilayah {officerDashboard.ranking.wilayah_nama} untuk periode{" "}
                  {officerDashboard.ranking.period_label}.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {role === "pic_sosmed" && officerDashboard ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-amber-200 bg-amber-50/60">
              <CardContent className="space-y-3 py-6">
                <div className="flex items-center justify-between">
                  <p className="text-amber-800 text-sm">Ranking Saya</p>
                  <Trophy className="size-5 text-amber-700" />
                </div>
                <div>
                  <p className="font-semibold text-3xl tracking-tight text-amber-900">
                    #{officerDashboard.ranking?.current_rank ?? "-"}
                  </p>
                  <p className="mt-1 text-amber-800/90 text-sm">
                    {officerDashboard.ranking
                      ? `Dari ${formatNumber(officerDashboard.ranking.total_pic_wilayah)} PIC • ${officerDashboard.ranking.period_label}`
                      : "Ranking belum tersedia"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-foreground/10">
              <CardContent className="space-y-3 py-6">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">Total Akun</p>
                  <UsersRound className="size-5 text-sky-600" />
                </div>
                <div>
                  <p className="font-semibold text-3xl tracking-tight">{formatNumber(officerDashboard.stats.total_akun)}</p>
                  <p className="mt-1 text-muted-foreground text-sm">Akun delegasi aktif untuk Anda</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-sky-200 bg-sky-50/60">
              <CardContent className="space-y-3 py-6">
                <div className="flex items-center justify-between">
                  <p className="text-sky-800 text-sm">Perlu Kirim Bukti</p>
                  <Clock3 className="size-5 text-sky-700" />
                </div>
                <div>
                  <p className="font-semibold text-3xl tracking-tight text-sky-900">
                    {formatNumber(officerDashboard.stats.perlu_lampirkan_bukti)}
                  </p>
                  <p className="mt-1 text-sky-800/90 text-sm">Task yang belum dilampirkan bukti posting</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-rose-200 bg-rose-50/60">
              <CardContent className="space-y-3 py-6">
                <div className="flex items-center justify-between">
                  <p className="text-rose-800 text-sm">Bukti Ditolak</p>
                  <CircleAlert className="size-5 text-rose-700" />
                </div>
                <div>
                  <p className="font-semibold text-3xl tracking-tight text-rose-900">
                    {formatNumber(officerDashboard.stats.bukti_ditolak)}
                  </p>
                  <p className="mt-1 text-rose-800/90 text-sm">Perlu perbaikan atau submit ulang</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Spinner />
              <span>Memuat akun sosmed...</span>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className="group hover:-translate-y-1 relative overflow-hidden border-foreground/10 bg-linear-to-br from-background via-background to-muted/25 shadow-sm transition-all duration-200 hover:border-foreground/15 hover:shadow-lg"
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-r opacity-100",
                      getPlatformCardAccentClassName(item.platform),
                    )}
                  />
                  <CardContent className="space-y-4 p-4">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium text-xs",
                              getPlatformAccentClassName(item.platform),
                            )}
                          >
                            <PlatformIcon platform={item.platform} className="size-4" iconClassName="h-4 w-4" />
                            <span>{formatPlatformLabel(item.platform)}</span>
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full px-3 py-1 font-medium",
                              getDelegationStatusClassName(item.delegation_status),
                            )}
                          >
                            {formatDelegationStatusLabel(item.delegation_status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button asChild variant="ghost" size="icon-sm" className="rounded-full">
                            <a href={item.profile_url} target="_blank" rel="noreferrer" aria-label="Buka profil">
                              <ExternalLink className="size-4" />
                            </a>
                          </Button>
                          {role === "pic_sosmed" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-full px-3 text-xs"
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
                              <BarChart3 className="mr-1.5 size-3.5" />
                              Statistik
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex size-12 shrink-0 items-center justify-center rounded-[1.2rem] border shadow-sm transition-transform duration-200 group-hover:scale-[1.04]",
                            getPlatformAvatarClassName(item.platform),
                          )}
                        >
                          <PlatformIcon platform={item.platform} className="size-7" iconClassName="h-7 w-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <a
                            href={item.profile_url}
                            target="_blank"
                            rel="noreferrer"
                            className="group block max-w-full"
                          >
                            <h2 className="truncate font-semibold text-[1.02rem] leading-tight tracking-tight transition-colors group-hover:text-primary">
                              {item.nama_profil}
                            </h2>
                            <p className="mt-1 text-muted-foreground text-sm transition-colors group-hover:text-foreground">
                              {item.username}
                            </p>
                          </a>
                          <p className="mt-2 line-clamp-1 text-muted-foreground text-xs">
                            {item.officer_name ? `PIC: ${item.officer_name}` : "PIC belum ditentukan"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        <ProfileMetricCard label="Posts" value={item.post_count} helper="Terbaru" />
                        <ProfileMetricCard label="Followers" value={item.followers} helper="Audiens" />
                        <ProfileMetricCard
                          label="Following"
                          value={item.following_count}
                          helper={item.following_count === null ? "Belum ada" : "Diikuti"}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <OperationalInfoCard label="Wilayah" value={item.wilayah_name} icon={UsersRound} />
                        <OperationalInfoCard
                          label="PIC"
                          value={item.officer_name ?? "Belum ada PIC"}
                          icon={UserRound}
                        />
                        <OperationalInfoCard
                          label="Delegasi"
                          value={item.delegated_at ? formatDateTime(item.delegated_at) : "-"}
                          icon={ShieldCheck}
                        />
                        <OperationalInfoCard
                          label="Stat Update"
                          value={item.last_stat_update ? formatDateTime(item.last_stat_update) : "-"}
                          icon={Clock3}
                        />
                      </div>

                      {role !== "pic_sosmed" ? (
                        <div className="space-y-2.5 border-border/60 border-t pt-3">
                          <Select
                            value={selectedPic[item.id] ?? item.officer_id ?? ""}
                            onValueChange={(value) => setSelectedPic((previous) => ({ ...previous, [item.id]: value }))}
                          >
                            <SelectTrigger className="h-9 w-full text-xs">
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

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 flex-1 rounded-xl"
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
                                  toast.error(
                                    errorValue instanceof Error ? errorValue.message : "Gagal mendelegasikan akun",
                                  );
                                } finally {
                                  setActiveId(null);
                                }
                              }}
                            >
                              {activeId === item.id ? (
                                <Spinner className="mr-1.5" />
                              ) : (
                                <Link2 className="mr-1.5 size-3.5" />
                              )}
                              Delegasikan
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 flex-1 rounded-xl"
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
                                  toast.error(
                                    errorValue instanceof Error ? errorValue.message : "Gagal mencabut delegasi",
                                  );
                                } finally {
                                  setActiveId(null);
                                }
                              }}
                            >
                              <ShieldCheck className="mr-1.5 size-3.5" />
                              Cabut
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {items.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  {role === "pic_sosmed"
                    ? "Belum ada akun yang didelegasikan ke Anda."
                    : "Belum ada akun verified untuk didelegasikan."}
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                <TablePagination
                  summary={paginationSummary}
                  page={page}
                  totalPages={totalPages}
                  disabled={loading}
                  onPageChange={setPage}
                />
              </div>
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
              <Input
                type="date"
                value={statForm.week_date}
                onChange={(event) => setStatForm((previous) => ({ ...previous, week_date: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Followers</Label>
              <Input
                type="number"
                min={0}
                value={String(statForm.followers)}
                onChange={(event) =>
                  setStatForm((previous) => ({ ...previous, followers: Number(event.target.value || 0) }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Jumlah Posting</Label>
              <Input
                type="number"
                min={0}
                value={String(statForm.posting_count)}
                onChange={(event) =>
                  setStatForm((previous) => ({ ...previous, posting_count: Number(event.target.value || 0) }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Total Reach</Label>
              <Input
                type="number"
                min={0}
                value={String(statForm.total_reach)}
                onChange={(event) =>
                  setStatForm((previous) => ({ ...previous, total_reach: Number(event.target.value || 0) }))
                }
              />
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
